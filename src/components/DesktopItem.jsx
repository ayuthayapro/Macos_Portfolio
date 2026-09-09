import { useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { useGSAP } from "@gsap/react";
import useWindowStore from "#store/window.js";

gsap.registerPlugin(Draggable);

const DesktopItem = () => {
    const { openWindow, closeWindow } = useWindowStore();
    const itemRef = useRef(null);
    const [isSelected, setIsSelected] = useState(false);

    useGSAP(() => {
        const el = itemRef.current;
        if (!el) return;

        const [instance] = Draggable.create(el, {
            type: "x,y",
            bounds: "main",
            edgeResistance: 0.75,
            force3D: true,
            onPress: () => {
                setIsSelected(true);
            },
            onClick: () => {
                // Toggle window: close if open, open if closed
                const isResumeOpen = useWindowStore.getState().windows.resume?.isOpen;
                if (isResumeOpen) {
                    closeWindow("resume");
                } else {
                    openWindow("resume");
                }
            },
        });

        const handleOutsideClick = (e) => {
            if (el && !el.contains(e.target)) {
                setIsSelected(false);
            }
        };

        window.addEventListener("pointerdown", handleOutsideClick);

        return () => {
            instance?.kill();
            window.removeEventListener("pointerdown", handleOutsideClick);
        };
    }, []);

    return (
        <div
            ref={itemRef}
            className={`desktop-file group ${isSelected ? "is-selected" : ""}`}
            tabIndex={0}
        >
            <div className="desktop-file-icon-wrapper">
                <img
                    src="/images/plain.png"
                    alt="Resume.pdf"
                    className="desktop-file-icon"
                    draggable={false}
                />
            </div>
            <span className="desktop-file-label">Resume.pdf</span>
        </div>
    );
};

export default DesktopItem;
