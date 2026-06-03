export default function SlideB1Herramientas() {
  const accent = "#BE9650";
  const bg = "#060A0F";

  const HeartIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#E0808A" strokeWidth="1.6" fill="#E0808A22"/>
    </svg>
  );
  const FeatherIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76zM16 8L2 22" stroke="#BE9650" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
  const UsersIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#82BEA8" strokeWidth="1.6"/>
      <circle cx="9" cy="7" r="4" stroke="#82BEA8" strokeWidth="1.6" fill="#82BEA822"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#82BEA8" strokeWidth="1.6"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#82BEA8" strokeWidth="1.6"/>
    </svg>
  );
  const WindIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2" stroke="#8AAAD4" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M12.59 19.41A2 2 0 1 0 14 16H2" stroke="#8AAAD4" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M6.59 11.41A2 2 0 1 1 8 15H2" stroke="#8AAAD4" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );

  const tools = [
    {
      icon: <HeartIcon />,
      color: "#E0808A",
      title: "Muro de Agradecimiento",
      body: "Un espacio colectivo donde la comunidad comparte lo que agradece cada día. Ciencia del bienestar: la gratitud reescribe el sistema nervioso.",
      highlight: "Reconexión diaria · Comunidad real",
    },
    {
      icon: <FeatherIcon />,
      color: "#BE9650",
      title: "Diario",
      body: "Un cuaderno sagrado dentro de la app. Procesa emociones, registra insights de tus sesiones y da seguimiento a tu evolución interior.",
      highlight: "Introspección · Memoria emocional",
    },
    {
      icon: <UsersIcon />,
      color: "#82BEA8",
      title: "Amigos y Grupos",
      body: "Espacio de comunidad viva: comparte prácticas, crea grupos temáticos y avanza acompañado. La transformación se profundiza en colectivo.",
      highlight: "Comunidad · Apoyo mutuo",
    },
    {
      icon: <WindIcon />,
      color: "#8AAAD4",
      title: "Ejercicios de Respiración",
      body: "Técnicas guiadas (coherencia cardíaca, box breathing, 4-7-8) integradas al reproductor. El primer paso hacia la calma está en tu aliento.",
      highlight: "Efecto inmediato · Basado en ciencia",
    },
  ];

  return (
    <div
      className="w-screen h-screen overflow-hidden relative flex flex-col font-display"
      style={{ backgroundColor: bg, color: "#EDE1D3", padding: "7vh 7vw", boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 20%, rgba(190, 150, 80,0.07) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3.5vh" }}>
        <div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "0.1em", color: accent, marginBottom: "0.8vh" }}>RESONANCIA</div>
          <div style={{ width: "3.5vw", height: "0.35vh", backgroundColor: accent, opacity: 0.6 }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.9vw", letterSpacing: "0.15em", color: accent, opacity: 0.7, marginBottom: "0.4vh" }}>EL ECOSISTEMA</div>
          <h2 style={{ fontSize: "3vw", fontWeight: 700, margin: 0, color: "#EDE1D3", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            Herramientas <span style={{ color: accent }}>secundarias</span>
          </h2>
        </div>
      </div>

      <div style={{ fontSize: "1.55vw", color: "#7A8FA8", fontWeight: 300, marginBottom: "4vh" }}>
        Cuatro pilares que convierten RESONANCIA en un ecosistema espiritual completo.
      </div>

      {/* 4 cards 2×2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.8vw", flex: 1 }}>
        {tools.map((t, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "0.8vw",
              padding: "2.8vh 2.4vw",
              display: "flex",
              flexDirection: "column",
              gap: "1vh",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "0.6vh" }}>
              {t.icon}
              <div style={{ fontSize: "1.65vw", fontWeight: 700, color: "#EDE1D3" }}>{t.title}</div>
            </div>
            <div style={{ fontSize: "1.2vw", color: "#9a8070", lineHeight: 1.55, flex: 1 }}>{t.body}</div>
            <div style={{ alignSelf: "flex-start", padding: "0.35vh 0.9vw", backgroundColor: `${t.color}18`, borderRadius: "2vw", border: `1px solid ${t.color}35`, marginTop: "0.5vh" }}>
              <span style={{ fontSize: "1vw", color: t.color }}>{t.highlight}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
        <div style={{ fontSize: "1.15vw", color: `${accent}88`, fontStyle: "italic" }}>
          "Un refugio de sonido también es un espejo, una comunidad y un diario."
        </div>
        <div style={{ fontSize: "0.95vw", color: "#7A8FA8", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026 · 10</div>
      </div>
    </div>
  );
}
