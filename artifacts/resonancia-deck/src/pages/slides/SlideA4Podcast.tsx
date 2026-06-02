export default function SlideA4Podcast() {
  const accent = "#8AAAD4";
  const bg = "linear-gradient(135deg, #101A28 0%, #18110C 60%, #121C2A 100%)";

  const MicIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="11" rx="3" stroke={accent} strokeWidth="1.6" fill={`${accent}22`}/>
      <path d="M5 10a7 7 0 0 0 14 0" stroke={accent} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="12" y1="17" x2="12" y2="21" stroke={accent} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="9" y1="21" x2="15" y2="21" stroke={accent} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );

  const episodes = [
    {
      title: "HaciaAdentro",
      body: "Conversaciones profundas con referentes del bienestar, la espiritualidad y la psicología transpersonal.",
      tag: "Episodios semanales",
    },
    {
      title: "Ciencia del Despertar",
      body: "Neurociencia, epigenética y meditación: cómo el sonido reconfigura el cerebro y el sistema nervioso.",
      tag: "Basado en evidencia",
    },
    {
      title: "Relatos de Transformación",
      body: "Historias reales de personas que reconstruyeron su vida interior a través del sonido y el silencio.",
      tag: "Testimonios reales",
    },
    {
      title: "Prácticas en 3 Minutos",
      body: "Sabiduría condensada para aplicar en el día a día. Una idea, una práctica, un cambio real.",
      tag: "Micro-aprendizajes",
    },
  ];

  return (
    <div
      className="w-screen h-screen overflow-hidden relative flex flex-col font-display"
      style={{ background: bg, color: "#EDE1D3", padding: "7vh 7vw", boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", top: "5vh", right: "-5vw", width: "32vw", height: "32vh", borderRadius: "50%", background: `radial-gradient(ellipse, ${accent}10 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3.5vh" }}>
        <div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "0.1em", color: accent, marginBottom: "0.8vh" }}>RESONANCIA</div>
          <div style={{ width: "3.5vw", height: "0.35vh", backgroundColor: accent, opacity: 0.6 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <MicIcon />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9vw", letterSpacing: "0.15em", color: accent, opacity: 0.7, marginBottom: "0.4vh" }}>CATEGORÍA</div>
            <h2 style={{ fontSize: "3vw", fontWeight: 700, margin: 0, color: "#EDE1D3", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              HaciaAdentro · PodCast
            </h2>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "1.6vw", color: `${accent}CC`, fontWeight: 300, marginBottom: "4vh", maxWidth: "65%" }}>
        Conversaciones que despiertan el alma y expanden la mente.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.8vw", flex: 1 }}>
        {episodes.map((e, i) => (
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
            <div style={{ fontSize: "1.65vw", fontWeight: 700, color: "#EDE1D3" }}>{e.title}</div>
            <div style={{ fontSize: "1.25vw", color: "#9a8070", lineHeight: 1.5, flex: 1 }}>{e.body}</div>
            <div style={{ alignSelf: "flex-start", padding: "0.4vh 1vw", backgroundColor: `${accent}15`, borderRadius: "2vw", border: `1px solid ${accent}30` }}>
              <span style={{ fontSize: "1.05vw", color: accent }}>{e.tag}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
        <div style={{ fontSize: "1.15vw", color: `${accent}99`, fontStyle: "italic" }}>
          "Escuchar con atención es el acto más radical de presencia."
        </div>
        <div style={{ fontSize: "0.95vw", color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026 · 08</div>
      </div>
    </div>
  );
}
