export default function Slide02Problema() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          01 · EL PROBLEMA
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "62vw" }}>
          La salud mental en español está <span style={{ color: "#FFFFFF" }}>desatendida.</span>
        </div>
      </div>

      {/* Stat rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3vh" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "2.5vw", borderTop: "1px solid #3D0E16", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "4.5vw", fontWeight: 700, color: "#FFFFFF", width: "16vw", lineHeight: 1 }}>22%</div>
          <div style={{ fontSize: "2vw", fontWeight: 400, color: "rgba(244,244,244,0.50)", lineHeight: 1.45, maxWidth: "58vw" }}>
            de la población de América Latina vive con algún trastorno de salud mental.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "2.5vw", borderTop: "1px solid #3D0E16", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "4.5vw", fontWeight: 700, color: "#FFFFFF", width: "16vw", lineHeight: 1 }}>2,8%</div>
          <div style={{ fontSize: "2vw", fontWeight: 400, color: "rgba(244,244,244,0.50)", lineHeight: 1.45, maxWidth: "58vw" }}>
            del presupuesto de salud de la región se destina a salud mental.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "2.5vw", borderTop: "1px solid #3D0E16", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "4.5vw", fontWeight: 700, color: "#FFFFFF", width: "16vw", lineHeight: 1 }}>+80%</div>
          <div style={{ fontSize: "2vw", fontWeight: 400, color: "rgba(244,244,244,0.50)", lineHeight: 1.45, maxWidth: "58vw" }}>
            de penetración de smartphones en la región: una audiencia enorme lista para apps móviles.
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "rgba(244,244,244,0.50)", lineHeight: 1.5, maxWidth: "72vw" }}>
        Las grandes apps tienen español, pero son traducciones de productos pensados en inglés: ninguna nació para el hispanohablante.
      </div>
    </div>
  );
}
