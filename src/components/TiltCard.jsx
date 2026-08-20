import { useCallback, useEffect, useRef } from "react";

const MAX_TILT = 15;
const TILT_SENSITIVITY = 0.9;
const TILT_ACTIVATION_PADDING = 4;

const EDGE_DAMPING = 0.45;
const HOVER_TRANSITION =
    "transform 0.15s ease-out, box-shadow 0.15s ease-out";
const HOVER_RETURN_TRANSITION =
    "transform 0.3s ease-out, box-shadow 0.3s ease-out";
const SPRING_TRANSITION =
    "transform 0.55s cubic-bezier(0.25, 1.25, 0.5, 1), box-shadow 0.55s ease-out";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
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

        const applyPointerEffects = (clientX, clientY, deltaX = 0, deltaY = 0) => {
            if (dragRef.current.isSnapping) return;

            const bounds = boundsRef.current;
            if (!bounds) return;

            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height / 2;
            const mouseX = clientX - centerX;
            const mouseY = clientY - centerY;

            const normalizedX = clamp(mouseX / (bounds.width / 2), -1, 1);
            const normalizedY = clamp(mouseY / (bounds.height / 2), -1, 1);
            const rotateX = clamp(
                dampEdge(normalizedY) * -MAX_TILT * TILT_SENSITIVITY,
                -MAX_TILT,
                MAX_TILT,
            );
            const rotateY = clamp(
                dampEdge(normalizedX) * MAX_TILT * TILT_SENSITIVITY,
                -MAX_TILT,
                MAX_TILT,
            );

            const shadowX = (mouseX / bounds.width) * -30;
            const shadowY = (mouseY / bounds.height) * -20 + 20;
            const percentX = clamp(
                ((clientX - bounds.left - deltaX) / bounds.width) * 100,
                0,
                100,
            );
            const percentY = clamp(
                ((clientY - bounds.top - deltaY) / bounds.height) * 100,
                0,
                100,
            );

            delete card.dataset.releasing;
            card.style.transition = dragRef.current.isDragging
                ? "none"
                : HOVER_TRANSITION;
            card.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            card.style.boxShadow = `${shadowX}px ${shadowY}px 42px rgba(0, 0, 0, 0.24), 0 14px 28px rgba(0, 0, 0, 0.16)`;

            gloss.style.opacity = "1";
            gloss.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(255, 255, 255, 0.25), transparent 60%)`;
        };

        const queuePointerEffects = (clientX, clientY, deltaX = 0, deltaY = 0) => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            animationFrameRef.current = requestAnimationFrame(() => {
                applyPointerEffects(clientX, clientY, deltaX, deltaY);
            });
        };

        const finishSnap = () => {
            const drag = dragRef.current;
            drag.isSnapping = false;
            delete card.dataset.releasing;

            if (snapTimerRef.current) {
                clearTimeout(snapTimerRef.current);
                snapTimerRef.current = null;
            }

            updateBounds();
        };

        const resetCard = (useSpring = false) => {
            const drag = dragRef.current;

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

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

            document.body.classList.remove("is-dragging");
            delete card.dataset.dragging;
            if (useSpring) {
                card.dataset.releasing = "true";
            } else {
                delete card.dataset.releasing;
            }
            card.style.cursor = "grab";
            card.style.transition = useSpring
                ? SPRING_TRANSITION
                : HOVER_RETURN_TRANSITION;
            card.style.transform =
                "translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg)";
            card.style.boxShadow = "";

            gloss.style.opacity = "0";
            gloss.style.background = "";

            if (useSpring) {
                snapTimerRef.current = setTimeout(finishSnap, 650);
            }
        };

        const handleMouseMove = (event) => {
            if (dragRef.current.isDragging || dragRef.current.isSnapping) return;

            const bounds = boundsRef.current;
            if (!bounds) return;

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

        const handlePointerDown = (event) => {
            if (event.button !== 0) return;
            event.preventDefault();

            const drag = dragRef.current;
            if (drag.isSnapping) return;
            drag.isDragging = true;
            drag.pointerId = event.pointerId;
            drag.captureTarget = card;
            drag.startX = event.clientX;
            drag.startY = event.clientY;
            drag.deltaX = 0;
            drag.deltaY = 0;

            document.body.classList.add("is-dragging");
            delete card.dataset.releasing;
            card.dataset.dragging = "true";
            card.style.cursor = "grabbing";
            card.style.transition = "none";
            card.setPointerCapture(event.pointerId);
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
            if (captureTarget?.hasPointerCapture(event.pointerId)) {
                captureTarget.releasePointerCapture(event.pointerId);
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
        card.addEventListener("pointerdown", handlePointerDown);
        card.addEventListener("pointermove", handlePointerMove);
        card.addEventListener("pointerup", handlePointerEnd);
        card.addEventListener("pointercancel", handlePointerEnd);
        card.addEventListener("transitionend", handleSnapTransitionEnd);
        card.addEventListener("dragstart", preventNativeDrag);
        window.addEventListener("blur", handleWindowBlur);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (snapTimerRef.current) {
                clearTimeout(snapTimerRef.current);
            }
            document.body.classList.remove("is-dragging");

            window.removeEventListener("resize", updateBounds);
            interactionArea.removeEventListener("mousemove", handleMouseMove);
            interactionArea.removeEventListener("mouseleave", handleMouseLeave);
            card.removeEventListener("pointerdown", handlePointerDown);
            card.removeEventListener("pointermove", handlePointerMove);
            card.removeEventListener("pointerup", handlePointerEnd);
            card.removeEventListener("pointercancel", handlePointerEnd);
            card.removeEventListener("transitionend", handleSnapTransitionEnd);
            card.removeEventListener("dragstart", preventNativeDrag);
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
