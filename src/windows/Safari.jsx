import { useState } from "react";
import { WindowControls } from "#components";
import {
    ArrowUpRight,
    Code2,
    ChevronDown,
    Home,
    Bot,
    Smartphone,
    Video,
    Globe,
    UserCircle,
    Sparkles,
    FolderDown,
    Trash2,
    FileText,
    GraduationCap,
} from "lucide-react";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import { projectArticles } from "#constants/index.js";

const ICON_MAP = {
    elearning: GraduationCap,
    archline: Home,
    nexmind: Bot,
    dewi: Smartphone,
    creatory: Video,
    brnd: Globe,
    nonsence: UserCircle,
    glaze: Sparkles,
};

const GENERAL_SECTIONS = [
    {
        id: "resources",
        name: "Resources",
        icon: FolderDown,
        client: "Curated Tools",
        year: "2025",
        category: "/ Design Systems / Development Toolkits",
        description:
            "A collection of curated design systems, UI kits, open-source repositories, and developer toolkits used to build high-performance web applications and fluid interactive animations.",
        preview: "https://framerusercontent.com/images/BioZIG0GuLlZAIoshbFOCdctS7I.png?scale-down-to=1024",
        url: "https://github.com/ayuthayapro",
    },
    {
        id: "archive",
        name: "Archive",
        icon: Trash2,
        client: "Legacy Portfolio",
        year: "2022 — 2024",
        category: "/ Experiments / Prototypes / Open Source",
        description:
            "An archive of early coding experiments, creative WebGL shaders, Three.js 3D prototypes, and foundational projects developed throughout university studies.",
        preview: "https://framerusercontent.com/images/MZaxJjFtRo4mSnx24EjY6XllOg.png?scale-down-to=1024",
        url: "https://github.com/ayuthayapro",
    },
    {
        id: "privacy",
        name: "Privacy Policy",
        icon: FileText,
        client: "Ayuthaya Portfolio",
        year: "2026",
        category: "/ Legal / Website Terms",
        description:
            "This portfolio is a personal developer showcase designed to emulate macOS Monterey. No personal tracking cookies or behavioral advertising trackers are utilized. All assets belong to their respective creators.",
        preview: "https://framerusercontent.com/images/EpE3EXTbHQgZGhvDOnYoCiOPO4Q.jpg?scale-down-to=1024",
        url: "#",
    },
];

