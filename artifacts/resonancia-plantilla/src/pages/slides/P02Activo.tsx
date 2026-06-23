export default function P02Activo() {
  const milestones = [
    {
      year: "2017",
      text: "Casa del Cuenco abre sus puertas como la primera tienda especializada.",
      highlight: false,
    },
    {
      year: "2018",
      text: "Primera comunidad presencial en base a cursos, talleres y sesiones en vivo.",
      highlight: false,
    },
    {
      year: "2019–2021",
      text: "Nos consolidamos como especialistas en el rubro.",
      highlight: false,
    },
    {
      year: "2022–2025",
      text: "Estancamiento económico pero un crecimiento exponencial en redes sociales. Más de 800k en todas las plataformas.",
      highlight: false,
    },
    {
      year: "2026",
      text: "RESONANCIA: La unificación de la Sonoterapia digitalizada en una plataforma.",
      highlight: true,
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      {/* Watermark */}
      <div style={{ position: "absolute", bottom: "-4vh", right: "-2vw", fontSize: "28vw", fontWeight: 900, color: "rgba(212,175,55,0.04)", letterSpacing: "-0.06em", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>9</div>

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left */}
        <div style={{ width: "46vw", padding: "8vh 5vw 8vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", marginBottom: "1.5vh" }}>
              NUESTRO PRINCIPAL ACTIVO
            </div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5, marginBottom: "4vh" }} />

            <div style={{ fontSize: "5vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "4vh" }}>
              10 años de comunidad.<br />
              <span style={{ color: "#D4AF37" }}>Este es el moat.</span>
            </div>

            <div style={{ fontSize: "1.5vw", fontWeight: 400, lineHeight: 1.75, color: "rgba(244,218,213,0.6)", maxWidth: "34vw" }}>
              Una comunidad que se convierte en una plataforma digital. RESONANCIA no nace de cero — nace de una década de presencia real.
            </div>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>06 / 09</div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.15)", margin: "8vh 0" }} />

        {/* Right — Timeline */}
        <div style={{ flex: 1, padding: "8vh 7vw 8vh 4vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>

          {/* Vertical line */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "0" }}>
            {milestones.map((m, i) => (
              <div key={m.year} style={{ display: "flex", alignItems: "flex-start", gap: "1.8vw", paddingBottom: i < milestones.length - 1 ? "3.5vh" : 0 }}>

                {/* Year + dot column */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: "8vw" }}>
                  <div style={{
                    fontSize: m.highlight ? "1.3vw" : "1.15vw",
                    fontWeight: m.highlight ? 800 : 600,
                    color: "#D4AF37",
                    letterSpacing: "0.02em",
                    textAlign: "right",
                    width: "100%",
                    whiteSpace: "nowrap",
                  }}>
                    {m.year}
                  </div>
                </div>

                {/* Dot + line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, marginTop: "0.4vh" }}>
                  <div style={{
                    width: m.highlight ? "10px" : "7px",
                    height: m.highlight ? "10px" : "7px",
                    borderRadius: "50%",
                    backgroundColor: m.highlight ? "#D4AF37" : "rgba(212,175,55,0.35)",
                    boxShadow: m.highlight ? "0 0 10px rgba(212,175,55,0.6)" : "none",
                    flexShrink: 0,
                  }} />
                  {i < milestones.length - 1 && (
                    <div style={{ width: "1px", flex: 1, minHeight: "3vh", backgroundColor: "rgba(212,175,55,0.15)", marginTop: "4px" }} />
                  )}
                </div>

                {/* Text */}
                <div style={{
                  fontSize: m.highlight ? "1.4vw" : "1.25vw",
                  fontWeight: m.highlight ? 600 : 400,
                  lineHeight: 1.5,
                  color: m.highlight ? "#F4DAD5" : "rgba(244,218,213,0.6)",
                  paddingBottom: i < milestones.length - 1 ? "3.5vh" : 0,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
