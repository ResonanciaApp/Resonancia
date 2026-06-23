const bullets = [
  {
    icon: "🧘",
    title: "Quienes buscan calmar la mente",
    desc: "Meditadores, personas con estrés, ansiedad o insomnio.",
  },
  {
    icon: "✦",
    title: "Quienes exploran su espiritualidad",
    desc: "Sin dogma, con intención propia y conexión interior.",
  },
  {
    icon: "🌎",
    title: "Hispanohablantes que merecen más",
    desc: "No una app traducida — una experiencia diseñada desde adentro.",
  },
];

export default function PQueEs() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
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
            <div style={{ fontSize: "5vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "3.5vh", maxWidth: "46vw" }}>
              Una app diseñada<br />para el bienestar,<br /><span style={{ color: "#D4AF37" }}>y la expansión.</span>
            </div>

            {/* Body */}
            <div style={{ fontSize: "1.35vw", fontWeight: 400, lineHeight: 1.8, color: "rgba(244,218,213,0.6)", maxWidth: "42vw" }}>
              Resonancia es un santuario digital donde convergen sonidos ancestrales, música consciente, meditaciones y experiencias diseñadas para expandir la consciencia, cultivar la presencia y transformar la manera en que nos relacionamos con nosotros mismos.
            </div>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>02 / 10</div>
        </div>

        {/* Vertical rule */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.12)", margin: "8vh 0" }} />

        {/* Right column — Diseñada para */}
        <div style={{ flex: 1, padding: "8vh 6vw 8vh 4vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", color: "#D4AF37", marginBottom: "1.5vh" }}>
            DISEÑADA PARA
          </div>
          <div style={{ width: "3vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "4vh" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "3vh" }}>
            {bullets.map((b) => (
              <div key={b.title} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ fontSize: "2.8vw", marginBottom: "1vh", lineHeight: 1 }}>{b.icon}</div>
                <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#F4DAD5", marginBottom: "0.4vh", lineHeight: 1.25 }}>{b.title}</div>
                <div style={{ fontSize: "1.0vw", fontWeight: 400, lineHeight: 1.55, color: "rgba(244,218,213,0.5)", maxWidth: "26vw" }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
