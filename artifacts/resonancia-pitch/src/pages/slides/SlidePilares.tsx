const GOLD = "#BE9650";

function IconEscucha() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="4" height="6" rx="1.5" />
      <rect x="17" y="14" width="4" height="6" rx="1.5" />
    </svg>
  );
}

function IconCrea() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
      <line x1="5" y1="4" x2="5" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
      <line x1="19" y1="4" x2="19" y2="20" />
      <circle cx="5" cy="9" r="2" fill="#211538" />
      <circle cx="12" cy="15" r="2" fill="#211538" />
      <circle cx="19" cy="7" r="2" fill="#211538" />
    </svg>
  );
}

function IconConecta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.8-3 3-4.5 5.5-4.5S13.7 16 14.5 19" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15.5 14.6c2.4-.3 4.4 1 5 3.9" />
    </svg>
  );
}

export default function SlidePilares() {
  const pilares = [
    {
      titulo: "Escucha",
      icon: <IconEscucha />,
      texto: "Catálogo curado de sesiones de sonoterapia, meditación y descanso, producido en estudio propio.",
    },
    {
      titulo: "Crea",
      icon: <IconCrea />,
      texto: "Mezclador de sonidos y Geometrix, nuestra experiencia interactiva de geometría sagrada, para armar tu propio espacio de calma.",
    },
    {
      titulo: "Conecta",
      icon: <IconConecta />,
      texto: "Sesiones en vivo con guiadores y una comunidad hispanohablante en torno al bienestar.",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{
        background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)",
        color: "#F4F4F4",
        padding: "8vh 8vw",
        boxSizing: "border-box",
        justifyContent: "center",
        gap: "6vh",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.8vh" }}>
          ¿QUÉ ES? · LOS TRES PILARES
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Una sola app, <span style={{ color: GOLD }}>tres formas de habitarla.</span>
        </div>
      </div>

      {/* Tres pilares */}
      <div style={{ display: "flex", gap: "2vw" }}>
        {pilares.map((p) => (
          <div
            key={p.titulo}
            style={{
              flex: 1,
              backgroundColor: "rgba(190,150,80,0.05)",
              border: "1px solid rgba(190,150,80,0.28)",
              borderRadius: "1vw",
              padding: "4vh 2vw",
              display: "flex",
              flexDirection: "column",
              gap: "2vh",
            }}
          >
            <div
              style={{
                width: "3.6vw",
                height: "3.6vw",
                borderRadius: "0.9vw",
                backgroundColor: "rgba(190,150,80,0.12)",
                border: "1px solid rgba(190,150,80,0.35)",
                padding: "0.8vw",
                boxSizing: "border-box",
              }}
            >
              {p.icon}
            </div>
            <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#FFFFFF" }}>{p.titulo}</div>
            <div style={{ fontSize: "1.15vw", color: "rgba(244,244,244,0.65)", lineHeight: 1.55 }}>{p.texto}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
