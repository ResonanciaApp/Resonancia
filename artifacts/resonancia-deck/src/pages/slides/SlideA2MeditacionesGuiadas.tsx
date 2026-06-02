export default function SlideA2MeditacionesGuiadas() {
  const accent = "#C8B4E0";
  const bg = "linear-gradient(135deg, #251633 0%, #18110C 60%, #1C1025 100%)";

  const EyeIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={accent} strokeWidth="1.6" fill="none"/>
      <circle cx="12" cy="12" r="3" stroke={accent} strokeWidth="1.6" fill={`${accent}22`}/>
      <circle cx="12" cy="12" r="1" fill={accent}/>
    </svg>
  );

  const features = [
    {
      title: "Voces Guía Certificadas",
      body: "Meditadores y terapeutas con años de práctica. Cada sesión es un viaje cuidadosamente diseñado.",
      tag: "Expertos certificados",
    },
    {
      title: "Viajes de Visualización",
      body: "Técnicas de imaginería guiada para explorar el paisaje interior y liberar tensiones profundas.",
      tag: "Visualización activa",
    },
    {
      title: "Atención Plena (Mindfulness)",
      body: "Sesiones cortas y largas para anclar la mente al presente. Desde 10 hasta 60 minutos.",
      tag: "Flexible · Progresivo",
    },
    {
      title: "Meditación para el Sueño",
      body: "Protocolos específicos de body scan y relajación progresiva para inducir el descanso.",
      tag: "Efecto inmediato",
    },
  ];

  return (
    <div
      className="w-screen h-screen overflow-hidden relative flex flex-col font-display"
      style={{ background: bg, color: "#EDE1D3", padding: "7vh 7vw", boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", top: "-10vh", right: "-8vw", width: "38vw", height: "38vh", borderRadius: "50%", background: `radial-gradient(ellipse, ${accent}10 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3.5vh" }}>
        <div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "0.1em", color: accent, marginBottom: "0.8vh" }}>RESONANCIA</div>
          <div style={{ width: "3.5vw", height: "0.35vh", backgroundColor: accent, opacity: 0.6 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <EyeIcon />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9vw", letterSpacing: "0.15em", color: accent, opacity: 0.7, marginBottom: "0.4vh" }}>CATEGORÍA</div>
            <h2 style={{ fontSize: "3vw", fontWeight: 700, margin: 0, color: "#EDE1D3", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Meditaciones Guiadas
            </h2>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "1.6vw", color: `${accent}CC`, fontWeight: 300, marginBottom: "4vh", maxWidth: "65%" }}>
        Viajes interiores con guía experta, para cualquier nivel de experiencia.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.8vw", flex: 1 }}>
        {features.map((f, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: `1px solid ${accent}22`,
              borderRadius: "0.8vw",
              padding: "3vh 2.4vw",
              display: "flex",
              flexDirection: "column",
              gap: "1.2vh",
            }}
          >
            <div style={{ width: "2.2vw", height: "0.35vh", backgroundColor: accent, opacity: 0.5 }} />
            <div style={{ fontSize: "1.65vw", fontWeight: 700, color: "#EDE1D3" }}>{f.title}</div>
            <div style={{ fontSize: "1.25vw", color: "#9a8070", lineHeight: 1.5, flex: 1 }}>{f.body}</div>
            <div style={{ alignSelf: "flex-start", padding: "0.4vh 1vw", backgroundColor: `${accent}15`, borderRadius: "2vw", border: `1px solid ${accent}30` }}>
              <span style={{ fontSize: "1.05vw", color: accent }}>{f.tag}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
        <div style={{ fontSize: "1.15vw", color: `${accent}99`, fontStyle: "italic" }}>
          "La mente quieta es el primer paso hacia uno mismo."
        </div>
        <div style={{ fontSize: "0.95vw", color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026 · 06</div>
      </div>
    </div>
  );
}
