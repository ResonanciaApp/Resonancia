const DIFS = [
  "100% en español neutro — voz, contenido e identidad latinas desde el origen",
  "Contenido ancestral especializado: cuencos, sonidos binaurales, meditaciones guiadas originales",
  "Productores de música electrónica profesionales detrás de cada pieza",
  "UI minimalista y orgánica — diseñada para calmar, no para retener",
  "Precio hasta 5× más accesible que Calm o Headspace",
];

const CATS = [
  "🔔  Sonidos Ancestrales",
  "🎵  Música y Ambiente",
  "🧘  Meditaciones Guiadas",
  "🎙  ASMR · Historias · Podcast",
  "🌿  Sonidos Naturaleza",
];

export default function Slide03DosColumnas() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "8vh 6vw", boxSizing: "border-box" }}
    >
      {/* Eyebrow */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "1.8vh" }}>
        <div style={{ width: "2.5vw", height: "2px", backgroundColor: "#BE9650" }} />
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "#BE9650", letterSpacing: "0.18em" }}>LA SOLUCIÓN</div>
      </div>

      {/* Headline */}
      <div style={{ fontSize: "4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.06, marginBottom: "4.5vh", maxWidth: "70vw" }}>
        RESONANCIA — un refugio de{" "}
        <span style={{ color: "#BE9650" }}>sonido y presencia.</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", gap: "3.5vw", alignItems: "stretch" }}>
        {/* Bullets */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0" }}>
          {DIFS.map((text, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1.4vw",
                padding: "1.6vh 0",
                borderBottom: i < DIFS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}
            >
              <div style={{ width: "6px", height: "6px", borderRadius: "9999px", backgroundColor: "#BE9650", marginTop: "0.85vh", flexShrink: 0 }} />
              <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "#EDE1D3", lineHeight: 1.5 }}>{text}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(190,150,80,0.18)", flexShrink: 0 }} />

        {/* Categories card */}
        <div style={{ width: "26vw", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.18em", marginBottom: "2.5vh" }}>CATEGORÍAS</div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {CATS.map((cat, i) => (
              <div
                key={cat}
                style={{
                  fontSize: "1.55vw",
                  color: "#EDE1D3",
                  padding: "1.4vh 1.8vw",
                  borderRadius: "0.6vw",
                  backgroundColor: i % 2 === 0 ? "rgba(190,150,80,0.06)" : "transparent",
                  lineHeight: 1.3,
                }}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "5vh", right: "6vw", fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.1em" }}>RESONANCIA</div>
    </div>
  );
}
