import { GOLD_GRADIENT } from "@/utils/goldText";
export default function PQueEs() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 38% 45%, rgba(212,175,55,0.06) 0%, transparent 60%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "row", alignItems: "center", zIndex: 2 }}>

        {/* Content — left */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", padding: "8vh 4vw 8vh 14vw", textAlign: "left" }}>

          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", ...GOLD_GRADIENT, marginBottom: "1.5vh" }}>
            ¿QUÉ ES?
          </div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45, marginBottom: "4.5vh" }} />

          <div style={{ fontSize: "3.8vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "3.5vh" }}>
            Una app diseñada<br />para el bienestar,<br /><span style={GOLD_GRADIENT}>y la expansión.</span>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, lineHeight: 1.8, color: "rgba(244,218,213,0.6)", maxWidth: "28vw" }}>
            Resonancia es un santuario digital donde convergen sonidos ancestrales, música consciente, meditaciones y experiencias diseñadas para expandir la consciencia y cultivar la presencia.
          </div>
        </div>

        {/* Phone mockups — right */}
        <div style={{ width: "40vw", display: "flex", alignItems: "center", justifyContent: "center", gap: "1vw", height: "100%", flexShrink: 0, transform: "translateX(-20px)" }}>
          <img
            src="/resonancia-plantilla/screenshots/phone-player.png"
            alt=""
            style={{ height: "72%", width: "auto", objectFit: "contain", opacity: 0.5 }}
          />
          <img
            src="/resonancia-plantilla/screenshots/phone-mockup.png"
            alt=""
            style={{ height: "90%", width: "auto", objectFit: "contain", opacity: 0.6 }}
          />
        </div>

      </div>

      <div style={{ position: "absolute", bottom: "3.5vh", right: "7vw", fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)", zIndex: 2 }}>
        02 / 10
      </div>
    </div>
  );
}
