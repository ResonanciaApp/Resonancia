export default function Slide05Mercado() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          04 · EL MERCADO
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Un mercado grande y <span style={{ color: "#BE9650" }}>en plena expansión.</span>
        </div>
      </div>

      {/* Big stats */}
      <div style={{ display: "flex", gap: "2.5vw" }}>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "4vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "5.5vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>US$ 7.000M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.4, marginTop: "1.5vh" }}>
            Mercado global de apps de meditación proyectado a 2033 (desde ~US$ 2.200M en 2025).
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "4vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "5.5vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>~14,7%</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.4, marginTop: "1.5vh" }}>
            Crecimiento anual (CAGR) del mercado global de meditación.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "4vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "5.5vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>US$ 1.060M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.4, marginTop: "1.5vh" }}>
            Mercado de salud mental digital en Latinoamérica a 2030 (CAGR ~14,6%).
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.5, maxWidth: "78vw" }}>
        Más de 500 millones de hispanohablantes y ninguna app premium de bienestar pensada desde su idioma y cultura.
        <span style={{ color: "#7A8FA8", fontSize: "1.5vw", display: "block", marginTop: "1vh" }}>
          Fuentes: Grand View Research, OPS / Banco Mundial, Business of Apps.
        </span>
      </div>
    </div>
  );
}
