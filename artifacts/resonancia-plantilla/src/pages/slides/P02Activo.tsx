export default function P02Activo() {
  const milestones = [
    { year: "2014", text: "Casa del Cuenco abre sus puertas en Santiago" },
    { year: "2017", text: "Primera comunidad presencial de cuencos tibetanos" },
    { year: "2019", text: "Clases, retiros y talleres — miles de alumnos" },
    { year: "2022", text: "Canales digitales superan el millón de seguidores" },
    { year: "2025", text: "Catálogo propio: +180 pistas de audio originales" },
    { year: "2026", text: "RESONANCIA: la plataforma digital, construida" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}>

      {/* Decorative large text watermark */}
      <div style={{ position: "absolute", bottom: "-4vh", right: "-2vw", fontSize: "28vw", fontWeight: 900, color: "rgba(190,150,80,0.04)", letterSpacing: "-0.06em", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>10</div>

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left — Timeline */}
        <div style={{ width: "48vw", padding: "8vh 5vw 8vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#BE9650", marginBottom: "1.5vh" }}>EL ACTIVO QUE NO SE PUEDE COMPRAR</div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#BE9650", opacity: 0.5, marginBottom: "5vh" }} />

            <div style={{ fontSize: "5.5vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "6vh" }}>
              10 años de comunidad.<br />
              <span style={{ color: "#BE9650" }}>Este es el moat.</span>
            </div>

            <div style={{ fontSize: "1.6vw", fontWeight: 400, lineHeight: 1.7, color: "rgba(237,225,211,0.6)", maxWidth: "36vw" }}>
              Ningún competidor puede comprar la confianza, el contenido original y la relación directa con esta comunidad. RESONANCIA no nace de cero — nace de una década de presencia real.
            </div>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(237,225,211,0.25)" }}>02 / 08</div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(190,150,80,0.15)", margin: "8vh 0" }} />

        {/* Right — Milestones */}
        <div style={{ flex: 1, padding: "8vh 5vw 8vh 4vw", display: "flex", flexDirection: "column", justifyContent: "center", gap: "3.2vh" }}>
          {milestones.map((m) => (
            <div key={m.year} style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
              <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#BE9650", width: "4vw", flexShrink: 0, marginTop: "0.1vh" }}>{m.year}</div>
              <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(190,150,80,0.2)", marginTop: "1.1vh", marginRight: "1vw" }} />
              <div style={{ fontSize: "1.35vw", fontWeight: 400, color: "rgba(237,225,211,0.75)", flex: 2, lineHeight: 1.45 }}>{m.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
