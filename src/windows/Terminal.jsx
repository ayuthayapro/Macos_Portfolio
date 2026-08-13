import WindowWrapper from "#hoc/WindowWrapper.jsx";
import { Check } from "lucide-react";
import { techStack } from "#constants/index.js";
import WindowControls from "#components/WindowControls.jsx";

const Terminal = () => {
    return (
        <>
            <div id="window-header">
                <WindowControls target="terminal"/>
                <h2>Tech Stack</h2>
            </div>
            <div className="techstack">
                <p>
                    <span className="font-bold">@ayuthaya % </span>
                    show tech stack
                </p>
                <div className="label">
                    <p className="w-32">Category</p>
                    <p>Technologies</p>
                </div>
                <ul className="content">
                    {techStack.map(({ category, items }) => (
                        <li key={category} className="flex items-center">
                            <Check className="check" size={20} />
                            <h3>{category}</h3>
                            <ul>
                                {items.map((item, i) => (
                                    <li key={i}>{item} {}</li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>

                <div className="footnote">
                    <p>
                        <Check size={20} /> 5 of 5 stacks loaded successfully
                    </p>
                    <p>
                        
                    </p>
                </div>
            </div>
        </>
    );
};

const TerminalWindow = WindowWrapper(Terminal, "terminal");

export default TerminalWindow;