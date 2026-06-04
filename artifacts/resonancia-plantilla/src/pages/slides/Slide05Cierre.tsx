const STATS = [
  { val: "580M+", label: "TAM", sub: "hispanohablantes globales" },
  { val: "~120M", label: "SAM", sub: "usuarios activos de apps bienestar LATAM + US Hispanic" },
  { val: "USD 2.4M", label: "ARR año 1", sub: "proyectado con 50.000 suscriptores premium" },
];

const TENDENCIAS = [
  "↑ Salud mental post-pandemia",
  "↑ Identidad cultural latina en auge",
  "↑ Penetración móvil en LATAM",
  "↑ Demanda de contenido auténtico en español",
];

export default function Slide05Cierre() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "8vh 6vw", boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 40%, rgba(190,150,80,0.07) 0%, rgba(6,10,15,0) 62%)" }} />

      {/* Eyebrow */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "1.8vh", position: "relative" }}>
        <div style={{ width: "2.5vw", height: "2px", backgroundColor: "#BE9650" }} />
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "#BE9650", letterSpacing: "0.18em" }}>MERCADO Y OPORTUNIDAD</div>
      </div>

      {/* Headline */}
      <div style={{ fontSize: "4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.06, marginBottom: "5vh", position: "relative" }}>
        Un mercado grande y{" "}
        <span style={{ color: "#BE9650" }}>sin competencia nativa.</span>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: "2.5vw", position: "relative" }}>
        {STATS.map((s) => (
          <div
            key={s.val}
            style={{
              flex: 1,
              backgroundColor: "#0C1119",
              borderRadius: "1.2vw",
              padding: "3.5vh 2.5vw",
              boxSizing: "border-box",
              borderTop: "2px solid #BE9650",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.16em", marginBottom: "1.5vh", opacity: 0.8 }}>{s.label}</div>
            <div style={{ fontSize: "4.2vw", fontWeight: 800, color: "#BE9650", lineHeight: 1, letterSpacing: "-0.03em" }}>{s.val}</div>
            <div style={{ fontSize: "1.4vw", color: "#7A8FA8", marginTop: "1.5vh", lineHeight: 1.5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tendencias */}
      <div style={{ marginTop: "4vh", position: "relative" }}>
        <div style={{ fontSize: "1.2vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "2vh" }}>TENDENCIAS A FAVOR</div>
        <div style={{ display: "flex", gap: "1.5vw" }}>
          {TENDENCIAS.map((t) => (
            <div
              key={t}
              style={{
                flex: 1,
                backgroundColor: "#0C1119",
                borderRadius: "0.7vw",
                padding: "1.4vh 1.6vw",
                boxSizing: "border-box",
                fontSize: "1.4vw",
                color: "#EDE1D3",
                fontWeight: 500,
                lineHeight: 1.4,
                borderLeft: "3px solid rgba(190,150,80,0.35)",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "5vh", right: "6vw", fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.1em" }}>RESONANCIA</div>
    </div>
  );
}
