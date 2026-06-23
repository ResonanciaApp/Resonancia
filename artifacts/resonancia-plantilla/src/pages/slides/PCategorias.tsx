export default function PCategorias() {
  const categories = [
    {
      name: "Meditaciones",
      color: "#A78BCA",
      desc: "Meditaciones con voz guiada para aquietar la mente, profundizar la consciencia y despertar la presencia interior.",
      img: "/resonancia-plantilla/screenshots/meditaciones.jpg",
    },
    {
      name: "Música",
      color: "#7BB8C4",
      desc: "Música ambient, enteógena, tribal y étnica que acompaña el viaje interior — desde el silencio hasta la expansión.",
      img: "/resonancia-plantilla/screenshots/musica.jpg",
    },
    {
      name: "Ancestrales",
      color: "#D4AF37",
      desc: "Instrumentos milenarios — cuencos tibetanos, gongs y campanas — que inducen estados profundos de relajación y coherencia interior.",
      img: "/resonancia-plantilla/screenshots/ancestrales.jpg",
    },
    {
      name: "Reflexiones",
      color: "#C4916B",
      desc: "Palabras, relatos y episodios que invitan a la contemplación — sabiduría, podcast, ASMR e historias para el alma.",
      img: "/resonancia-plantilla/screenshots/reflexiones.jpg",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 55%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "4vh 7vw 3.5vh", zIndex: 2 }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5vh", flexShrink: 0 }}>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "1.2vh" }} />
          <div style={{ fontSize: "3.2vw", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#F4DAD5" }}>
            Catálogo de contenido.
          </div>
          <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "rgba(244,218,213,0.45)", marginTop: "0.7vh" }}>
            Música y sonidos para el descanso, la meditación y el bienestar.
          </div>
        </div>

        {/* Columns */}
        <div style={{ display: "flex", gap: "0", flex: 1, minHeight: 0 }}>
          {categories.map((cat, i) => (
            <div
              key={cat.name}
              style={{
                flex: 1,
                paddingRight: i < 3 ? "2vw" : 0,
                paddingLeft: i > 0 ? "2vw" : 0,
                borderRight: i < 3 ? "1px solid rgba(244,218,213,0.07)" : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Screenshot */}
              <div
                style={{
                  flexShrink: 0,
                  height: "40vh",
                  width: "100%",
                  maxWidth: "12vw",
                  marginBottom: "2.5vh",
                  borderRadius: "1.2vw",
                  overflow: "hidden",
                  border: `1px solid ${cat.color}30`,
                  boxShadow: `0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.3)`,
                  backgroundColor: "#0D020A",
                }}
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
                />
              </div>

              {/* Color bar */}
              <div style={{ width: "2vw", height: "2px", backgroundColor: cat.color, marginBottom: "1.5vh", borderRadius: "2px", flexShrink: 0 }} />

              {/* Category name */}
              <div style={{ fontSize: "1.9vw", fontWeight: 800, color: "#F4DAD5", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "1.2vh", textAlign: "center", flexShrink: 0 }}>
                {cat.name}
              </div>

              {/* Description */}
              <div style={{ fontSize: "1.05vw", fontWeight: 400, lineHeight: 1.65, color: "rgba(244,218,213,0.45)", textAlign: "center" }}>
                {cat.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2.5vh", flexShrink: 0 }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>05 / 10</div>
        </div>
      </div>
    </div>
  );
}
