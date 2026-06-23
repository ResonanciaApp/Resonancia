const GoldIcon = ({ paths }: { paths: string[] }) => (
  <svg
    viewBox="0 0 24 24"
    width="2.2vw"
    height="2.2vw"
    fill="none"
    stroke="url(#goldGradVS)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, minWidth: "2.2vw", filter: "drop-shadow(0 0 5px rgba(212,175,55,0.75)) drop-shadow(0 0 2px rgba(233,196,106,0.5))" }}
  >
    <defs>
      <linearGradient id="goldGradVS" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#E9C46A" />
      </linearGradient>
    </defs>
    {paths.map((d, i) => <path key={i} d={d} />)}
  </svg>
);

export default function PVideoStreaming() {
  const pillars = [
    {
      name: "Video bajo demanda",
      tag: "contenido premium",
      desc: "Sesiones filmadas con maestros del sonido y la meditación. Calidad cinematográfica, disponible sin conexión.",
      icon: [
        "M15 10l4.553-2.069A1 1 0 0 1 21 8.87V15.13a1 1 0 0 1-1.447.9L15 14",
        "M3 8h12a0 0 0 0 1 0 0v8a0 0 0 0 1 0 0H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z",
      ],
    },
    {
      name: "Sesiones en vivo",
      tag: "tiempo real",
      desc: "Conexión directa con guías certificados. Preguntas en vivo, valoración y seguimiento post-sesión.",
      icon: [
        "M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14",
        "M12 12h.01",
      ],
    },
    {
      name: "Cursos online",
      tag: "certificación",
      desc: "Programas estructurados de bienestar ancestral. Avance progresivo, certificación y comunidad de práctica.",
      icon: [
        "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",
        "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z",
      ],
    },
    {
      name: "Exclusivo para resonadores",
      tag: "comunidad",
      desc: "Acceso anticipado, precios especiales y masterclasses privadas solo para los miembros de la comunidad.",
      icon: [
        "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
        "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
        "M23 21v-2a4 4 0 0 0-3-3.87",
        "M16 3.13a4 4 0 0 1 0 7.75",
      ],
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 75% 30%, rgba(212,175,55,0.04) 0%, transparent 55%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left */}
        <div style={{ width: "30vw", padding: "8vh 3vw 8vh 7vw", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", color: "#D4AF37", marginBottom: "1.5vh" }}>
              VIDEO Y STREAMING
            </div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "4vh" }} />
            <div style={{ fontSize: "3.8vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", color: "#F4DAD5", marginBottom: "2.5vh" }}>
              El audio fue<br />el comienzo.
            </div>
            <div style={{ fontSize: "3.8vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "4vh" }}>
              Ahora viene todo.
            </div>
            <div style={{ fontSize: "1.25vw", fontWeight: 400, lineHeight: 1.7, color: "rgba(244,218,213,0.5)", maxWidth: "22vw" }}>
              Video, cursos y sesiones en vivo para los resonadores que quieren ir más lejos.
            </div>
          </div>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>08 / 11</div>
        </div>

        {/* Vertical rule */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.1)", margin: "7vh 0" }} />

        {/* Right — 2×2 pillars */}
        <div style={{ flex: 1, padding: "7vh 7vw 7vh 3vw", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "0" }}>
          {pillars.map((p, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const borderRight = col === 0 ? "1px solid rgba(244,218,213,0.06)" : "none";
            const borderBottom = row === 0 ? "1px solid rgba(244,218,213,0.06)" : "none";
            return (
              <div
                key={p.name}
                style={{
                  padding: "2.5vh 2vw",
                  borderRight,
                  borderBottom,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "0.6vh" }}>
                  <GoldIcon paths={p.icon} />
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5vw" }}>
                    <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4DAD5" }}>{p.name}</div>
                    <div style={{ fontSize: "1.05vw", fontWeight: 400, color: "#D4AF37", opacity: 0.65 }}>{p.tag}</div>
                  </div>
                </div>
                <div style={{ fontSize: "1.1vw", fontWeight: 400, lineHeight: 1.55, color: "rgba(244,218,213,0.45)", paddingLeft: "3.0vw" }}>
                  {p.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
