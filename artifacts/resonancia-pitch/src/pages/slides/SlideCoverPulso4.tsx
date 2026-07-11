export default function SlideCoverPulso4() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #2d1c52 0%, #24245d 33%, #1f2a62 66%, #2d4081 100%)", color: "#F4F4F4" }}
    >
      {/* Ambient radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 65%)", zIndex: 0 }} />

      {/* Center content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5vh" }}>

        {/* Pulso 4 logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3vh" }}>
          <img
            src={`${import.meta.env.BASE_URL}logo-pulso4.png`}
            alt="Pulso 4"
            style={{ width: "30vw", display: "block", opacity: 0.92 }}
          />
          <div style={{ width: "60%", height: "1.5px", backgroundColor: "rgba(255,255,255,0.20)" }} />
        </div>

        {/* Subtitle */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2vh" }}>
          <div style={{ fontSize: "1.3vw", fontWeight: 400, letterSpacing: "0.35em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
            Presentación Privada · Inversionistas
          </div>
          <div style={{ fontSize: "1.0vw", fontWeight: 400, letterSpacing: "0.15em", color: "rgba(255,255,255,0.28)" }}>
            RESONANCIA — Casa del Cuenco · 2026
          </div>
        </div>
      </div>

      {/* Bottom brand */}
      <div style={{ position: "absolute", bottom: "5vh", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 1 }}>
        <div style={{ fontSize: "0.85vw", fontWeight: 600, letterSpacing: "0.2em", color: "rgba(255,255,255,0.22)" }}>
          CONFIDENCIAL · NO DISTRIBUIR
        </div>
      </div>

      {/* Pulso 4 · logo esquina */}
      <div style={{ position: "absolute", top: "3.5vh", right: "3vw", zIndex: 200, pointerEvents: "none" }}>
        <img src={`${import.meta.env.BASE_URL}logo-pulso4.png`} alt="Pulso 4" style={{ height: "4.5vh", opacity: 0.50, display: "block" }} />
      </div>
    </div>
  );
}
