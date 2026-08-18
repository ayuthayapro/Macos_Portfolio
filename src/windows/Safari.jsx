import { useState } from "react";
import { WindowControls } from "#components";
import { ArrowUpRight, Code2 } from "lucide-react";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import { projectArticles } from "#constants/index.js";

const Safari = () => {
    const [selectedId, setSelectedId] = useState(projectArticles[0]?.id);
    const selectedProject = projectArticles.find((project) => project.id === selectedId) || projectArticles[0];

    // Handles both single image (string) and multiple images (array)
    const projectImages = Array.isArray(selectedProject.image)
        ? selectedProject.image
        : Array.isArray(selectedProject.images)
            ? selectedProject.images
            : [selectedProject.image || selectedProject.images].filter(Boolean);

    return (
        <>
            {/* Window Header / Titlebar */}
            <div id="window-header">
                <div className="header-left">
                    <WindowControls target="safari" />
                </div>
                <div className="header-right">
                    <div className="breadcrumb">
                        <span>User</span>
                        <span>/</span>
                        <span>Projects</span>
                        <span>/</span>
                        <span className="current">{selectedProject.title}</span>
                    </div>
                </div>
            </div>

            {/* Split Container: Sidebar (Left) + Detail Panel (Right) */}
            <div className="project-body">
                {/* Left Sidebar - Independent scroll */}
                <aside className="sidebar">
                    <h3>Projects</h3>
                    <ul>
                        {projectArticles.map((project) => (
                            <li
                                key={project.id}
                                className={project.id === selectedId ? "active" : "not-active"}
                                onClick={() => setSelectedId(project.id)}
                            >
                                {project.title}
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Right Detail Panel - Independent scroll */}
                <div className="detail-panel">
                    <h3>{selectedProject.title}</h3>

                    <p className="description">{selectedProject.description}</p>

                    <div className="info-row">
                        <div className="flex-1 min-w-0">
                            <p className="label">Type</p>
                            <p className="value">{selectedProject.type}</p>

                            <div className="tags">
                                {selectedProject.tags.map((tag) => (
                                    <span key={tag}>{tag}</span>
                                ))}
                            </div>
                        </div>

                        <div className="flex-none text-left">
                            <p className="label">Timeline</p>
                            <p className="value">
                                {selectedProject.startDate
                                    ? `${selectedProject.startDate} — ${selectedProject.date}`
                                    : selectedProject.date}
                            </p>

                            {selectedProject.duration && (
                                <>
                                    <p className="label mt-3">Duration</p>
                                    <p className="value">{selectedProject.duration}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Multiple Project Screenshots */}
                    {projectImages.map((imgSrc, index) => (
                        <img
                            key={index}
                            src={imgSrc}
                            alt={`${selectedProject.title} screenshot ${index + 1}`}
                        />
                    ))}

                    {/* Action Buttons */}
                    <div className="actions">
                        <a
                            href={selectedProject.projectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="styled__button view-project"
                        >
                            <span>View Project</span>
                            <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </a>

                        {selectedProject.sourceFrontend && (
                            <a
                                href={selectedProject.sourceFrontend}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="styled__button frontend"
                            >
                                <Code2 size={14} className="text-white" />
                                <span>Frontend</span>
                            </a>
                        )}

                        {selectedProject.sourceBackend && (
                            <a
                                href={selectedProject.sourceBackend}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="styled__button backend"
                            >
                                <Code2 size={14} className="text-white" />
                                <span>Backend</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

const SafariWindow = WindowWrapper(Safari, "safari");

export default SafariWindow;