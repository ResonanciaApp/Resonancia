const PhoneMock = ({
  label,
  accentColor = "#D4AF37",
  sublabel,
}: {
  label: string;
  accentColor?: string;
  sublabel?: string;
}) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      borderRadius: "1.5vw",
      backgroundColor: "#0B0108",
      border: `1px solid ${accentColor}28`,
      boxShadow: `0 8px 36px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.35)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}
  >
    {/* top notch */}
    <div
      style={{
        position: "absolute",
        top: "4%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "22%",
        height: "3.5%",
        borderRadius: "4px",
        backgroundColor: "#1A0210",
      }}
    />
    {/* subtle radial glow */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, ${accentColor}0A 0%, transparent 65%)`,
        pointerEvents: "none",
      }}
    />
    {/* label */}
    <div
      style={{
        fontSize: "1.0vw",
        fontWeight: 600,
        color: `${accentColor}99`,
        letterSpacing: "0.12em",
        textAlign: "center",
        padding: "0 8%",
        lineHeight: 1.4,
        zIndex: 1,
      }}
    >
      {label}
    </div>
    {sublabel && (
      <div
        style={{
          marginTop: "0.5vh",
          fontSize: "0.75vw",
          fontWeight: 400,
          color: "rgba(244,218,213,0.28)",
          textAlign: "center",
          padding: "0 10%",
          zIndex: 1,
        }}
      >
        {sublabel}
      </div>
    )}
    {/* bottom home bar */}
    <div
      style={{
        position: "absolute",
        bottom: "3.5%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "28%",
        height: "2%",
        borderRadius: "4px",
        backgroundColor: "rgba(255,255,255,0.09)",
      }}
    />
  </div>
);

const pages = [
  {
    label: "BIBLIOTECA",
    caption: "Sesiones por categoría, estado de ánimo y duración.",
    color: "#A78BCA",
  },
  {
    label: "INICIO",
    caption: "Racha, frases del día y accesos rápidos personalizados.",
    color: "#7BB8C4",
  },
  {
    label: "EXPLORAR",
    caption: "Descubre sesiones nuevas, artistas y tendencias.",
    color: "#C4916B",
  },
];

const players = [
  { label: "REPRODUCTOR", color: "#D4AF37" },
  { label: "MIXER SHEET", color: "#A78BCA" },
  { label: "DETALLE DE SESIÓN", color: "#7BB8C4" },
];

export default function PPantallas() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 55%)" }} />

      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "4vh 6vw 3.5vh",
          zIndex: 2,
        }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: "2.5vh", flexShrink: 0 }}>
          <div style={{ fontSize: "1.05vw", fontWeight: 600, letterSpacing: "0.22em", color: "#D4AF37", marginBottom: "0.8vh" }}>
            LA EXPERIENCIA
          </div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "1.2vh" }} />
          <div style={{ fontSize: "3.2vw", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#F4DAD5" }}>
            Las pantallas principales.
          </div>
          <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "rgba(244,218,213,0.45)", marginTop: "0.7vh" }}>
            Acá es donde el contenido vive.
          </div>
        </div>

        {/* ── Section 1: Páginas del Menú ── */}
        <div style={{ flex: "0 0 auto", marginBottom: "2vh" }}>
          <div style={{ fontSize: "1.0vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(244,218,213,0.4)", marginBottom: "1.5vh", textTransform: "uppercase" }}>
            Páginas del Menú
          </div>
          <div style={{ display: "flex", gap: "1.8vw" }}>
            {pages.map((p) => (
              <div key={p.label} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ height: "25vh", flexShrink: 0 }}>
                  <PhoneMock label={p.label} accentColor={p.color} />
                </div>
                <div
                  style={{
                    marginTop: "1.2vh",
                    fontSize: "0.9vw",
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: "rgba(244,218,213,0.45)",
                    textAlign: "center",
                  }}
                >
                  {p.caption}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ width: "100%", height: "1px", backgroundColor: "rgba(244,218,213,0.07)", marginBottom: "2vh", flexShrink: 0 }} />

        {/* ── Section 2: Reproductores ── */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.0vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(244,218,213,0.4)", marginBottom: "1.5vh", textTransform: "uppercase", flexShrink: 0 }}>
            Reproductores
          </div>
          <div style={{ display: "flex", gap: "2.5vw", flex: 1, minHeight: 0 }}>
            {/* 3 phones */}
            <div style={{ flex: 3, display: "flex", gap: "2vw" }}>
              {players.map((p) => (
                <div key={p.label} style={{ flex: 1 }}>
                  <PhoneMock label={p.label} accentColor={p.color} />
                </div>
              ))}
            </div>
            {/* shared caption */}
            <div
              style={{
                flex: 1.2,
                display: "flex",
                alignItems: "center",
                paddingLeft: "1vw",
                borderLeft: "1px solid rgba(244,218,213,0.07)",
              }}
            >
              <div
                style={{
                  fontSize: "1.05vw",
                  fontWeight: 400,
                  lineHeight: 1.7,
                  color: "rgba(244,218,213,0.45)",
                }}
              >
                Reproducción inteligente con timer, loops y control de volumen por capa.
                El mixersheet combina sonidos en tiempo real.
                El detalle de sesión muestra descripción, guía y acciones — todo desde una sola pantalla.
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2vh", flexShrink: 0 }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>06 / 11</div>
        </div>
      </div>
    </div>
  );
}
