export default function Portada() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4" }}
    >
      {/* Ambient radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 65%)", zIndex: 0 }} />

      {/* Center content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5vh" }}>

        {/* RESONANCIA logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3vh" }}>
          <img
            src={`${import.meta.env.BASE_URL}logo-resonancia.png`}
            alt="RESONANCIA"
            style={{ width: "51vw", display: "block", opacity: 0.95 }}
          />
          <div style={{ width: "60%", height: "1.5px", backgroundColor: "rgba(255,255,255,0.20)" }} />
        </div>

        {/* Subtitle */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2vh" }}>
          <div style={{ fontSize: "1.3vw", fontWeight: 400, letterSpacing: "0.35em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
            Santuario de Sonidos
          </div>
        </div>
      </div>

      {/* Bottom brand */}
      <div style={{ position: "absolute", bottom: "5vh", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 1 }}>
        <div style={{ fontSize: "0.85vw", fontWeight: 600, letterSpacing: "0.2em", color: "rgba(255,255,255,0.22)" }}>
          CONFIDENCIAL · NO DISTRIBUIR
        </div>
      </div>

    </div>
  );
}
