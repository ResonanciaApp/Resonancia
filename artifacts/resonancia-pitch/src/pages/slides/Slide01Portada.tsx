const base = import.meta.env.BASE_URL;

export default function Slide01Portada() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "54vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box" }}
      >
        {/* Brand mark */}
        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
        </div>

        {/* Hero title */}
        <div>
          <div style={{ fontSize: "2vw", fontWeight: 500, color: "#7a6050", letterSpacing: "0.12em", marginBottom: "2vh" }}>
            PRESENTACIÓN PARA INVERSIONISTAS
          </div>
          <div style={{ fontSize: "6vw", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#EDE1D3" }}>
            Tu refugio
          </div>
          <div style={{ fontSize: "6vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#C69B4F", marginBottom: "4vh" }}>
            de sonido y presencia.
          </div>
          <div style={{ fontSize: "1.9vw", fontWeight: 400, color: "#7a6050", maxWidth: "40vw", lineHeight: 1.6 }}>
            La plataforma de meditación y sueño pensada para el mundo hispanohablante.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "#5a4632", letterSpacing: "0.08em" }}>
            CASA DEL CUENCO · 2026
          </div>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "#5a4632" }}>
            iOS · Android
          </div>
        </div>
      </div>

      {/* Right column — iPhone mockups */}
      <div style={{ width: "46vw", height: "100vh", position: "relative", backgroundColor: "#18110C" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 55% 48%, rgba(198,155,79,0.06) 0%, rgba(24,17,12,0) 65%)" }} />

        {/* Back phone — Sonidos Ancestrales */}
        <div style={{
          position: "absolute",
          right: "2vw",
          top: "50%",
          transform: "translateY(-44%)",
          width: "11vw",
          height: "23.9vw",
          backgroundColor: "#2C2C2E",
          borderRadius: "2.1vw",
          padding: "0.4vw",
          boxShadow: "0 1vw 3vw rgba(0,0,0,0.7)",
          zIndex: 1,
          opacity: 0.65
        }}>
          <div style={{ position: "absolute", top: "1.1vw", left: "50%", transform: "translateX(-50%)", width: "2.8vw", height: "0.6vw", backgroundColor: "#000", borderRadius: "0.4vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "1.76vw", overflow: "hidden", backgroundColor: "#18110C" }}>
            <img src={`${base}mockup-sonidos.jpg`} crossOrigin="anonymous" alt="Sonidos Ancestrales" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>

        {/* Front phone — Home */}
        <div style={{
          position: "absolute",
          right: "13vw",
          top: "50%",
          transform: "translateY(-54%)",
          width: "13vw",
          height: "28.2vw",
          backgroundColor: "#1C1C1E",
          borderRadius: "2.4vw",
          padding: "0.46vw",
          boxShadow: "0 1.5vw 6vw rgba(0,0,0,0.92), 0 0 0 0.12vw rgba(255,255,255,0.07)",
          zIndex: 2
        }}>
          <div style={{ position: "absolute", top: "1.25vw", left: "50%", transform: "translateX(-50%)", width: "3.2vw", height: "0.72vw", backgroundColor: "#000", borderRadius: "0.48vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "2.0vw", overflow: "hidden", backgroundColor: "#18110C" }}>
            <img src={`${base}mockup-home.jpg`} crossOrigin="anonymous" alt="Inicio" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>

        {/* Blend gradient on left edge */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "18%", height: "100%", background: "linear-gradient(90deg, #18110C 0%, rgba(24,17,12,0) 100%)", zIndex: 3 }} />
      </div>
    </div>
  );
}
