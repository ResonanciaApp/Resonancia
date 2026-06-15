const base = import.meta.env.BASE_URL;

export default function Slide01Portada() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}
    >
      {/* Left column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "50vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box" }}
      >
        {/* Brand mark */}
        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, letterSpacing: "-0.05em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "1vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#D4AF37" }} />
        </div>

        {/* Hero title */}
        <div>
          <div style={{ fontSize: "1.8vw", fontWeight: 500, color: "rgba(242,231,228,0.50)", letterSpacing: "0.12em", marginBottom: "2vh" }}>
            PRESENTACIÓN PARA INVERSIONISTAS
          </div>
          <div style={{ fontSize: "6vw", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#F4DAD5" }}>
            Tu refugio
          </div>
          <div style={{ fontSize: "6vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.04em", background: "linear-gradient(90deg, #FF6B3D, #FF9E4D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "4vh" }}>
            de sonido y presencia.
          </div>
          <div style={{ fontSize: "1.8vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", maxWidth: "38vw", lineHeight: 1.6 }}>
            La plataforma de meditación y sueño pensada para el mundo hispanohablante.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "rgba(242,231,228,0.50)", letterSpacing: "0.08em" }}>
            CASA DEL CUENCO · 2026
          </div>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "rgba(242,231,228,0.50)" }}>
            iOS · Android
          </div>
        </div>
      </div>

      {/* Right column — iPhone mockups, centered and larger */}
      <div style={{ width: "50vw", height: "100vh", position: "relative", backgroundColor: "#1B060F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.07) 0%, rgba(27,6,15,0) 65%)" }} />

        {/* Phone group — relative container so phones align relative to each other */}
        <div style={{ position: "relative", width: "36vw", height: "38vw", zIndex: 1 }}>

          {/* Back phone — Sonidos Ancestrales, offset top-right */}
          <div style={{
            position: "absolute",
            right: 0,
            top: "10%",
            width: "14vw",
            height: "30.4vw",
            backgroundColor: "#2C2C2E",
            borderRadius: "2.5vw",
            padding: "0.46vw",
            boxShadow: "0 1vw 3.5vw rgba(0,0,0,0.75)",
            zIndex: 1,
            opacity: 0.6
          }}>
            <div style={{ position: "absolute", top: "1.2vw", left: "50%", transform: "translateX(-50%)", width: "3.3vw", height: "0.72vw", backgroundColor: "#000", borderRadius: "0.48vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2.1vw", overflow: "hidden", backgroundColor: "#1B060F" }}>
              <img src={`${base}mockup-sonidos.jpg`} crossOrigin="anonymous" alt="Sonidos Ancestrales" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>

          {/* Front phone — Inicio, larger and to the left */}
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "17vw",
            height: "36.9vw",
            backgroundColor: "#1C1C1E",
            borderRadius: "3vw",
            padding: "0.55vw",
            boxShadow: "0 2vw 8vw rgba(0,0,0,0.95), 0 0 0 0.12vw rgba(255,255,255,0.07)",
            zIndex: 2
          }}>
            <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4vw", height: "0.85vw", backgroundColor: "#000", borderRadius: "0.58vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2.55vw", overflow: "hidden", backgroundColor: "#1B060F" }}>
              <img src={`${base}mockup-home.jpg`} crossOrigin="anonymous" alt="Inicio" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>

        </div>

        {/* Blend gradient on left edge */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "12%", height: "100%", background: "linear-gradient(90deg, #1B060F 0%, rgba(27,6,15,0) 100%)", zIndex: 3 }} />
      </div>
    </div>
  );
}
