import { WindowControls } from "#components";
import { PanelLeft, ChevronLeft, ChevronRight, ShieldHalf, Search, Share, Plus, Copy } from "lucide-react";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import { projectArticles } from "#constants/index.js";

const Safari = () => {
    return (
        <>
            <div id="window-header">
                <WindowControls target="safari" />

                <PanelLeft className="ml-10 icon" />

                <div className="flex items-center gap-1 ml-5">
                    <ChevronLeft className="icon" />
                    <ChevronRight className="icon" />
                </div>

                <div className="flex-1 flex-center gap-3">
                    <ShieldHalf className="icon" />

                    <div className="search">
                        <Search className="icon" />
                        <input
                            type="text"
                            placeholder="Search or enter website name"
                            className="flex-1"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <Share className="icon" />
                    <Plus className="icon" />
                    <Copy className="icon" />
                </div>
            </div>

            <div className="project-list">
                {projectArticles.map((project) => (
                    <div key={project.id} className="project-card">
                        <p className="date">{project.date}</p>
                        <h3>{project.title}</h3>
                        <img src={project.image} alt={project.title} />
                        <div className="tags">
                            {project.tags.map((tag) => (
                                <span key={tag}>{tag}</span>
                            ))}
                        </div>
                        <p>{project.description}</p>
                        <div className="actions">
                            <a href={project.projectLink} className="view-project" target="_blank" rel="noopener noreferrer">
                                View Project
                            </a>
                            <a href={project.sourceFrontend} className="source-code" target="_blank" rel="noopener noreferrer">
                                Frontend Code
                            </a>
                            <a href={project.sourceBackend} className="source-code" target="_blank" rel="noopener noreferrer">
                                Backend Code
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

const SafariWindow = WindowWrapper(Safari, "safari");

export default SafariWindow;