import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";

// ============================================================================
// ADJUST HERE: CONFIGURATION CONSTANTS
// ============================================================================
// Maximum 3D tilt angle in degrees (higher = steeper tilt)
const MAX_TILT = 15;

// Multiplier for mouse movement intensity (1.0 = 1:1 ratio)
const TILT_SENSITIVITY = 0.9;

// Padding around card edge in px (SET TO 0 TO PREVENT PREMATURE ACTION BEFORE TOUCHING EDGE)
const TILT_ACTIVATION_PADDING = 2; // ADJUST HERE: Change padding boundary (0 = strict card edge)

// Edge damping factor (higher = more resistance near card borders)
const EDGE_DAMPING = 0.45;

// Interpolation / LERP speed (0.01 = super smooth/slow, 0.5 = snappy/fast)
const ROTATION_LERP = 0.16; // ADJUST HERE: Lower for smoother rotation, higher for faster tracking

// Snap-back spring return curves
const HOVER_RETURN_TRANSITION =
    "transform 0.3s ease-out, box-shadow 0.3s ease-out";

// ADJUST HERE: THE BOUNCE (the spring-back after you let go of a drag)
//
// Do NOT put a cubic-bezier overshoot back here. A cubic-bezier can only ever
// overshoot ONCE, and buying that overshoot means pushing its second control
// point past y = 1, which bends the curve so hard the turnaround reads as a
// flick rather than a settle. A real spring overshoots a little and then rings
// down. `linear()` is a piecewise-linear easing, so sampling a damped harmonic
// oscillator into it gives a true spring with no animation library.
const SPRING_DURATION = 0.7; // seconds
const SPRING_DAMPING_RATIO = 0.55; // < 1 bounces; lower = bouncier, 1 = no overshoot at all
const SPRING_SETTLE = 6.5; // e^-6.5, so ~0.15% of the throw is left at the end
const SPRING_SAMPLES = 64; // stops in the linear() curve; 64 lands them ~11ms apart

// Unit step response of a damped spring, sampled into a linear() easing.
// At 0.62 damping this peaks at 1.083 (an 8.4% overshoot) 38% of the way in and
// is back within 2% of rest by 58% -- one soft bounce plus a whisper of a
// second, instead of the old single hard flick.
const buildSpringEasing = () => {
    const zeta = SPRING_DAMPING_RATIO;
    const omega = SPRING_SETTLE / (zeta * SPRING_DURATION);
    const omegaDamped = omega * Math.sqrt(1 - zeta * zeta);
    const stops = [];
    for (let i = 0; i <= SPRING_SAMPLES; i += 1) {
        const t = (i / SPRING_SAMPLES) * SPRING_DURATION;
        const ring =
            Math.cos(omegaDamped * t) +
            ((zeta * omega) / omegaDamped) * Math.sin(omegaDamped * t);
        stops.push(Number((1 - Math.exp(-zeta * omega * t) * ring).toFixed(4)));
    }
    // Pin the ends. The sampled curve lands on 0.99944, and an easing that does
    // not finish at exactly 1 leaves the card a hair off its rest position.
    stops[0] = 0;
    stops[stops.length - 1] = 1;
    return `linear(${stops.join(", ")})`;
};

// `linear()` needs Chromium 113+ / Safari 17.2+ / Firefox 112+. If it were
// missing, the whole `transition` shorthand would be invalid and the card would
// snap home with no animation at all, so fall back to a gentle single overshoot
// rather than trusting it blind.
const SPRING_EASING = (() => {
    const easing = buildSpringEasing();
    const supported =
        typeof CSS !== "undefined" &&
        typeof CSS.supports === "function" &&
        CSS.supports("transition-timing-function", easing);
    return supported ? easing : "cubic-bezier(0.22, 1.15, 0.36, 1)";
})();

// transform and box-shadow share ONE curve on purpose. They used to run on
// different ones (spring vs plain ease-out), so the shadow finished settling
// while the card was still swinging back and visibly came unstuck from it.
const SPRING_TRANSITION = `transform ${SPRING_DURATION}s ${SPRING_EASING}, box-shadow ${SPRING_DURATION}s ${SPRING_EASING}`;

// Backstop for a transitionend that never arrives (interrupted drag, tab
// switch). Must outlast the transition, hence the +100ms.
const SPRING_TIMEOUT_MS = Math.round(SPRING_DURATION * 1000) + 100;

