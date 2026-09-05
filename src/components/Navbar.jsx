import { useState, useEffect } from "react";
import dayjs from "dayjs";

import { navLinks, navIcons } from "#constants";
import useWindowStore from "#store/window.js";

const Navbar = () => {
    const { openWindow, closeWindow, windows } = useWindowStore();
    const [currentTime, setCurrentTime] = useState(dayjs());

    useEffect(() => {
        // Ticks every second so the clock updates live without needing a page refresh
        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleNavClick = (type) => {
        if (!type) return;
        if (windows[type]?.isOpen) {
            closeWindow(type);
        } else {
            openWindow(type);
        }
    };

    return (
        <nav className="text-white">
            <div>
                <img src="/images/logo.svg" alt="logo" />
                <p className="brand-title text-white">
                    <span className="font-bold">Ayuthaya  portfolio </span>
                </p>

                <ul>
                    {navLinks.map(({ id, name, type }) => (
                        <li
                            key={id}
                            onClick={() => handleNavClick(type)}
                            className="cursor-pointer select-none"
                        >
                            <p className="text-white">{name}</p>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <ul>
                    {navIcons.map(({ id, img }) => (
                        <li key={id}>
                            <img src={img} className="icon-hover" alt={`icon-${id}`} />
                        </li>
                    ))}
                </ul>
                <time className="text-white">{currentTime.format("ddd MMM D h:mm A")}</time>
            </div>
        </nav>
    );
};

export default Navbar;