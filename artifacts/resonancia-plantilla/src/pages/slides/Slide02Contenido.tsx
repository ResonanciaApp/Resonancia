const BULLETS = [
  { n: "01", text: "Calm y Headspace están en inglés o con traducción superficial — no nacieron para el hispanohablante." },
  { n: "02", text: "Nulo contenido ancestral latinoamericano: cuencos, frecuencias, ceremonias, medicina de la tierra." },
  { n: "03", text: "Precios para mercados de alto ingreso: Calm cuesta hasta USD 70/año." },
  { n: "04", text: "Interfaces complejas, estética occidental genérica. Ninguna resuena culturalmente." },
];

export default function Slide02Contenido() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "8vh 6vw", boxSizing: "border-box" }}
    >
      {/* Eyebrow */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "1.8vh" }}>
        <div style={{ width: "2.5vw", height: "2px", backgroundColor: "#BE9650" }} />
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "#BE9650", letterSpacing: "0.18em" }}>EL PROBLEMA</div>
      </div>

      {/* Headline */}
      <div style={{ fontSize: "4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.06, marginBottom: "5vh", maxWidth: "70vw" }}>
        Un mercado de 580M sin una{" "}
        <span style={{ color: "#BE9650" }}>solución nativa.</span>
      </div>

      {/* Bullets */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0" }}>
        {BULLETS.map((b, i) => (
          <div
            key={b.n}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "2.2vw",
              padding: "2.2vh 0",
              borderBottom: i < BULLETS.length - 1 ? "1px solid rgba(190,150,80,0.12)" : "none",
            }}
          >
            <div style={{ fontSize: "3.2vw", fontWeight: 800, color: "#BE9650", lineHeight: 1, minWidth: "4vw", opacity: 0.45, flexShrink: 0 }}>
              {b.n}
            </div>
            <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "#EDE1D3", lineHeight: 1.5, paddingTop: "0.4vh" }}>
              {b.text}
            </div>
          </div>
        ))}
      </div>

      {/* Callout */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", paddingTop: "3vh", borderTop: "1px solid rgba(190,150,80,0.2)" }}>
        <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "9999px", backgroundColor: "#BE9650", flexShrink: 0 }} />
        <div style={{ fontSize: "1.65vw", fontWeight: 600, color: "#EDE1D3" }}>
          Resultado: un mercado masivo y desatendido, listo para una propuesta propia.
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "5vh", right: "6vw", fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.1em" }}>RESONANCIA</div>
    </div>
  );
}
