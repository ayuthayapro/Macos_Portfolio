import TiltCard from "#components/TiltCard.jsx";
import useWindowStore from "#store/window.js";

const Contact = () => {
    const isOpen = useWindowStore((state) => state.windows.contact.isOpen);
    const zIndex = useWindowStore((state) => state.windows.contact.zIndex);
    const focusWindow = useWindowStore((state) => state.focusWindow);

    if (!isOpen) return null;

    const phoneImage = (
        <img
            src="/images/phone.png"
            alt=""
            className="contact-phone"
            draggable="false"
        />
    );

    /* Passed to TiltCard as `contact`, not as children, so it renders as a
       sibling of .card-content instead of inside it. Inside .card-content it
       inherited translateZ(25px) and sat at 45px of depth, where Chromium's hit
       region drifts ~28px away from the painted text as soon as the card tilts
       -- which is why these three links were only clickable with the card at
       rest. As a sibling it stays coplanar with the card face (z = 0) and hit
       tests exactly at any tilt angle.

       The card's drag listener is a *native* pointerdown listener on
       .tilt-card-interaction-area. React 19 delegates onPointerDown to the #root
       container, which is an ancestor of that element, so a React-level
       event.stopPropagation() here would run too late to stop it. What actually
       protects these links is the `closest("a, button, input, textarea, select")`
       early return in TiltCard.handlePointerDown -- it bails before
       preventDefault(), which keeps the pointerdown -> mousedown -> click
       sequence (and therefore target="_blank") intact.

       `stopLinkEvent` below is defensive belt-and-suspenders: it stops the React
       synthetic pointerdown/click from bubbling to any React-level handler an
       ancestor window shell might add later (none today). It deliberately does
       NOT call preventDefault, so native anchor navigation still fires. */
    const stopLinkEvent = (event) => event.stopPropagation();

    const contactLinks = (
        <div className="card-contact-info">
            <a
                href="https://github.com/ayuthayapro"
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={stopLinkEvent}
                onClick={stopLinkEvent}
            >
                GitHub
            </a>
            <a
                href="mailto:ayutiatabb@gmail.com"
                onPointerDown={stopLinkEvent}
                onClick={stopLinkEvent}
            >
                ayutiatabb@gmail.com
            </a>
            <a
                href="tel:+88581661190"
                onPointerDown={stopLinkEvent}
                onClick={stopLinkEvent}
            >
                +885 81 661 190
            </a>
        </div>
    );

    return (
        <TiltCard
            media={phoneImage}
            contact={contactLinks}
            zIndex={zIndex}
            onPress={() => focusWindow("contact")}
        >
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
