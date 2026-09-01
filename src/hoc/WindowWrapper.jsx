import useWindowStore from "#store/window.js";
import { useLayoutEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

// Turns a plain component (e.g. Terminal) into a "window":
// adds show/hide + stacking order, based on the Zustand store.
const WindowWrapper = (Component, windowKey) => {
    const Wrapped = (props) => {
        // Read this specific window's state from the store
        const { focusWindow, windows } = useWindowStore();
        const { isOpen, zIndex } = windows[windowKey];

        // ref = points to the <section> DOM element once rendered
        // needed so GSAP can animate/drag it directly
        const ref = useRef(null);

        // TODO: animation logic goes here (open/close animation, drag, etc.)
        useGSAP(() => {
            const el = ref.current;
            if (!el || !isOpen) return;

            el.style.display = "block";

            gsap.fromTo(
                el,
                { scale: 0.8, opacity: 0, y: 40 },
                { scale: 1, opacity: 1, y: 0, duration: 0.4 , ease: "power3.out" }
            );
        }, [isOpen]);   // ← closes useGSAP properly with `)`

        useGSAP(() => {
            const el = ref.current;
            if (!el) return;

            const header = el.querySelector("#window-header");

            const [instance] = Draggable.create(el, {
                trigger: header || el,
                type: "x,y",
                force3D: true,
                onPress: () => focusWindow(windowKey),
            });
            return () => instance.kill();
        }, [isOpen]);

        useLayoutEffect(() => {
            const el = ref.current;
            if (!el) return;
            el.style.display = isOpen ? "block" : "none";
        }, [isOpen]);


        // SHOW/HIDE: if window is closed, render nothing at all
        if (!isOpen) return null;

        // Render the window shell: positioning + stacking + actual content inside
        return (
            <section
                id={windowKey}          // lets CSS target it, e.g. #terminal { bg-white ... }
                ref={ref}               // for GSAP to grab this element
                style={{ zIndex }}      // controls stacking order between windows
                className="absolute"    // lets it float freely on the page
            >
                <Component {...props} /> {/* the actual window content, e.g. Terminal */}
            </section>
        );
    };

    // readable name in React DevTools, e.g. "WindowWrapper(Terminal)"
    Wrapped.displayName = `WindowWrapper(${Component.displayName || Component.name || "Component"})`;

    return Wrapped; // hand back the upgraded component
};

export default WindowWrapper;