const Safari = () => {
    const [selectedId, setSelectedId] = useState(projectArticles[0]?.id || "elearning");

    // Check if the selected item is a project or a general section
    const currentProject = projectArticles.find((p) => p.id === selectedId);
    const currentGeneral = GENERAL_SECTIONS.find((g) => g.id === selectedId);
    const activeItem = currentProject || currentGeneral || projectArticles[0];

    // Handles both single image and multiple images
    const previewImages = Array.isArray(activeItem.image)
        ? activeItem.image
        : Array.isArray(activeItem.images)
            ? activeItem.images
            : [activeItem.preview || activeItem.image || activeItem.images].filter(Boolean);

    const handleButtonMouseMove = (e) => {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const offsetX = x - rect.width / 2;
        const offsetY = y - rect.height / 2;
        const shadowX = -offsetX / 4;
        const shadowY = -offsetY / 4;

        button.style.boxShadow = `
        inset 0 2px 2px rgba(255, 255, 255, 0.5),
        inset 0 -2px 2px rgba(0, 0, 0, 0.25),
        ${shadowX}px ${shadowY}px 24px rgba(0, 0, 0, 0.35),
        ${shadowX / 2}px ${shadowY / 2}px 12px rgba(0, 0, 0, 0.25)
    `;
    };

    const handleButtonMouseLeave = (e) => {
        e.currentTarget.style.boxShadow = "";
    };

    return (
        <>
            {/* 🍎 macOS Window Titlebar: Traffic Lights on left, "Finder" centered */}
            <div id="window-header">
                <WindowControls target="safari" />
                <span className="header-title">Finder</span>
            </div>

            {/* 🪟 Split Body (Sidebar + Content Panel) */}
            <div className="project-body">
                {/* 📂 Left Sidebar */}
                <aside className="sidebar">
                    {/* Projects Section */}
                    <div className="sidebar-group">
                        <span className="sidebar-label">Projects</span>
                        <ul className="sidebar-list">
                            {projectArticles.map((project) => {
                                const Icon = ICON_MAP[project.id] || Home;
                                const isActive = project.id === selectedId;
                                return (
                                    <li
                                        key={project.id}
                                        className={isActive ? "active" : "not-active"}
                                        onClick={() => setSelectedId(project.id)}
                                    >
                                        <Icon size={14} />
                                        <span className="truncate">{project.title}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* General Section */}
                    <div className="sidebar-group general-group">
                        <span className="sidebar-label">General</span>
                        <ul className="sidebar-list">
                            {GENERAL_SECTIONS.map((section) => {
                                const Icon = section.icon;
                                const isActive = section.id === selectedId;
                                return (
                                    <li
                                        key={section.id}
                                        className={isActive ? "active" : "not-active"}
                                        onClick={() => setSelectedId(section.id)}
                                    >
                                        <Icon size={14} />
                                        <span className="truncate">{section.name}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </aside>

                {/* 📄 Right Content Detail View */}
                <div className="detail-panel">
                    {/* Header Row: Thumbnail Avatar + Title & Meta + Visit Link */}
                    <div className="project-header-row">
                        <div className="project-title-meta">
                            <img
                                src={previewImages[0] || "/images/elearning.png"}
                                alt={activeItem.title || activeItem.name}
                                className="project-avatar"
                            />
                            <div>
                                <h2 className="project-name">{activeItem.title || activeItem.name}</h2>
                                <p className="project-meta-line">
                                    <span>
                                        {activeItem.client
                                            ? `Client: ${activeItem.client}`
                                            : `Type: ${activeItem.type || "Full-Stack"}`}
                                    </span>
                                    {activeItem.year && (
                                        <>
                                            <span className="bullet">•</span>
                                            <span>Year: {activeItem.year}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {(activeItem.projectLink || activeItem.url) && (
                            <a
                                href={activeItem.projectLink || activeItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="visit-link"
                            >
                                <span>Visit</span>
                                <ArrowUpRight size={13} />
                            </a>
                        )}
                    </div>

                    {/* Description Box */}
                    <div className="description-card">
                        <p>{activeItem.description}</p>
                    </div>

                    {/* Duration Section (Above Category) */}
                    {activeItem.startDate && activeItem.date && (
                        <div className="disclosure-section">
                            <div className="disclosure-heading">
                                <ChevronDown size={13} className="text-gray-400" />
                                <span>Duration:</span>
                            </div>
                            <p className="disclosure-content flex items-center gap-1.5">
                                <span>{activeItem.startDate} — {activeItem.date}</span>
                                {activeItem.duration && (
                                    <>
                                        <span className="bullet text-gray-400">•</span>
                                        <span>{activeItem.duration}</span>
                                    </>
                                )}
                            </p>
                        </div>
                    )}

                    {/* Category Disclosure */}
                    <div className="disclosure-section">
                        <div className="disclosure-heading">
                            <ChevronDown size={13} className="text-gray-400" />
                            <span>Category:</span>
                        </div>
                        <p className="disclosure-content">
                            {activeItem.category || `/ ${activeItem.type || "Web Development"}`}
                        </p>
                    </div>

                    {/* Preview Section */}
                    <div className="disclosure-section preview-section">
                        <div className="disclosure-heading">
                            <ChevronDown size={13} className="text-gray-400" />
                            <span>Preview:</span>
                        </div>

                        <div className="preview-container">
                            {previewImages.map((imgSrc, index) => (
                                <div key={index} className="preview-frame">
                                    <img
                                        src={imgSrc}
                                        alt={`${activeItem.title || activeItem.name} preview ${index + 1}`}
                                        className="preview-image"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons (For ELearning or projects with code repositories) */}
                    {(activeItem.sourceFrontend || activeItem.sourceBackend || activeItem.projectLink) && (
                        <div className="actions">
                            {activeItem.projectLink && activeItem.projectLink !== "#" && (
                                <a
                                    href={activeItem.projectLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="styled__button view-project"
                                    onMouseMove={handleButtonMouseMove}
                                    onMouseLeave={handleButtonMouseLeave}
                                >
                                    <span>View Project</span>
                                    <ArrowUpRight size={15} />
                                </a>
                            )}

                            {activeItem.sourceFrontend && activeItem.sourceFrontend !== "#" && (
                                <a
                                    href={activeItem.sourceFrontend}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="styled__button frontend"
                                    onMouseMove={handleButtonMouseMove}
                                    onMouseLeave={handleButtonMouseLeave}
                                >
                                    <Code2 size={14} className="text-white" />
                                    <span>Frontend Code</span>
                                </a>
                            )}

                            {activeItem.sourceBackend && activeItem.sourceBackend !== "#" && (
                                <a
                                    href={activeItem.sourceBackend}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="styled__button backend"
                                    onMouseMove={handleButtonMouseMove}
                                    onMouseLeave={handleButtonMouseLeave}
                                >
                                    <Code2 size={14} className="text-white" />
                                    <span>Backend Code</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const SafariWindow = WindowWrapper(Safari, "safari");

export default SafariWindow;