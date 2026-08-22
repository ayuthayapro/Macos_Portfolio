import { useCallback, useEffect, useRef } from "react";

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
const SPRING_TRANSITION =
    "transform 0.55s cubic-bezier(0.25, 1.25, 0.5, 1), box-shadow 0.55s ease-out"; // ADJUST HERE: Spring physics curve

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;
const dampEdge = (value) => value / (1 + EDGE_DAMPING * Math.abs(value));

const TiltCard = ({ media, children }) => {
    const cardRef = useRef(null);
    const interactionRef = useRef(null);
    const glossRef = useRef(null);
    const boundsRef = useRef(null);
    const animationFrameRef = useRef(null);
    const snapTimerRef = useRef(null);
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
            card.style.boxShadow = "";

            gloss.style.opacity = "0";
            gloss.style.background = "";

            if (useSpring) {
                snapTimerRef.current = setTimeout(finishSnap, 650);
            }
        };

        const handleMouseMove = (event) => {
            const drag = dragRef.current;
            if (drag.isDragging || drag.isSnapping) return;

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
            interactionArea.removeEventListener("dragstart", preventNativeDrag);
            card.removeEventListener("transitionend", handleSnapTransitionEnd);
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerEnd);
            window.removeEventListener("pointercancel", handlePointerEnd);
            window.removeEventListener("blur", handleWindowBlur);
        };
    }, [updateBounds]);

    return (
        <div className="tilt-card-wrapper">
            <div ref={interactionRef} className="tilt-card-interaction-area">
                <article ref={cardRef} className="tilt-card">
                    <div
                        ref={glossRef}
                        className="tilt-card-gloss"
                        aria-hidden="true"
                    />

                    <div className="card-media">
                        {media}
                    </div>

                    <div className="card-content">
                        {children}
                    </div>
                </article>
            </div>
        </div>
    );
};

export default TiltCard;