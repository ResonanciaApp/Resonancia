export default function Dec01Portada() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ backgroundColor: "#0E0508", color: "#F4DAD5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      {/* Background grid lines */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)", backgroundSize: "8vw 8vw", zIndex: 0 }} />

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3.5vh 5vw", borderBottom: "1px solid rgba(212,175,55,0.15)", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <div style={{ width: "2.2vw", height: "2.2vw", background: "linear-gradient(135deg, #D4AF37, #E9C46A)", borderRadius: "0.4vw" }} />
          <span style={{ fontSize: "1.1vw", fontWeight: 700, letterSpacing: "0.06em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</span>
        </div>
        <div style={{ display: "flex", gap: "3vw", fontSize: "0.85vw", fontWeight: 500, color: "rgba(242,231,228,0.45)", letterSpacing: "0.1em" }}>
          <span>DECISIONES DE LANZAMIENTO</span>
          <span>JUNIO 2026</span>
        </div>
      </div>

      {/* Main content — left column */}
      <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "5vw", width: "52vw", zIndex: 2 }}>
        <div style={{ fontSize: "1vw", fontWeight: 600, letterSpacing: "0.18em", color: "#D4AF37", marginBottom: "2.5vh", textTransform: "uppercase" }}>
          Deck Interno · Casa del Cuenco
        </div>
        <h1 style={{ fontSize: "5.5vw", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 1.5vh 0", color: "#F4DAD5" }}>
          Decisiones
        </h1>
        <h1 style={{ fontSize: "5.5vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 4vh 0", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Clave
        </h1>
        <p style={{ fontSize: "1.4vw", fontWeight: 400, color: "rgba(242,231,228,0.55)", lineHeight: 1.6, maxWidth: "38vw" }}>
          Roadmap técnico y estratégico antes de publicar RESONANCIA en App Store y Google Play.
        </p>
      </div>

      {/* Right — decision cards */}
      <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", right: "5vw", width: "34vw", display: "flex", flexDirection: "column", gap: "1.5vh", zIndex: 2 }}>
        {[
          { num: "01", label: "Premium vs Free" },
          { num: "02", label: "EAS Build" },
          { num: "03", label: "GitHub" },
          { num: "04", label: "Formato de Audio" },
          { num: "05", label: "Infraestructura de Video" },
          { num: "06", label: "Sincronización en la Nube" },
        ].map((item) => (
          <div key={item.num} style={{ display: "flex", alignItems: "center", gap: "1.5vw", background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: "0.8vw", padding: "1.8vh 2vw" }}>
            <span style={{ fontSize: "1.1vw", fontWeight: 700, color: "#D4AF37", fontVariantNumeric: "tabular-nums", minWidth: "2.5vw" }}>{item.num}</span>
            <div style={{ width: "1px", height: "2.5vh", background: "rgba(212,175,55,0.2)" }} />
            <span style={{ fontSize: "1.1vw", fontWeight: 500, color: "rgba(242,231,228,0.8)" }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2.5vh 5vw", borderTop: "1px solid rgba(212,175,55,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
        <span style={{ fontSize: "0.85vw", color: "rgba(242,231,228,0.3)", letterSpacing: "0.06em" }}>Casa del Cuenco · Uso interno</span>
        <span style={{ fontSize: "0.85vw", color: "rgba(242,231,228,0.3)", letterSpacing: "0.06em" }}>Confidencial</span>
      </div>
    </div>
  );
}
