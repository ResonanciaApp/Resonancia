const base = import.meta.env.BASE_URL;

export default function P01Brecha() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      {/* Full-bleed hero image */}
      <div style={{ position: "absolute", inset: 0 }}>
        <img
          src={`${base}hero-app-screens.png`}
          alt="RESONANCIA"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
      </div>

      {/* Bottom fade to blend with footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "22%", background: "linear-gradient(to top, #160108 0%, transparent 100%)" }} />

      {/* Footer label */}
      <div style={{ position: "absolute", bottom: "5vh", left: "7vw", right: "7vw", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
        <div style={{ fontSize: "1.1vw", fontWeight: 500, letterSpacing: "0.2em", color: "rgba(244,218,213,0.45)" }}>TESIS DE INVERSIÓN · 2026</div>
        <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.3)" }}>01 / 08</div>
      </div>
    </div>
  );
}
