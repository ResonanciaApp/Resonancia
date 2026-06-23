export default function PFuncionalidades() {
  const features = [
    {
      name: "Biblioteca",
      tag: "tipo Spotify",
      desc: "Sesiones organizadas por categoría, estado de ánimo y duración. Recientes, favoritos, playlists propias.",
    },
    {
      name: "Mezclador",
      tag: "de sonidos",
      desc: "Capas de sonido ambiente combinables en tiempo real. Presets guardables y mezclador personal.",
    },
    {
      name: "Reproductores",
      tag: "inteligentes",
      desc: "Timer, loops, control de volumen por capa, lock-screen y reproducción en segundo plano.",
    },
    {
      name: "Geometrix",
      tag: "meditación activa",
      desc: "Geometría sagrada interactiva como herramienta de enfoque y meditación visual. Único en su categoría.",
    },
    {
      name: "Video y Streaming",
      tag: "contenido audiovisual",
      desc: "Sesiones en video bajo demanda + sesiones en vivo con guías certificados en tiempo real.",
    },
    {
      name: "Ecosistema social",
      tag: "perfiles y comunidad",
      desc: "Resonadores, mezclas compartidas, perfil personalizable y conexión con la comunidad.",
    },
    {
      name: "Sesiones en Vivo",
      tag: "guías certificados",
      desc: "Streaming directo con maestros del sonido y meditación. Valoración y seguimiento post-sesión.",
    },
    {
      name: "Diario personal",
      tag: "práctica y progreso",
      desc: "Registro de reflexiones, racha de escucha diaria y seguimiento de hábitos de bienestar.",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.05) 0%, transparent 50%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left — header + big number */}
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
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>04 / 11</div>
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
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.6vw", marginBottom: "0.6vh" }}>
                  <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4DAD5" }}>{f.name}</div>
                  <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "#D4AF37", opacity: 0.7 }}>{f.tag}</div>
                </div>
                <div style={{ fontSize: "1.1vw", fontWeight: 400, lineHeight: 1.55, color: "rgba(244,218,213,0.45)" }}>
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
