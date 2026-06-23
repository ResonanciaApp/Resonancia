export default function PMercadoApp() {
  const stats = [
    {
      label: "El mercado",
      stat: "$6.8B",
      context: "El mercado global de apps de bienestar en 2023, con proyección de superar USD 20B para 2030 a una tasa del 17% anual",
      sub: "Grand View Research · 2023",
    },
    {
      label: "El usuario ignorado",
      stat: "500M+",
      context: "Hispanohablantes en el mundo. Sin una sola app de bienestar líder nativa en su idioma y cultura",
      sub: "Instituto Cervantes · 2024",
    },
    {
      label: "La oportunidad",
      stat: "<4%",
      context: "Retención promedio a 30 días en apps de meditación. El contenido genérico no fideliza — la identidad cultural sí",
      sub: "Sensor Tower · AppsFlyer · 2024",
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      {/* Horizontal gold rule center */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", backgroundColor: "rgba(212,175,55,0.08)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "8vh 8vw", zIndex: 2 }}>

        <div style={{ marginBottom: "6vh" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#BE9650", marginBottom: "1.5vh" }}>EL SECTOR</div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5 }} />
        </div>

        <div style={{ fontSize: "5.5vw", fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "8vh", maxWidth: "65vw" }}>
          Un mercado en expansión<br /><span style={{ color: "#BE9650" }}>sin dueño en español.</span>
        </div>

        <div style={{ display: "flex", gap: "0", flex: 1, alignItems: "flex-start" }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              flex: 1,
              paddingLeft: i > 0 ? "3vw" : 0,
              paddingRight: i < stats.length - 1 ? "3vw" : 0,
              borderLeft: i > 0 ? "1px solid rgba(212,175,55,0.15)" : "none",
            }}>
              <div style={{ fontSize: "1.1vw", fontWeight: 500, letterSpacing: "0.15em", color: "rgba(244,218,213,0.4)", marginBottom: "2vh" }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: "7vw", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.04em", color: "#BE9650", marginBottom: "2.5vh" }}>{s.stat}</div>
              <div style={{ fontSize: "1.55vw", fontWeight: 400, lineHeight: 1.6, color: "rgba(244,218,213,0.75)", marginBottom: "1.5vh" }}>{s.context}</div>
              <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(244,218,213,0.3)", letterSpacing: "0.05em" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", paddingTop: "4vh", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>08 / 10</div>
        </div>
      </div>
    </div>
  );
}
