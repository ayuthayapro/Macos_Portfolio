import dayjs from "dayjs";

import { navLinks, navIcons } from "#constants";
import useWindowStore from "#store/window.js";

const Navbar = () => {
    const { openWindow, closeWindow, windows } = useWindowStore();

    const handleNavClick = (type) => {
        if (!type) return;
        if (windows[type]?.isOpen) {
            closeWindow(type);
        } else {
            openWindow(type);
        }
    };

    return (
        <nav>
            <div>
                <img src="/images/logo.svg" alt="logo" />
                <p className="font-bold">Ayuthaya Portfolio</p>

                <ul>
                    {navLinks.map(({ id, name, type }) => (
                        <li
                            key={id}
                            onClick={() => handleNavClick(type)}
                            className="cursor-pointer select-none"
                        >
                            <p>{name}</p>
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
                <time>{dayjs().format("ddd MMM D h:mm A")}</time>
            </div>
        </nav>
    );
};

export default Navbar;