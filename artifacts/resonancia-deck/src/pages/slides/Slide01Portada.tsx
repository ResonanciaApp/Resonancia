const base = import.meta.env.BASE_URL;

export default function Slide01Portada() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}
    >
      {/* Left column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "52vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box" }}
      >
        {/* Brand mark */}
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#BE9650", marginBottom: "1vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#BE9650" }} />
        </div>

        {/* Hero title */}
        <div>
          <div style={{ fontSize: "6.8vw", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#EDE1D3", marginBottom: "0.5vh" }}>
            Tu refugio
          </div>
          <div style={{ fontSize: "6.8vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#BE9650", marginBottom: "4vh" }}>
            de sonido.
          </div>
          <div style={{ fontSize: "1.8vw", fontWeight: 400, color: "#7A8FA8", maxWidth: "38vw", lineHeight: 1.65, marginBottom: "0.2vh" }}>
            Un espacio de silencio y presencia,
          </div>
          <div style={{ fontSize: "1.8vw", fontWeight: 400, color: "#7A8FA8", maxWidth: "38vw", lineHeight: 1.65 }}>
            disponible cuando más lo necesitás.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.08em" }}>
            CASA DEL CUENCO · 2026
          </div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#7A8FA8" }}>
            iOS · Android
          </div>
        </div>
      </div>

      {/* Right column — iPhone mockups */}
      <div style={{ width: "48vw", height: "100vh", position: "relative", backgroundColor: "#060A0F" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 55% 48%, rgba(190, 150, 80,0.06) 0%, rgba(6, 10, 15,0) 65%)" }} />

        {/* Back phone — Biblioteca */}
        <div style={{
          position: "absolute",
          right: "3vw",
          top: "50%",
          transform: "translateY(-44%)",
          width: "14vw",
          height: "30.4vw",
          backgroundColor: "#2C2C2E",
          borderRadius: "2.6vw",
          padding: "0.46vw",
          boxShadow: "0 1vw 3vw rgba(0,0,0,0.7)",
          zIndex: 1,
          opacity: 0.65
        }}>
          <div style={{ position: "absolute", top: "1.2vw", left: "50%", transform: "translateX(-50%)", width: "3.2vw", height: "0.68vw", backgroundColor: "#000", borderRadius: "0.44vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "2.2vw", overflow: "hidden", backgroundColor: "#060A0F" }}>
            <img src={`${base}mockup-biblioteca.jpg`} crossOrigin="anonymous" alt="Biblioteca" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>

        {/* Front phone — Home */}
        <div style={{
          position: "absolute",
          right: "18vw",
          top: "50%",
          transform: "translateY(-54%)",
          width: "16vw",
          height: "34.7vw",
          backgroundColor: "#1C1C1E",
          borderRadius: "2.9vw",
          padding: "0.52vw",
          boxShadow: "0 2vw 8vw rgba(0,0,0,0.92), 0 0 0 0.14vw rgba(255,255,255,0.07)",
          zIndex: 2
        }}>
          <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "3.8vw", height: "0.82vw", backgroundColor: "#000", borderRadius: "0.55vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "2.45vw", overflow: "hidden", backgroundColor: "#060A0F" }}>
            <img src={`${base}mockup-home.jpg`} crossOrigin="anonymous" alt="Inicio" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>

        {/* Blend gradient on left edge */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "18%", height: "100%", background: "linear-gradient(90deg, #060A0F 0%, rgba(6, 10, 15,0) 100%)", zIndex: 3 }} />
      </div>
    </div>
  );
}
