import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
gsap.registerPlugin(Draggable);

import { Navbar, Welcome, Dock, WaveBackground, DesktopItem } from "#components";
import { Terminal, SafariWindow, ContactWindow, ResumeWindow } from "#windows/index.js";

const App = () => {
    return (
        <main className="relative">
            <WaveBackground />
            <Navbar />
            <Welcome />
            <DesktopItem />
            <Dock />

            <Terminal />
            <SafariWindow />
            <ContactWindow />
            <ResumeWindow />
        </main>
    );
};

export default App;
