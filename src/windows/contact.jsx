import TiltCard from "#components/TiltCard.jsx";
import useWindowStore from "#store/window.js";

const Contact = () => {
    const isOpen = useWindowStore(
        (state) => state.windows.contact.isOpen,
    );

    if (!isOpen) return null;

    const phoneImage = (
        <img
            src="/images/phone.png"
            alt=""
            className="contact-phone"
            draggable="false"
        />
    );

    return (
        <TiltCard media={phoneImage}>
            <h2 className="contact-heading">Get In Touch</h2>

            <p className="contact-copy">
                Let&apos;s build something cool.
                <br />
                Or just talk design. Either works.
            </p>
        </TiltCard>
    );
};

export default Contact;
