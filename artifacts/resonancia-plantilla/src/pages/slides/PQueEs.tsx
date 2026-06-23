export default function PQueEs() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      {/* Subtle radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 45%, rgba(212,175,55,0.06) 0%, transparent 60%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left column */}
        <div style={{ width: "55vw", padding: "8vh 4vw 8vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            {/* Eyebrow */}
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", color: "#D4AF37", marginBottom: "1.5vh" }}>
              ¿QUÉ ES?
            </div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "4.5vh" }} />

            {/* Headline */}
            <div style={{ fontSize: "4.2vw", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "3.5vh", maxWidth: "46vw" }}>
              El primer santuario digital de bienestar para el mundo hispanohablante.
            </div>

            {/* Body */}
            <div style={{ fontSize: "1.6vw", fontWeight: 400, lineHeight: 1.75, color: "rgba(244,218,213,0.6)", maxWidth: "42vw" }}>
              No es una app de meditación genérica traducida al español. Es una plataforma nativa — con contenido propio, comunidad real y una experiencia diseñada desde adentro.
            </div>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>02 / 10</div>
        </div>

        {/* Vertical rule */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.12)", margin: "8vh 0" }} />

        {/* Right column — imagen */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src="/resonancia-plantilla/screenshots/appstore-mockup.png"
            alt="App Store Resonancia"
            style={{
              height: "82vh",
              width: "auto",
              objectFit: "contain",
              display: "block",
              filter: "drop-shadow(0 16px 48px rgba(0,0,0,0.7))",
            }}
          />
        </div>

      </div>
    </div>
  );
}
