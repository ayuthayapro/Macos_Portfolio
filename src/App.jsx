import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
gsap.registerPlugin(Draggable);

import { Navbar, Welcome, Dock, WaveBackground } from "#components";
import { Terminal, SafariWindow, ContactWindow } from "#windows/index.js";

const App = () => {
    return (
        <main className="relative">
            <WaveBackground />
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
