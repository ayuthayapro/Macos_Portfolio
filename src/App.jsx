import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
gsap.registerPlugin(Draggable);

import { Navbar, Welcome, Dock } from "#components";
import { Terminal, SafariWindow } from "#windows/index.js";

const App = () => {
    return (
        <main>
            <Navbar />
            <Welcome />
            <Dock />

            <Terminal />
            <SafariWindow />
        </main>
    );
};

export default App;