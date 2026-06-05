const base = import.meta.env.BASE_URL;

export default function Slide01Invitacion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}
    >
      {/* Left column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "52vw", height: "100vh", padding: "8vh 5.5vw", boxSizing: "border-box" }}
      >
        {/* Brand mark */}
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.04em", color: "#BE9650", marginBottom: "1vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#BE9650" }} />
        </div>

        {/* Hero title */}
        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.12em", marginBottom: "2.5vh" }}>
            UNA INVITACIÓN A CONVERSAR
          </div>
          <div style={{ fontSize: "7vw", fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.04em", color: "#BE9650", marginBottom: "3.5vh" }}>
            Conversemos.
          </div>
          <div style={{ fontSize: "1.8vw", fontWeight: 400, color: "#7A8FA8", maxWidth: "40vw", lineHeight: 1.6 }}>
            Quiero mostrarte RESONANCIA: una app de meditación y sueño en español que ya está construida y funcionando. No es una propuesta cerrada, es el comienzo de una conversación.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1.3vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.08em" }}>
            CASA DEL CUENCO · 2026
          </div>
          <div style={{ fontSize: "1.3vw", fontWeight: 500, color: "#7A8FA8" }}>
            iOS · Android
          </div>
        </div>
      </div>

      {/* Right column — iPhone mockups */}
      <div style={{ width: "48vw", height: "100vh", position: "relative", backgroundColor: "#060A0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 55% 50%, rgba(190,150,80,0.08) 0%, rgba(6,10,15,0) 65%)" }} />

        <div style={{ position: "relative", width: "34vw", height: "38vw", zIndex: 1 }}>
          {/* Back phone */}
          <div style={{
            position: "absolute", right: "1vw", top: "10%", width: "14vw", height: "30.4vw",
            backgroundColor: "#2C2C2E", borderRadius: "2.5vw", padding: "0.46vw",
            boxShadow: "0 1vw 3.5vw rgba(0,0,0,0.75)", zIndex: 1, opacity: 0.6
          }}>
            <div style={{ position: "absolute", top: "1.2vw", left: "50%", transform: "translateX(-50%)", width: "3.3vw", height: "0.72vw", backgroundColor: "#000", borderRadius: "0.48vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2.1vw", overflow: "hidden", backgroundColor: "#060A0F" }}>
              <img src={`${base}mockup-sonidos.jpg`} crossOrigin="anonymous" alt="Sonidos" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>

          {/* Front phone */}
          <div style={{
            position: "absolute", left: "1vw", top: 0, width: "17vw", height: "36.9vw",
            backgroundColor: "#1C1C1E", borderRadius: "3vw", padding: "0.55vw",
            boxShadow: "0 2vw 8vw rgba(0,0,0,0.95), 0 0 0 0.12vw rgba(255,255,255,0.07)", zIndex: 2
          }}>
            <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4vw", height: "0.85vw", backgroundColor: "#000", borderRadius: "0.58vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2.55vw", overflow: "hidden", backgroundColor: "#060A0F" }}>
              <img src={`${base}mockup-home.jpg`} crossOrigin="anonymous" alt="Inicio" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", top: 0, left: 0, width: "12%", height: "100%", background: "linear-gradient(90deg, #060A0F 0%, rgba(6,10,15,0) 100%)", zIndex: 3 }} />
      </div>
    </div>
  );
}
