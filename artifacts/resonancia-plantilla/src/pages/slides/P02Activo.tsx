export default function P02Activo() {
  const columns = [
    {
      label: "La crisis",
      stat: "×3",
      context: "El diagnóstico de ansiedad y depresión en LatAm se triplicó post-2020",
      sub: "Fuente: OPS / OMS 2023",
    },
    {
      label: "La saturación",
      stat: "94%",
      context: "del contenido de las 10 apps de bienestar más descargadas está en inglés",
      sub: "App Store · Google Play · 2025",
    },
    {
      label: "La ventana",
      stat: "Ahora",
      context: "El mercado digital hispano crece a doble dígito. La posición de liderazgo aún no está tomada",
      sub: "eMarketer · Statista 2024–2026",
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      {/* Horizontal gold rule center */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", backgroundColor: "rgba(212,175,55,0.08)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "8vh 8vw", zIndex: 2 }}>

        <div style={{ marginBottom: "5vh" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", marginBottom: "1.5vh" }}>
            NUESTRO PRINCIPAL ACTIVO
          </div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5 }} />
        </div>

        <div style={{ fontSize: "5vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "8vh", maxWidth: "65vw" }}>
          10 años de comunidad.<br />
          <span style={{ color: "#D4AF37" }}>Este es el moat.</span>
        </div>

        <div style={{ display: "flex", gap: "0", flex: 1, alignItems: "flex-start" }}>
          {columns.map((c, i) => (
            <div key={i} style={{ flex: 1, paddingLeft: i > 0 ? "3vw" : 0, paddingRight: i < columns.length - 1 ? "3vw" : 0, borderLeft: i > 0 ? "1px solid rgba(212,175,55,0.15)" : "none" }}>
              <div style={{ fontSize: "1.1vw", fontWeight: 500, letterSpacing: "0.15em", color: "rgba(244,218,213,0.4)", marginBottom: "2vh" }}>{c.label.toUpperCase()}</div>
              <div style={{ fontSize: "8vw", fontWeight: 800, lineHeight: 0.9, letterSpacing: "-0.04em", color: "#D4AF37", marginBottom: "2.5vh" }}>{c.stat}</div>
              <div style={{ fontSize: "1.55vw", fontWeight: 400, lineHeight: 1.6, color: "rgba(244,218,213,0.75)", marginBottom: "1.5vh" }}>{c.context}</div>
              <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(244,218,213,0.3)", letterSpacing: "0.05em" }}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", paddingTop: "4vh", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>06 / 09</div>
        </div>
      </div>
    </div>
  );
}
