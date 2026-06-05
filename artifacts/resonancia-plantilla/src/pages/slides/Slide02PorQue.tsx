export default function Slide02PorQue() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          01 · POR QUÉ IMPORTA
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "70vw" }}>
          Una necesidad real, <span style={{ color: "#BE9650" }}>mal atendida en español.</span>
        </div>
      </div>

      {/* Three cards */}
      <div style={{ display: "flex", gap: "2.2vw" }}>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "4vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#BE9650", marginBottom: "2vh" }}>Ansiedad e insomnio</div>
          <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.65 }}>
            Cada vez más personas buscan herramientas simples para dormir mejor y calmar la mente en su día a día.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "4vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#BE9650", marginBottom: "2vh" }}>Casi todo en inglés</div>
          <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.65 }}>
            El contenido de bienestar de calidad rara vez está pensado, narrado y producido para hispanohablantes.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "4vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#BE9650", marginBottom: "2vh" }}>+580M de personas</div>
          <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.65 }}>
            Más de 580 millones de hispanohablantes y ninguna plataforma de meditación nativa pensada para ellos.
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "#EDE1D3", lineHeight: 1.5, maxWidth: "76vw" }}>
        No es un nicho pequeño: es un público enorme esperando algo hecho para ellos.
      </div>
    </div>
  );
}
