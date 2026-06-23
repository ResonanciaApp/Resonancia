export default function PContacto() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left — portada image */}
        <div style={{ width: "52vw", position: "relative", flexShrink: 0, overflow: "hidden" }}>
          <img
            src="/resonancia-plantilla/screenshots/portada2.jpg"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
          />
          {/* right fade to blend into divider */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 60%, #160108 100%)" }} />
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.18)", margin: "8vh 0", flexShrink: 0 }} />

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
            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3vh" }}>
              <div style={{ fontSize: "0.9vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(212,175,55,0.45)" }}>EMAIL</div>
              <div style={{ fontSize: "1.3vw", fontWeight: 400, color: "rgba(244,218,213,0.75)" }}>contacto@casadelcuenco.cl</div>
            </div>

            {/* Phone */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3vh" }}>
              <div style={{ fontSize: "0.9vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(212,175,55,0.45)" }}>TELÉFONO</div>
              <div style={{ fontSize: "1.3vw", fontWeight: 400, color: "rgba(244,218,213,0.75)" }}>+56 9 9799 6771</div>
            </div>

            {/* Founder */}
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
