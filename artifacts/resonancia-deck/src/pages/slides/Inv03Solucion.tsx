const base = import.meta.env.BASE_URL;

export default function Inv03Solucion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}
    >
      {/* Subtle radial glow top right */}
      <div style={{ position: "absolute", top: "-10vh", right: "-5vw", width: "45vw", height: "55vh", background: "radial-gradient(ellipse, rgba(212,175,55,0.07) 0%, transparent 65%)", zIndex: 0 }} />

      <div className="relative" style={{ height: "100%", display: "flex", padding: "7vh 6vw", gap: "4vw", zIndex: 2 }}>

        {/* Left — features list */}
        <div style={{ width: "50vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", textTransform: "uppercase", marginBottom: "1.5vh" }}>
            La Solución
          </div>
          <div style={{ fontSize: "4vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "1.5vh", textWrap: "balance" }}>
            ¿Qué es Resonancia?
          </div>
          <div style={{ width: "4vw", height: "0.3vh", background: "linear-gradient(90deg, #D4AF37, transparent)", marginBottom: "4vh" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "2vh" }}>
            {[
              { icon: "◈", label: "Biblioteca de sonidos terapéuticos", sub: "Cuencos, gongs, ancestrales, naturaleza" },
              { icon: "◉", label: "Meditaciones guiadas", sub: "Voces profesionales en español" },
              { icon: "◌", label: "Mezclador de sonidos personalizado", sub: "Capas de audio en tiempo real" },
              { icon: "◇", label: "Geometrix", sub: "Experiencias visuales inmersivas" },
              { icon: "◎", label: "Sesiones en vivo", sub: "Con guías certificados vía streaming" },
              { icon: "◫", label: "Comunidad y aprendizaje", sub: "Diario, grupos y contenido educativo" },
            ].map(({ icon, label, sub }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "1.8vw" }}>
                <div style={{ fontSize: "1.6vw", color: "#D4AF37", flexShrink: 0, width: "1.8vw", textAlign: "center" }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: "1.75vw", fontWeight: 600, color: "#F4DAD5", lineHeight: 1.2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: "1.35vw", fontWeight: 400, color: "rgba(242,231,228,0.5)", lineHeight: 1.3 }}>
                    {sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — phone screenshots */}
        <div style={{ width: "44vw", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Glow */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "30vw", height: "30vw", background: "radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 65%)" }} />

          {/* Front phone */}
          <div style={{ position: "relative", zIndex: 2, width: "15vw", height: "32.5vw", backgroundColor: "#1C1C1E", borderRadius: "2.7vw", padding: "0.5vw", boxShadow: "0 2vw 8vw rgba(0,0,0,0.9), 0 0 0 0.1vw rgba(255,255,255,0.07)", marginRight: "-4vw" }}>
            <div style={{ position: "absolute", top: "1.3vw", left: "50%", transform: "translateX(-50%)", width: "3.5vw", height: "0.72vw", backgroundColor: "#000", borderRadius: "0.5vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2.3vw", overflow: "hidden", backgroundColor: "#1B060F" }}>
              <img src={`${base}mockup-biblioteca.jpg`} crossOrigin="anonymous" alt="Biblioteca" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>

          {/* Back phone */}
          <div style={{ position: "relative", zIndex: 1, width: "13.5vw", height: "29.3vw", backgroundColor: "#2C2C2E", borderRadius: "2.4vw", padding: "0.44vw", boxShadow: "0 1vw 4vw rgba(0,0,0,0.7)", opacity: 0.65, marginTop: "5vh" }}>
            <div style={{ position: "absolute", top: "1.1vw", left: "50%", transform: "translateX(-50%)", width: "3vw", height: "0.65vw", backgroundColor: "#000", borderRadius: "0.44vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2vw", overflow: "hidden", backgroundColor: "#1B060F" }}>
              <img src={`${base}mockup-musica.jpg`} crossOrigin="anonymous" alt="Música" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
