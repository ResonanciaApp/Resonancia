export default function PQueEs() {
  const pillars = [
    {
      title: "Sonido como herramienta",
      caption: "Cuencos tibetanos, frecuencias binaurales, música ancestral y naturaleza. Ciencia y tradición al servicio del bienestar.",
    },
    {
      title: "Práctica como hábito",
      caption: "Geometrix, Diario, sesiones guiadas y el Mezclador personal para construir una rutina que dure.",
    },
    {
      title: "Comunidad como raíz",
      caption: "10 años de Casa del Cuenco detrás. No una startup — una comunidad que se convierte en plataforma.",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      {/* Subtle radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 45%, rgba(212,175,55,0.06) 0%, transparent 60%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left column */}
        <div style={{ width: "55vw", padding: "8vh 4vw 8vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            {/* Eyebrow */}
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", color: "#D4AF37", marginBottom: "1.5vh" }}>
              ¿QUÉ ES?
            </div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "4.5vh" }} />

            {/* Headline */}
            <div style={{ fontSize: "4.2vw", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "3.5vh", maxWidth: "46vw" }}>
              El primer santuario digital de bienestar para el mundo hispanohablante.
            </div>

            {/* Body */}
            <div style={{ fontSize: "1.6vw", fontWeight: 400, lineHeight: 1.75, color: "rgba(244,218,213,0.6)", maxWidth: "42vw" }}>
              No es una app de meditación genérica traducida al español. Es una plataforma nativa — con contenido propio, comunidad real y una experiencia diseñada desde adentro.
            </div>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>02 / 10</div>
        </div>

        {/* Vertical rule */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.12)", margin: "8vh 0" }} />

        {/* Right column — 3 pillars */}
        <div style={{ flex: 1, padding: "8vh 8vw 8vh 4vw", display: "flex", flexDirection: "column", justifyContent: "center", gap: 0 }}>
          {pillars.map((p, i) => (
            <div
              key={p.title}
              style={{
                paddingTop: i === 0 ? 0 : "4.5vh",
                paddingBottom: "4.5vh",
                borderBottom: i < pillars.length - 1 ? "1px solid rgba(244,218,213,0.07)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw", marginBottom: "1.2vh" }}>
                <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", backgroundColor: "#D4AF37", marginTop: "0.9vh", flexShrink: 0 }} />
                <div style={{ fontSize: "1.55vw", fontWeight: 600, color: "#F4DAD5", lineHeight: 1.3 }}>{p.title}</div>
              </div>
              <div style={{ fontSize: "1.25vw", fontWeight: 400, lineHeight: 1.65, color: "rgba(244,218,213,0.5)", paddingLeft: "1.95vw" }}>
                {p.caption}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
