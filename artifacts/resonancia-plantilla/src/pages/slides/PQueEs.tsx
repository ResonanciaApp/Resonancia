export default function PQueEs() {
  const phoneStyle = (rotate: string, origin: string): React.CSSProperties => ({
    height: "70vh",
    width: "auto",
    aspectRatio: "9 / 19.5",
    borderRadius: "2.2vw",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
    transform: `rotate(${rotate})`,
    transformOrigin: origin,
    flexShrink: 0,
  });

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(212,175,55,0.06) 0%, transparent 60%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", zIndex: 2 }}>

        {/* Left phone */}
        <div style={{ flex: "0 0 22vw", display: "flex", justifyContent: "flex-end", alignItems: "center", paddingRight: "1vw", overflow: "hidden", height: "100%" }}>
          <div style={{ ...phoneStyle("-10deg", "right center"), backgroundColor: "#0D020A" }} />
        </div>

        {/* Center content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 2vw" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", background: "linear-gradient(90deg, #D6AD5F, #B47344)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "1.5vh" }}>
            ¿QUÉ ES?
          </div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "4.5vh" }} />

          <div style={{ fontSize: "3.8vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "3.5vh" }}>
            Una app diseñada<br />para el bienestar,<br /><span style={{ display: "inline-block", background: "linear-gradient(90deg, #D6AD5F, #B47344)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>y la expansión.</span>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, lineHeight: 1.8, color: "rgba(244,218,213,0.6)", maxWidth: "32vw" }}>
            Resonancia es un santuario digital donde convergen sonidos ancestrales, música consciente, meditaciones y experiencias diseñadas para expandir la consciencia y cultivar la presencia.
          </div>
        </div>

        {/* Right phone */}
        <div style={{ flex: "0 0 22vw", display: "flex", justifyContent: "flex-start", alignItems: "center", paddingLeft: "1vw", overflow: "hidden", height: "100%" }}>
          <div style={{ ...phoneStyle("10deg", "left center"), backgroundColor: "#0D020A" }} />
        </div>

      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "3.5vh", right: "7vw", fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)", zIndex: 2 }}>
        02 / 10
      </div>
    </div>
  );
}
