export default function SlideA3MusicaSonidos() {
  const accent = "#7DC87D";
  const bg = "linear-gradient(135deg, #1E2E1C 0%, #18110C 60%, #1A2818 100%)";

  const MusicIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <path d="M9 18V5l12-2v13" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="18" r="3" stroke={accent} strokeWidth="1.6" fill={`${accent}22`}/>
      <circle cx="18" cy="16" r="3" stroke={accent} strokeWidth="1.6" fill={`${accent}22`}/>
    </svg>
  );

  const features = [
    {
      title: "Música Ambient",
      body: "Atmósferas sonoras diseñadas para meditar, concentrarse o simplemente flotar en el presente.",
      tag: "Loop infinito",
    },
    {
      title: "Música Enteógena",
      body: "Composiciones que inducen estados expandidos de conciencia de forma natural y segura.",
      tag: "Alta vibración",
    },
    {
      title: "Mezcla Personalizada",
      body: "8 sonidos ambiente (lluvia, mar, bosque, cuencos…) que se superponen a la música a tu gusto.",
      tag: "Tu propio mix",
    },
    {
      title: "Artistas Curados",
      body: "Productores certificados de Latinoamérica y España comprometidos con el bienestar sonoro.",
      tag: "Música original",
    },
  ];

  return (
    <div
      className="w-screen h-screen overflow-hidden relative flex flex-col font-display"
      style={{ background: bg, color: "#EDE1D3", padding: "7vh 7vw", boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", bottom: "-10vh", left: "-5vw", width: "35vw", height: "35vh", borderRadius: "50%", background: `radial-gradient(ellipse, ${accent}10 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3.5vh" }}>
        <div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "0.1em", color: accent, marginBottom: "0.8vh" }}>RESONANCIA</div>
          <div style={{ width: "3.5vw", height: "0.35vh", backgroundColor: accent, opacity: 0.6 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <MusicIcon />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9vw", letterSpacing: "0.15em", color: accent, opacity: 0.7, marginBottom: "0.4vh" }}>CATEGORÍA</div>
            <h2 style={{ fontSize: "3vw", fontWeight: 700, margin: 0, color: "#EDE1D3", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Música y Sonidos
            </h2>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "1.6vw", color: `${accent}CC`, fontWeight: 300, marginBottom: "4vh", maxWidth: "65%" }}>
        Atmósferas sonoras para meditar, crear y existir en calma.
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
          "La música es el lenguaje que el alma entiende sin traducción."
        </div>
        <div style={{ fontSize: "0.95vw", color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026 · 07</div>
      </div>
    </div>
  );
}
