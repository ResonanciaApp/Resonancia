const base = import.meta.env.BASE_URL;

export default function Inv01Portada() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}
    >
      {/* Ambient glow center */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 50%, rgba(212,175,55,0.09) 0%, rgba(27,6,15,0) 60%)", zIndex: 0 }} />

      {/* Left column */}
      <div
        className="relative flex flex-col justify-between"
        style={{ width: "52vw", height: "100vh", padding: "7vh 6vw 7vh 7vw", boxSizing: "border-box", zIndex: 2 }}
      >
        {/* Logo + rule */}
        <div>
          <div style={{ fontSize: "1.3vw", fontWeight: 700, letterSpacing: "0.22em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "1.2vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "3.5vw", height: "0.35vh", background: "linear-gradient(90deg, #D4AF37, #E9C46A)" }} />
        </div>

        {/* Hero copy */}
        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 400, color: "rgba(242,231,228,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2.5vh" }}>
            Presentación para Inversionistas
          </div>
          <div style={{ fontSize: "5.6vw", fontWeight: 300, lineHeight: 1.08, letterSpacing: "-0.035em", color: "#F4DAD5", marginBottom: "0.3vh" }}>
            El sonido
          </div>
          <div style={{ fontSize: "5.6vw", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.035em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "4vh" }}>
            que transforma.
          </div>
          <div style={{ fontSize: "1.65vw", fontWeight: 400, color: "rgba(242,231,228,0.6)", maxWidth: "40vw", lineHeight: 1.65, textWrap: "pretty" }}>
            La plataforma de bienestar, meditación y expansión de consciencia impulsada por sonido — pensada para el mundo hispanohablante.
          </div>
        </div>

        {/* Quote divider */}
        <div>
          <div style={{ width: "2.5vw", height: "0.25vh", backgroundColor: "rgba(212,175,55,0.4)", marginBottom: "2vh" }} />
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "rgba(242,231,228,0.75)", lineHeight: 1.6, maxWidth: "38vw", fontStyle: "italic", textWrap: "pretty" }}>
            "Transformamos 10 años de comunidad, contenido y experiencia en una plataforma digital escalable."
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: "3vw", alignItems: "center" }}>
          <div style={{ fontSize: "1.3vw", fontWeight: 500, color: "rgba(242,231,228,0.4)", letterSpacing: "0.1em" }}>
            CASA DEL CUENCO
          </div>
          <div style={{ width: "0.3vw", height: "0.3vw", borderRadius: "50%", backgroundColor: "rgba(212,175,55,0.5)" }} />
          <div style={{ fontSize: "1.3vw", fontWeight: 400, color: "rgba(242,231,228,0.4)", letterSpacing: "0.08em" }}>
            iOS · Android · 2026
          </div>
        </div>
      </div>

      {/* Right column — phone mockup */}
      <div style={{ width: "48vw", height: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
        {/* Glow behind phone */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "28vw", height: "28vw", background: "radial-gradient(circle, rgba(212,175,55,0.13) 0%, transparent 70%)", zIndex: 0 }} />

        {/* Phone */}
        <div style={{ position: "relative", zIndex: 1, width: "16.5vw", height: "35.8vw", backgroundColor: "#1C1C1E", borderRadius: "3vw", padding: "0.55vw", boxShadow: "0 2vw 8vw rgba(0,0,0,0.9), 0 0 0 0.12vw rgba(255,255,255,0.07)" }}>
          <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "3.8vw", height: "0.8vw", backgroundColor: "#000", borderRadius: "0.55vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "2.55vw", overflow: "hidden", backgroundColor: "#1B060F" }}>
            <img src={`${base}mockup-home.jpg`} crossOrigin="anonymous" alt="Resonancia App" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>

        {/* Second phone behind */}
        <div style={{ position: "absolute", right: "3vw", top: "50%", transform: "translateY(-40%)", width: "13vw", height: "28.2vw", backgroundColor: "#2C2C2E", borderRadius: "2.4vw", padding: "0.44vw", boxShadow: "0 1vw 4vw rgba(0,0,0,0.7)", opacity: 0.55, zIndex: 0 }}>
          <div style={{ position: "absolute", top: "1.1vw", left: "50%", transform: "translateX(-50%)", width: "3vw", height: "0.65vw", backgroundColor: "#000", borderRadius: "0.44vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "2vw", overflow: "hidden", backgroundColor: "#1B060F" }}>
            <img src={`${base}mockup-sonidos.jpg`} crossOrigin="anonymous" alt="Sonidos" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>

        {/* Left edge blend */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "15%", height: "100%", background: "linear-gradient(90deg, #1B060F 0%, transparent 100%)", zIndex: 3 }} />
      </div>
    </div>
  );
}
