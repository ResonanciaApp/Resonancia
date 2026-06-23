import { GOLD_GRADIENT } from "@/utils/goldText";
export default function PCategorias() {
  const categories = [
    {
      name: "Meditaciones",
      color: "#7B5FA8",
      desc: "Meditaciones con voz guiada para aquietar la mente, profundizar la consciencia y despertar la presencia interior.",
      img: "/resonancia-plantilla/screenshots/meditaciones.jpg",
    },
    {
      name: "Música",
      color: "#5A9BAA",
      desc: "Música ambient, enteógena, tribal y étnica que acompaña el viaje interior — desde el silencio hasta la expansión.",
      img: "/resonancia-plantilla/screenshots/musica.jpg",
    },
    {
      name: "Ancestrales",
      color: "#B8922A",
      desc: "Instrumentos milenarios — cuencos tibetanos, gongs y campanas — que inducen estados profundos de relajación y coherencia interior.",
      img: "/resonancia-plantilla/screenshots/ancestrales.jpg",
    },
    {
      name: "Reflexiones",
      color: "#5A9BAA",
      desc: "Palabras, relatos y episodios que invitan a la contemplación — sabiduría, podcast, ASMR e historias para el alma.",
      img: "/resonancia-plantilla/screenshots/reflexiones.jpg",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "4vh 7vw 3.5vh", zIndex: 2 }}>

        {/* Header */}
        <div style={{ marginBottom: "2.5vh", flexShrink: 0 }}>
          <div style={{ fontSize: "1.05vw", fontWeight: 600, letterSpacing: "0.18em", ...GOLD_GRADIENT, marginBottom: "0.8vh" }}>
            MÚSICA Y SONIDOS PARA EL DESCANSO, LA MEDITACIÓN Y EL BIENESTAR.
          </div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#BE9650", opacity: 0.6, marginBottom: "1.2vh" }} />
          <div style={{ fontSize: "3.2vw", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#F4DAD5" }}>
            Catálogo de contenido.
          </div>
        </div>

        {/* Columns */}
        <div style={{ display: "flex", gap: "0", flex: 1, minHeight: 0, alignItems: "center" }}>
          {categories.map((cat, i) => (
            <div
              key={cat.name}
              style={{
                flex: 1,
                paddingRight: i < 3 ? "2vw" : 0,
                paddingLeft: i > 0 ? "2vw" : 0,
                borderRight: i < 3 ? "1px solid rgba(244,218,213,0.1)" : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Screenshot */}
              <div
                style={{
                  flexShrink: 0,
                  marginTop: 18,
                  height: "48vh",
                  width: "100%",
                  maxWidth: "14vw",
                  marginBottom: "2.5vh",
                  borderRadius: "1.2vw",
                  overflow: "hidden",
                  border: `1px solid ${cat.color}50`,
                  boxShadow: `0 6px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(244,218,213,0.06)`,
                  backgroundColor: "#1B060F",
                }}
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  style={{ width: "100%", height: "auto", minHeight: "100%", display: "block", verticalAlign: "top" }}
                />
              </div>

              {/* Color bar */}
              <div style={{ width: "2vw", height: "2px", backgroundColor: cat.color, marginBottom: "1.5vh", borderRadius: "2px", flexShrink: 0 }} />

              {/* Category name */}
              <div style={{ fontSize: "1.9vw", fontWeight: 800, color: "#F4DAD5", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "1.2vh", textAlign: "center", flexShrink: 0 }}>
                {cat.name}
              </div>

              {/* Description */}
              <div style={{ fontSize: "1.05vw", fontWeight: 400, lineHeight: 1.65, color: "rgba(244,218,213,0.5)", textAlign: "center" }}>
                {cat.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: "3.5vh", right: "7vw" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.3)" }}>05 / 10</div>
        </div>
      </div>
    </div>
  );
}
