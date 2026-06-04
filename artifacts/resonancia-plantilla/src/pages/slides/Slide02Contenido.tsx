export default function Slide02Contenido() {
  const bullets = [
    "Calm y Headspace están en inglés o con traducción superficial — no nacieron para el hispanohablante.",
    "Nulo contenido ancestral latinoamericano: cuencos, frecuencias, ceremonias, medicina de la tierra.",
    "Precios para mercados de alto ingreso: Calm cuesta hasta USD 70/año.",
    "Interfaces complejas, estética occidental genérica. Ninguna resuena culturalmente.",
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          01 · EL PROBLEMA
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "68vw" }}>
          Un mercado de 580M sin una{" "}
          <span style={{ color: "#BE9650" }}>solución nativa.</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.8vh" }}>
        {bullets.map((text, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "2vw", borderTop: "1px solid rgba(190,150,80,0.15)", paddingTop: "2.2vh" }}>
            <div style={{ fontSize: "2.2vw", fontWeight: 700, color: "#BE9650", width: "3vw", lineHeight: 1, flexShrink: 0 }}>
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ fontSize: "1.75vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.5 }}>
              {text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: "1.7vw", fontWeight: 500, color: "#EDE1D3", lineHeight: 1.45 }}>
        Resultado: un mercado masivo y desatendido, listo para una propuesta propia.
      </div>

      <div style={{ position: "absolute", bottom: "5vh", right: "6vw", fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.08em" }}>
        RESONANCIA
      </div>
    </div>
  );
}
