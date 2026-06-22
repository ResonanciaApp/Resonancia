const base = import.meta.env.BASE_URL;

export default function P01Brecha() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}>

      {/* Atmospheric bg */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${base}hero-atmosphere.png)`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.12 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1B060F 0%, rgba(27,6,15,0.75) 50%, #1B060F 100%)" }} />

      {/* Content */}
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "7vh 8vw", zIndex: 2 }}>

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "0.22em", color: "#D4AF37" }}>RESONANCIA</div>
          <div style={{ width: "3vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5 }} />
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.15em", color: "rgba(244,218,213,0.4)" }}>TESIS DE INVERSIÓN · 2026</div>
        </div>

        {/* Hero */}
        <div>
          <div style={{ fontSize: "18vw", fontWeight: 800, lineHeight: 0.85, letterSpacing: "-0.05em", color: "#D4AF37", marginBottom: "4vh" }}>
            500M+
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "4vw" }}>
            <div style={{ width: "1px", height: "8vh", backgroundColor: "#D4AF37", flexShrink: 0, marginTop: "0.5vh" }} />
            <div>
              <div style={{ fontSize: "3.2vw", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#F4DAD5", maxWidth: "56vw" }}>
                hispanohablantes en el mundo.
              </div>
              <div style={{ fontSize: "3.2vw", fontWeight: 300, lineHeight: 1.2, letterSpacing: "-0.02em", color: "rgba(244,218,213,0.55)", maxWidth: "56vw" }}>
                Ninguna app de bienestar digital los entiende de verdad.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.3)" }}>CASA DEL CUENCO · iOS · ANDROID</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.3)" }}>01 / 08</div>
        </div>
      </div>
    </div>
  );
}