// The resting shadow from index.css, padded with a second, fully transparent
// layer. The drag writes a TWO-layer box-shadow, so releasing straight back to
// the one-layer CSS value made box-shadow interpolate between mismatched lists:
// layer 2 fell away to nothing while layer 1 jumped 0.24 -> 0.4 alpha and 42px
// -> 40px blur, and the shadow popped darker partway through the bounce. Two
// layers in, two layers out. The transparent one paints nothing, so the resting
// card looks exactly as it did.
// KEEP LAYER 1 BYTE-IDENTICAL TO `.tilt-card`'s box-shadow in index.css.
const SPRING_REST_SHADOW =
    "0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 rgba(0, 0, 0, 0)";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;
const dampEdge = (value) => value / (1 + EDGE_DAMPING * Math.abs(value));

const TiltCard = ({ media, children, avatar, contact, zIndex, onPress }) => {
    const cardRef = useRef(null);
    const interactionRef = useRef(null);
    const glossRef = useRef(null);
    const boundsRef = useRef(null);
    const animationFrameRef = useRef(null);
    const snapTimerRef = useRef(null);
    // Kept in a ref so the pointerdown effect below never has to re-subscribe
    // just because the parent re-rendered with a fresh inline callback.
    const onPressRef = useRef(onPress);
    useEffect(() => {
        onPressRef.current = onPress;
    }, [onPress]);
    const dragRef = useRef({
        isDragging: false,
        isSnapping: false,
        pointerId: null,
        captureTarget: null,
        startX: 0,
        startY: 0,
        deltaX: 0,
        deltaY: 0,
    });
    const motionRef = useRef({
        currentRotateX: 0,
        currentRotateY: 0,
        targetRotateX: 0,
        targetRotateY: 0,
        deltaX: 0,
        deltaY: 0,
        shadowX: 0,
        shadowY: 20,
        percentX: 50,
        percentY: 50,
    });

    const updateBounds = useCallback(() => {
        if (cardRef.current) {
            boundsRef.current = cardRef.current.getBoundingClientRect();
        }
    }, []);

    useEffect(() => {
        const card = cardRef.current;
        const interactionArea = interactionRef.current;
        const gloss = glossRef.current;
        if (!card || !interactionArea || !gloss) return;

        // [OPTION 1: macOS Pop & 3D Settle]
        gsap.fromTo(
            interactionArea,
            {
                scale: 0.65,
                opacity: 0,
                y: 35,
                rotateX: -12,
            },
            {
                scale: 1,
                opacity: 1,
                y: 0,
                rotateX: 0,
                duration: 0.55,
                ease: "back.out(1.4)",
                clearProps: "scale,opacity,y,rotateX",
                onComplete: () => {
                    updateBounds();
                },
            }
        );

        /*
        // [OPTION: Scale-Up & Fade Animation]
        gsap.fromTo(
            interactionArea,
            {
                scale: 0.85,
                opacity: 0,
            },
            {
                scale: 1,
                opacity: 1,
                duration: 0.4,
                ease: "power3.out",
                clearProps: "scale,opacity",
                onComplete: () => {
                    updateBounds();
                },
            }
        );
        */

        // Soft initial gloss light sweep across card upon landing
        gsap.fromTo(
            gloss,
            {
                opacity: 0,
                background:
                    "radial-gradient(circle at 15% 20%, rgba(255, 255, 255, 0.45), transparent 50%)",
            },
            {
                opacity: 0.85,
                background:
                    "radial-gradient(circle at 85% 80%, rgba(255, 255, 255, 0.45), transparent 50%)",
                duration: 0.7,
                delay: 0.15,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to(gloss, {
                        opacity: 0,
                        duration: 0.35,
                        clearProps: "background",
                    });
                },
            }
        );


        const cancelRenderFrame = () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };

        const renderFrame = () => {
            animationFrameRef.current = null;

            if (dragRef.current.isSnapping) return;

            const motion = motionRef.current;
            motion.currentRotateX = lerp(
                motion.currentRotateX,
                motion.targetRotateX,
                ROTATION_LERP,
            );
            motion.currentRotateY = lerp(
                motion.currentRotateY,
                motion.targetRotateY,
                ROTATION_LERP,
            );

            card.classList.add("is-interacting");
            card.style.transition = "none";
            card.style.transform = `perspective(1000px) translate3d(${motion.deltaX}px, ${motion.deltaY}px, 0px) rotateX(${motion.currentRotateX}deg) rotateY(${motion.currentRotateY}deg)`;
            card.style.boxShadow = `${motion.shadowX}px ${motion.shadowY}px 42px rgba(0, 0, 0, 0.24), 0 14px 28px rgba(0, 0, 0, 0.16)`;

            gloss.style.opacity = "1";
            gloss.style.background = `radial-gradient(circle at ${motion.percentX}% ${motion.percentY}%, rgba(255, 255, 255, 0.25), transparent 60%)`;

            const rotationIsSettled =
                Math.abs(motion.targetRotateX - motion.currentRotateX) < 0.01 &&
                Math.abs(motion.targetRotateY - motion.currentRotateY) < 0.01;

            if (!rotationIsSettled) {
                animationFrameRef.current = requestAnimationFrame(renderFrame);
            }
        };

        const queuePointerEffects = (clientX, clientY, deltaX = 0, deltaY = 0) => {
            if (dragRef.current.isSnapping) return;

            const bounds = boundsRef.current;
            if (!bounds) return;

            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height / 2;
            const mouseX = clientX - centerX;
            const mouseY = clientY - centerY;
            const normalizedX = clamp(mouseX / (bounds.width / 2), -1, 1);
            const normalizedY = clamp(mouseY / (bounds.height / 2), -1, 1);
            const motion = motionRef.current;

            motion.targetRotateX = clamp(
                dampEdge(normalizedY) * -MAX_TILT * TILT_SENSITIVITY,
                -MAX_TILT,
                MAX_TILT,
            );
            motion.targetRotateY = clamp(
                dampEdge(normalizedX) * MAX_TILT * TILT_SENSITIVITY,
                -MAX_TILT,
                MAX_TILT,
            );
            motion.deltaX = deltaX;
            motion.deltaY = deltaY;
            motion.shadowX = (mouseX / bounds.width) * -30;
            motion.shadowY = (mouseY / bounds.height) * -20 + 20;
            motion.percentX = clamp(
                ((clientX - bounds.left - deltaX) / bounds.width) * 100,
                0,
                100,
            );
            motion.percentY = clamp(
                ((clientY - bounds.top - deltaY) / bounds.height) * 100,
                0,
                100,
            );

            delete card.dataset.releasing;
            if (!animationFrameRef.current) {
                animationFrameRef.current = requestAnimationFrame(renderFrame);
            }
        };

        const finishSnap = () => {
            dragRef.current.isSnapping = false;
            delete card.dataset.releasing;

            // Hand the shadow back to index.css now that the bounce is over.
            // Both writes land in the same task on purpose: clearing the inline
            // transition alongside the shadow means dropping the padded
            // transparent layer cannot kick off a second, pointless box-shadow
            // transition. The two values are identical at this point, so there
            // is nothing to see.
            card.style.transition = "";
            card.style.boxShadow = "";

            if (snapTimerRef.current) {
                clearTimeout(snapTimerRef.current);
                snapTimerRef.current = null;
            }
        };

        const resetCard = (useSpring = false) => {
            const drag = dragRef.current;
            const motion = motionRef.current;

            cancelRenderFrame();

            if (snapTimerRef.current) {
                clearTimeout(snapTimerRef.current);
                snapTimerRef.current = null;
            }

            drag.isDragging = false;
            drag.isSnapping = useSpring;
            drag.pointerId = null;
            drag.captureTarget = null;
            drag.deltaX = 0;
            drag.deltaY = 0;

            motion.currentRotateX = 0;
            motion.currentRotateY = 0;
            motion.targetRotateX = 0;
            motion.targetRotateY = 0;
            motion.deltaX = 0;
            motion.deltaY = 0;

            document.body.classList.remove("is-dragging");
            card.classList.remove("is-dragging", "is-interacting");
            delete card.dataset.dragging;
            // The wrapper is the element that is actually hit-tested, so the
            // grabbing cursor has to live on it rather than on the card.
            delete interactionArea.dataset.dragging;

            if (useSpring) {
                card.dataset.releasing = "true";
            } else {
                delete card.dataset.releasing;
            }

            card.style.transition = useSpring
                ? SPRING_TRANSITION
                : HOVER_RETURN_TRANSITION;
            card.style.transform =
                "perspective(1000px) translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)";
            // Two-layer value on release so box-shadow has a matching list to
            // interpolate towards; see SPRING_REST_SHADOW.
            card.style.boxShadow = useSpring ? SPRING_REST_SHADOW : "";

            gloss.style.opacity = "0";
            gloss.style.background = "";

            if (useSpring) {
                snapTimerRef.current = setTimeout(finishSnap, SPRING_TIMEOUT_MS);
            }
        };

        const getIntersectingLink = (clientX, clientY) => {
            if (!card) return null;
            const links = card.querySelectorAll(".card-contact-info a, a, button");
            for (const link of links) {
                const rect = link.getBoundingClientRect();
                if (
                    clientX >= rect.left - 4 &&
                    clientX <= rect.right + 4 &&
                    clientY >= rect.top - 4 &&
                    clientY <= rect.bottom + 4
                ) {
                    return link;
                }
            }
            return null;
        };

        const handleMouseMove = (event) => {
            const drag = dragRef.current;
            if (drag.isDragging || drag.isSnapping) return;

            const hoveredLink = getIntersectingLink(event.clientX, event.clientY);
            interactionArea.style.cursor = hoveredLink ? "pointer" : "grab";

            const allLinks = card.querySelectorAll(".card-contact-info a");
            allLinks.forEach((l) => {
                if (l === hoveredLink) {
                    l.classList.add("is-hovered");
                } else {
                    l.classList.remove("is-hovered");
                }
            });

            const bounds = boundsRef.current;
            if (!bounds) return;

            // Strict boundary check: activation padding is set to 2 (or TILT_ACTIVATION_PADDING)
            const isWithinTiltRange =
                event.clientX >= bounds.left - TILT_ACTIVATION_PADDING &&
                event.clientX <= bounds.right + TILT_ACTIVATION_PADDING &&
                event.clientY >= bounds.top - TILT_ACTIVATION_PADDING &&
                event.clientY <= bounds.bottom + TILT_ACTIVATION_PADDING;

            if (!isWithinTiltRange) {
                resetCard();
                return;
            }

            queuePointerEffects(event.clientX, event.clientY);
        };

        const handleMouseLeave = () => {
            const allLinks = card.querySelectorAll(".card-contact-info a");
            allLinks.forEach((l) => l.classList.remove("is-hovered"));
            interactionArea.style.cursor = "grab";
            const drag = dragRef.current;
            if (!drag.isDragging && !drag.isSnapping) {
                resetCard();
            }
        };

        // NOTE: this is bound to `interactionArea`, not to `card`.
        // The card carries a live 3D transform (rotateX/rotateY inside a
        // `perspective` context). Browsers hit-test the *projected* quad of a
        // 3D-transformed element, and with the nested perspective on
        // `.tilt-card-wrapper` that quad drifts away from where the card is
        // painted. Only the area near the rotation origin (the centre, where
        // the heading sits) stayed reliably clickable. The wrapper is a plain,
        // untransformed box, so its hit region always matches the pixels.
        const handlePointerDown = (event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            if (event.isPrimary === false) return;

            // Raise this window above the others first. Runs for link presses
            // too, before the early return below.
            onPressRef.current?.();

            // Check direct target as well as geometric hit-box:
            const clickedLink =
                (event.target instanceof Element &&
                    event.target.closest("a, button, input, textarea, select")) ||
                getIntersectingLink(event.clientX, event.clientY);

            if (clickedLink) {
                return;
            }

            event.preventDefault();

            const drag = dragRef.current;
            if (drag.isSnapping) {
                finishSnap();
            }

            drag.isDragging = true;
            drag.pointerId = event.pointerId;
            drag.startX = event.clientX;
            drag.startY = event.clientY;
            drag.deltaX = 0;
            drag.deltaY = 0;

            // Route the pointer stream through the card itself. Pointer capture
            // bypasses hit testing entirely, so it works even though the card is
            // `pointer-events: none`. Fall back to the wrapper if the browser
            // refuses the card, and keep the window listeners as the last resort.
            drag.captureTarget = null;
            for (const target of [card, interactionArea]) {
                try {
                    target.setPointerCapture(event.pointerId);
                    if (
                        !target.hasPointerCapture ||
                        target.hasPointerCapture(event.pointerId)
                    ) {
                        drag.captureTarget = target;
                        break;
                    }
                } catch {
                    // Pointer already captured elsewhere or element detached.
                }
            }

            document.body.classList.add("is-dragging");
            card.classList.add("is-dragging", "is-interacting");
            delete card.dataset.releasing;
            card.dataset.dragging = "true";
            interactionArea.dataset.dragging = "true";
            card.style.transition = "none";
        };

        const handleClick = (event) => {
            const clickedLink = getIntersectingLink(event.clientX, event.clientY);
            if (clickedLink && clickedLink instanceof HTMLAnchorElement) {
                const href = clickedLink.getAttribute("href");
                const target = clickedLink.getAttribute("target");
                if (href) {
                    if (target === "_blank") {
                        window.open(href, "_blank", "noopener,noreferrer");
                    } else {
                        window.location.href = href;
                    }
                }
            }
        };

        const handlePointerMove = (event) => {
            const drag = dragRef.current;
            if (!drag.isDragging || drag.pointerId !== event.pointerId) return;

            drag.deltaX = event.clientX - drag.startX;
            drag.deltaY = event.clientY - drag.startY;

            queuePointerEffects(
                event.clientX,
                event.clientY,
                drag.deltaX,
                drag.deltaY,
            );
        };

        const handlePointerEnd = (event) => {
            const drag = dragRef.current;
            if (!drag.isDragging || drag.pointerId !== event.pointerId) return;

            const captureTarget = drag.captureTarget;
            if (
                captureTarget &&
                captureTarget.hasPointerCapture &&
                captureTarget.hasPointerCapture(event.pointerId)
            ) {
                try {
                    captureTarget.releasePointerCapture(event.pointerId);
                } catch {
                    // Ignore release errors
                }
            }

            resetCard(true);
        };

        const handleSnapTransitionEnd = (event) => {
            if (event.propertyName === "transform" && dragRef.current.isSnapping) {
                finishSnap();
            }
        };

        const handleWindowBlur = () => {
            if (dragRef.current.isSnapping) return;
            resetCard(dragRef.current.isDragging);
        };
        const preventNativeDrag = (event) => event.preventDefault();

        updateBounds();
        window.addEventListener("resize", updateBounds);
        interactionArea.addEventListener("mousemove", handleMouseMove);
        interactionArea.addEventListener("mouseleave", handleMouseLeave);
        // Bound on the wrapper so the whole card surface is grabbable, not just
        // the sliver of it whose 3D hit-quad still lines up with the pixels.
        interactionArea.addEventListener("pointerdown", handlePointerDown, {
            passive: false,
        });
        interactionArea.addEventListener("click", handleClick);
        interactionArea.addEventListener("dragstart", preventNativeDrag);
        card.addEventListener("transitionend", handleSnapTransitionEnd);
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerEnd);
        window.addEventListener("pointercancel", handlePointerEnd);
        window.addEventListener("blur", handleWindowBlur);

        return () => {
            cancelRenderFrame();

            if (snapTimerRef.current) {
                clearTimeout(snapTimerRef.current);
            }

            document.body.classList.remove("is-dragging");
            delete interactionArea.dataset.dragging;
            window.removeEventListener("resize", updateBounds);
            interactionArea.removeEventListener("mousemove", handleMouseMove);
            interactionArea.removeEventListener("mouseleave", handleMouseLeave);
            interactionArea.removeEventListener("pointerdown", handlePointerDown);
            interactionArea.removeEventListener("click", handleClick);
            interactionArea.removeEventListener("dragstart", preventNativeDrag);
            card.removeEventListener("transitionend", handleSnapTransitionEnd);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerEnd);
            window.removeEventListener("pointercancel", handlePointerEnd);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [updateBounds]);

    return (
        <div
            className="tilt-card-wrapper"
            style={zIndex === undefined ? undefined : { zIndex }}
        >
            <div ref={interactionRef} className="tilt-card-interaction-area">
                <article ref={cardRef} className="tilt-card">
                    <div
                        ref={glossRef}
                        className="tilt-card-gloss"
                        aria-hidden="true"
                    />

                    <div className="card-clip">
                        <div className="card-media">
                            {media}
                        </div>
                    </div>

                    <div className="card-content">
                        {children}
                    </div>

                    {avatar}

                    {/* `contact` is a slot, NOT part of `children`, and that is
                        deliberate. Anything inside .card-content inherits its
                        `translateZ(25px)`, and clickable things should not live
                        at depth here: Chromium's hit region for a lifted child
                        of a rotated, perspective-projected parent drifts away
                        from where that child is painted, and the drift grows
                        with the tilt angle. Rendering the contact block as a
                        SIBLING of .card-content keeps it at z = 0, coplanar with
                        the card face, which is the case browsers hit-test
                        exactly. index.css positions it with plain bottom/right
                        so it lands in the same spot as before. */}
                    {contact}
                </article>
            </div>
        </div>
    );
};

export default TiltCard;