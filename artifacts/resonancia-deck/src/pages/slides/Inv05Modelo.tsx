export default function Inv05Modelo() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}
    >
      {/* Subtle diagonal texture */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(150deg, rgba(74,12,12,0.25) 0%, #1B060F 50%, rgba(10,0,4,0.5) 100%)" }} />

      <div className="relative" style={{ height: "100%", padding: "7vh 7vw", display: "flex", flexDirection: "column", zIndex: 2 }}>

        {/* Header */}
        <div style={{ marginBottom: "5vh" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", textTransform: "uppercase", marginBottom: "0.8vh" }}>
            Modelo de Negocio
          </div>
          <div style={{ fontSize: "3.8vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "5vh" }}>
            Freemium + Suscripción
          </div>
        </div>

        {/* Three columns */}
        <div style={{ display: "flex", gap: "2vw", flex: 1, alignItems: "stretch" }}>

          {/* Free */}
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.15em", color: "rgba(242,231,228,0.4)", textTransform: "uppercase", marginBottom: "1vh" }}>
              Gratis
            </div>
            <div style={{ fontSize: "3.2vw", fontWeight: 700, color: "#F4DAD5", marginBottom: "3vh" }}>
              Free
            </div>
            <div style={{ width: "100%", height: "0.25vh", background: "rgba(255,255,255,0.08)", marginBottom: "3vh" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1.6vh", flex: 1 }}>
              {[
                "Selección de sesiones gratuitas",
                "Reproductor básico",
                "Geometrix básico",
                "Diario personal",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
                  <div style={{ color: "rgba(242,231,228,0.35)", fontSize: "1.4vw", flexShrink: 0, marginTop: "0.1vh" }}>—</div>
                  <div style={{ fontSize: "1.55vw", fontWeight: 400, color: "rgba(242,231,228,0.6)", lineHeight: 1.35 }}>{item}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium — highlighted */}
          <div style={{ flex: 1, background: "linear-gradient(160deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.04) 100%)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", display: "flex", flexDirection: "column", position: "relative" }}>
            <div style={{ position: "absolute", top: "-1.2vh", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", borderRadius: "2vw", padding: "0.4vh 1.8vw", fontSize: "1.1vw", fontWeight: 700, color: "#1B060F", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
              RECOMENDADO
            </div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.15em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", textTransform: "uppercase", marginBottom: "1vh" }}>
              Suscripción
            </div>
            <div style={{ fontSize: "3.2vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "3vh" }}>
              Premium
            </div>
            <div style={{ width: "100%", height: "0.25vh", background: "rgba(212,175,55,0.2)", marginBottom: "3vh" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1.6vh", flex: 1 }}>
              {[
                "Biblioteca completa de sesiones",
                "Mezclador de sonidos avanzado",
                "Geometrix completo",
                "Contenido exclusivo",
                "Sesiones en vivo",
                "Comunidad premium",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
                  <div style={{ color: "#D4AF37", fontSize: "1.4vw", flexShrink: 0, marginTop: "0.1vh" }}>✓</div>
                  <div style={{ fontSize: "1.55vw", fontWeight: 500, color: "#F4DAD5", lineHeight: 1.35 }}>{item}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Plus — future */}
          <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.1)", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.15em", color: "rgba(212,175,55,0.5)", textTransform: "uppercase", marginBottom: "1vh" }}>
              Futuro
            </div>
            <div style={{ fontSize: "3.2vw", fontWeight: 700, color: "rgba(242,231,228,0.4)", marginBottom: "3vh" }}>
              Premium Plus
            </div>
            <div style={{ width: "100%", height: "0.25vh", background: "rgba(255,255,255,0.06)", marginBottom: "3vh" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "1.6vh", flex: 1 }}>
              {[
                "Audio Hi-Fi descargable",
                "Cursos certificados",
                "Consultas privadas",
                "Acceso anticipado a contenido",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
                  <div style={{ color: "rgba(212,175,55,0.3)", fontSize: "1.4vw", flexShrink: 0, marginTop: "0.1vh" }}>◇</div>
                  <div style={{ fontSize: "1.55vw", fontWeight: 400, color: "rgba(242,231,228,0.4)", lineHeight: 1.35 }}>{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
