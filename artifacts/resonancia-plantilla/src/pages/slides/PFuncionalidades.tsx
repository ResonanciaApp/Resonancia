const GoldIcon = ({ paths }: { paths: string[] }) => (
  <div style={{
    width: "2.6vw",
    height: "2.6vw",
    minWidth: "2.6vw",
    borderRadius: "50%",
    backgroundColor: "rgba(212,175,55,0.12)",
    boxShadow: "0 0 14px 4px rgba(212,175,55,0.35), 0 0 6px 1px rgba(233,196,106,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }}>
    <svg
      viewBox="0 0 24 24"
      width="1.45vw"
      height="1.45vw"
      fill="none"
      stroke="url(#goldGrad)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: "drop-shadow(0 0 3px rgba(212,175,55,0.7))" }}
    >
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#E9C46A" />
        </linearGradient>
      </defs>
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  </div>
);

export default function PFuncionalidades() {
  const features = [
    {
      name: "Biblioteca",
      tag: "tipo Spotify",
      desc: "Sesiones organizadas por categoría, estado de ánimo y duración. Recientes, favoritos, playlists propias.",
      icon: [
        "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",
        "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z",
      ],
    },
    {
      name: "Mezclador",
      tag: "de sonidos",
      desc: "Capas de sonido ambiente combinables en tiempo real. Presets guardables y mezclador personal.",
      icon: [
        "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3",
        "M1 14h6M9 8h6M17 16h6",
      ],
    },
    {
      name: "Reproductores",
      tag: "inteligentes",
      desc: "Timer, loops, control de volumen por capa, lock-screen y reproducción en segundo plano.",
      icon: [
        "M3 18v-6a9 9 0 0 1 18 0v6",
        "M21 18a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h3z",
        "M3 18a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2H3z",
      ],
    },
    {
      name: "Geometrix",
      tag: "meditación activa",
      desc: "Geometría sagrada interactiva como herramienta de enfoque y meditación visual. Único en su categoría.",
      icon: null,
    },
    {
      name: "Video y Streaming",
      tag: "contenido audiovisual",
      desc: "Sesiones en video bajo demanda + sesiones en vivo con guías certificados en tiempo real.",
      icon: [
        "M15 10l4.553-2.069A1 1 0 0 1 21 8.87V15.13a1 1 0 0 1-1.447.9L15 14",
        "M3 8h12a0 0 0 0 1 0 0v8a0 0 0 0 1 0 0H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z",
      ],
    },
    {
      name: "Ecosistema social",
      tag: "perfiles y comunidad",
      desc: "Resonadores, mezclas compartidas, perfil personalizable y conexión con la comunidad.",
      icon: [
        "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
        "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
        "M23 21v-2a4 4 0 0 0-3-3.87",
        "M16 3.13a4 4 0 0 1 0 7.75",
      ],
    },
    {
      name: "Sesiones en Vivo",
      tag: "guías certificados",
      desc: "Streaming directo con maestros del sonido y meditación. Valoración y seguimiento post-sesión.",
      icon: [
        "M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14",
        "M12 12h.01",
      ],
    },
    {
      name: "Diario personal",
      tag: "práctica y progreso",
      desc: "Registro de reflexiones, racha de escucha diaria y seguimiento de hábitos de bienestar.",
      icon: [
        "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
        "M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
        "M8 7h8M8 11h5",
      ],
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.05) 0%, transparent 50%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left */}
        <div style={{ width: "28vw", padding: "8vh 3vw 8vh 7vw", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", color: "#D4AF37", marginBottom: "1.5vh" }}>
              FUNCIONALIDADES
            </div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "4vh" }} />
            <div style={{ fontSize: "12vw", fontWeight: 900, lineHeight: 0.85, letterSpacing: "-0.06em", color: "rgba(212,175,55,0.12)", marginBottom: "3vh" }}>
              8
            </div>
            <div style={{ fontSize: "3.2vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#F4DAD5" }}>
              Todo en<br />una sola<br />app.
            </div>
          </div>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>04 / 09</div>
        </div>

        {/* Vertical rule */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.1)", margin: "7vh 0" }} />

        {/* Right — 4×2 grid */}
        <div style={{ flex: 1, padding: "7vh 7vw 7vh 3vw", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr 1fr 1fr", gap: "0" }}>
          {features.map((f, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const borderRight = col === 0 ? "1px solid rgba(244,218,213,0.06)" : "none";
            const borderBottom = row < 3 ? "1px solid rgba(244,218,213,0.06)" : "none";
            return (
              <div
                key={f.name}
                style={{
                  padding: "2vh 2vw",
                  borderRight,
                  borderBottom,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "0.6vh" }}>
                  {f.icon === null ? (
                    <img
                      src="/resonancia-plantilla/cubo-4.png"
                      alt="Geometrix"
                      style={{ width: "1.5vw", height: "1.5vw", objectFit: "contain", flexShrink: 0 }}
                    />
                  ) : (
                    <GoldIcon paths={f.icon} />
                  )}
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5vw" }}>
                    <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4DAD5" }}>{f.name}</div>
                    <div style={{ fontSize: "1.05vw", fontWeight: 400, color: "#D4AF37", opacity: 0.65 }}>{f.tag}</div>
                  </div>
                </div>
                <div style={{ fontSize: "1.1vw", fontWeight: 400, lineHeight: 1.55, color: "rgba(244,218,213,0.45)", paddingLeft: "3.4vw" }}>
                  {f.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
