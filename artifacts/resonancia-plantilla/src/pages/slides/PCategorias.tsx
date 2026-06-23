export default function PCategorias() {
  const categories = [
    {
      name: "Meditaciones",
      color: "#A78BCA",
      desc: "Guiadas por maestros para mente, cuerpo y espíritu",
      subs: ["Yoga", "Ansiedad", "Mindfulness", "Para dormir", "Chakras", "Respiración"],
    },
    {
      name: "Música",
      color: "#7BB8C4",
      desc: "Ambiente sonoro inmersivo para cada estado de ánimo",
      subs: ["Naturaleza", "Ambient", "Binaural", "Enteógena", "Spa", "Frecuencias"],
    },
    {
      name: "Ancestrales",
      color: "#D4AF37",
      desc: "Instrumentos sagrados de la tradición del sonido",
      subs: ["Cuencos tibetanos", "Gongs", "Campanas", "Mantras", "Curación", "Terapia"],
    },
    {
      name: "Reflexiones",
      color: "#C4916B",
      desc: "Historias, voz interior y contenido narrativo",
      subs: ["ASMR", "Historias", "Podcast", "Voz interior", "Frase del día", "Relatos"],
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 55%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "6vh 7vw 5vh", zIndex: 2 }}>

        {/* Header */}
        <div style={{ marginBottom: "5vh", flexShrink: 0 }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", color: "#D4AF37", marginBottom: "1.5vh" }}>
            CATÁLOGO DE CONTENIDO
          </div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45 }} />
        </div>

        {/* Columns — fill remaining height */}
        <div style={{ display: "flex", gap: "0", flex: 1, minHeight: 0 }}>
          {categories.map((cat, i) => (
            <div
              key={cat.name}
              style={{
                flex: 1,
                paddingRight: i < 3 ? "2.5vw" : 0,
                paddingLeft: i > 0 ? "2.5vw" : 0,
                borderRight: i < 3 ? "1px solid rgba(244,218,213,0.07)" : "none",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Top: color bar + name + desc */}
              <div style={{ flex: "0 0 auto" }}>
                <div style={{ width: "2.8vw", height: "3px", backgroundColor: cat.color, marginBottom: "2.5vh", borderRadius: "2px" }} />
                <div style={{ fontSize: "3.6vw", fontWeight: 800, color: "#F4DAD5", lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "1.8vh" }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: "1.2vw", fontWeight: 400, lineHeight: 1.6, color: "rgba(244,218,213,0.4)" }}>
                  {cat.desc}
                </div>
              </div>

              {/* Connector */}
              <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", margin: "4vh 0 2.5vh" }}>
                <div style={{ width: "1px", height: "4vh", backgroundColor: cat.color, opacity: 0.3 }} />
                <div style={{ width: "60%", height: "1px", backgroundColor: cat.color, opacity: 0.15 }} />
                <div style={{ width: "1px", height: "2vh", backgroundColor: cat.color, opacity: 0.3 }} />
              </div>

              {/* Subcategory pills */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8vh 0.5vw" }}>
                  {cat.subs.map((sub) => (
                    <div
                      key={sub}
                      style={{
                        fontSize: "1.05vw",
                        fontWeight: 500,
                        letterSpacing: "0.03em",
                        color: cat.color,
                        backgroundColor: `${cat.color}10`,
                        border: `1px solid ${cat.color}28`,
                        borderRadius: "999px",
                        padding: "0.6vh 1.1vw",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sub}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "3vh", flexShrink: 0 }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>05 / 12</div>
        </div>
      </div>
    </div>
  );
}
