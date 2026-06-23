export default function PContacto() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ color: "#F4DAD5" }}
    >
      {/* Full-screen background image */}
      <img
        src="/resonancia-plantilla/screenshots/portada2.jpg"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", display: "block" }}
      />

      {/* Dark overlay for readability on the right */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 45%, rgba(10,2,6,0.75) 65%, rgba(10,2,6,0.92) 100%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left — spacer (image area) */}
        <div style={{ width: "50vw", flexShrink: 0 }} />

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.25)", margin: "8vh 0", flexShrink: 0 }} />

        {/* Right — contact */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "8vh 7vw 8vh 5vw" }}>

          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", background: "linear-gradient(90deg, #D6AD5F, #B47344)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "1.5vh" }}>
            CONTACTO
          </div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "4vh" }} />

          <div style={{ fontSize: "3.2vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "5vh" }}>
            ¿Te gustaría<br />
            <span style={{ display: "inline-block", background: "linear-gradient(90deg, #D6AD5F, #B47344)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>participar?</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2.5vh" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3vh" }}>
              <div style={{ fontSize: "0.9vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(212,175,55,0.45)" }}>EMAIL</div>
              <div style={{ fontSize: "1.3vw", fontWeight: 400, color: "rgba(244,218,213,0.8)" }}>contacto@casadelcuenco.cl</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3vh" }}>
              <div style={{ fontSize: "0.9vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(212,175,55,0.45)" }}>TELÉFONO</div>
              <div style={{ fontSize: "1.3vw", fontWeight: 400, color: "rgba(244,218,213,0.8)" }}>+56 9 9799 6771</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3vh" }}>
              <div style={{ fontSize: "0.9vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(212,175,55,0.45)" }}>FOUNDER</div>
              <div style={{ fontSize: "1.3vw", fontWeight: 600, background: "linear-gradient(90deg, #D6AD5F, #B47344)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Nicolás Blanch</div>
            </div>
          </div>
        </div>

      </div>

      {/* Counter */}
      <div style={{ position: "absolute", bottom: "3.5vh", right: "7vw", fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)", zIndex: 2 }}>
        11 / 11
      </div>
    </div>
  );
}
