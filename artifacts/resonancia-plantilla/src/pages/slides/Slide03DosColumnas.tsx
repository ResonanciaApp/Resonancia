export default function Slide03DosColumnas() {
  const diferenciadores = [
    "100% en español neutro — voz, contenido e identidad latinas desde el origen",
    "Contenido ancestral especializado: cuencos, sonidos binaurales, meditaciones guiadas originales",
    "Productores de música electrónica profesionales detrás de cada pieza de audio",
    "UI minimalista y orgánica — diseñada para calmar, no para retener",
    "Precio hasta 5× más accesible que Calm o Headspace",
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          02 · LA SOLUCIÓN
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "68vw" }}>
          RESONANCIA — un refugio de{" "}
          <span style={{ color: "#BE9650" }}>sonido y presencia.</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "3vw", alignItems: "flex-start" }}>
        {/* Bullets */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
          {diferenciadores.map((text, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1.4vw" }}>
              <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "9999px", backgroundColor: "#BE9650", marginTop: "0.9vh", flexShrink: 0 }} />
              <div style={{ fontSize: "1.75vw", fontWeight: 400, color: "#EDE1D3", lineHeight: 1.45 }}>{text}</div>
            </div>
          ))}
        </div>

        {/* Visual card */}
        <div style={{ width: "30vw", backgroundColor: "#090E17", borderRadius: "1.2vw", padding: "4vh 2.8vw", boxSizing: "border-box", border: "1px solid rgba(190,150,80,0.2)" }}>
          <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "#BE9650", letterSpacing: "0.12em", marginBottom: "2.5vh" }}>CATEGORÍAS</div>
          {[
            "🔔  Sonidos Ancestrales",
            "🎵  Música y Ambiente",
            "🧘  Meditaciones Guiadas",
            "🎙  ASMR · Historias · Podcast",
            "🌿  Sonidos Naturaleza",
          ].map((cat) => (
            <div key={cat} style={{ fontSize: "1.55vw", color: "#7A8FA8", paddingTop: "1.2vh", paddingBottom: "1.2vh", borderBottom: "1px solid rgba(255,255,255,0.05)", lineHeight: 1.3 }}>
              {cat}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "5vh", right: "6vw", fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.08em" }}>
        RESONANCIA
      </div>
    </div>
  );
}
