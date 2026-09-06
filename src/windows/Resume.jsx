import { WindowControls } from "#components";
import WindowWrapper from "#hoc/WindowWrapper.jsx";
import { Download } from "lucide-react";

const Resume = () => {
    return (
        <>
            {/* 🍎 macOS Window Titlebar: Controls (Left) + Document Title (Center) + Download Button (Right) */}
            <div id="window-header">
                <WindowControls target="resume" />

                <span className="header-title">Tab_Ayutthaya_Resume.pdf</span>

                <a
                    href="/files/resume.pdf"
                    download="Tab_Ayutthaya_Resume.pdf"
                    className="download-btn"
                    title="Download PDF"
                >
                    <Download size={13} />
                    <span>Download PDF</span>
                </a>
            </div>

            {/* 📄 Document Canvas / Preview Area */}
            <div className="resume-body">
                <img
                    src="/images/resume-preview.png"
                    alt="Tab Ayutthaya Resume"
                    className="resume-page"
                    loading="eager"
                    draggable={false}
                />
            </div>
        </>
    );
};

const ResumeWindow = WindowWrapper(Resume, "resume");

export default ResumeWindow;
