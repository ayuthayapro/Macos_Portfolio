import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
gsap.registerPlugin(Draggable);

import { Navbar, Welcome, Dock } from "#components";
import { Terminal, SafariWindow, ContactWindow } from "#windows/index.js";

const App = () => {
    return (
        <main>
            <Navbar />
            <Welcome />
            <Dock />

            <Terminal />
            <SafariWindow />
            <ContactWindow />
        </main>
    );
};

export default App;
