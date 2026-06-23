export default function PQueEs() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(212,175,55,0.06) 0%, transparent 60%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8vh 14vw", zIndex: 2, textAlign: "center" }}>

        {/* Eyebrow */}
        <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", background: "linear-gradient(90deg, #D6AD5F, #B47344)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "1.5vh" }}>
          ¿QUÉ ES?
        </div>
        <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "4.5vh" }} />

        {/* Headline */}
        <div style={{ fontSize: "5vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "3.5vh" }}>
          Una app diseñada<br />para el bienestar,<br /><span style={{ background: "linear-gradient(90deg, #D6AD5F, #B47344)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>y la expansión.</span>
        </div>

        {/* Body */}
        <div style={{ fontSize: "1.35vw", fontWeight: 400, lineHeight: 1.8, color: "rgba(244,218,213,0.6)", maxWidth: "58vw" }}>
          Resonancia es un santuario digital donde convergen sonidos ancestrales, música consciente, meditaciones y experiencias diseñadas para expandir la consciencia, cultivar la presencia y transformar la manera en que nos relacionamos con nosotros mismos.
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "3.5vh", right: "7vw", fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)", zIndex: 2 }}>
        02 / 10
      </div>
    </div>
  );
}
