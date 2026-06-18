export default function Dec02Premium() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0E0508", color: "#F4DAD5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)", backgroundSize: "8vw 8vw", zIndex: 0 }} />

      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3.5vh 5vw", borderBottom: "1px solid rgba(212,175,55,0.15)", zIndex: 2 }}>
        <span style={{ fontSize: "0.85vw", fontWeight: 700, letterSpacing: "0.06em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
          <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.35)", letterSpacing: "0.1em" }}>DECISIÓN</span>
          <span style={{ fontSize: "1.4vw", fontWeight: 700, color: "#D4AF37" }}>01</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ position: "absolute", top: "12vh", left: "5vw", right: "5vw", bottom: "10vh", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3vw", zIndex: 2 }}>

        {/* Left col */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 600, letterSpacing: "0.15em", color: "#D4AF37", marginBottom: "1.5vh", textTransform: "uppercase" }}>¿Premium desde el lanzamiento?</div>
          <h2 style={{ fontSize: "3.2vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 3vh 0", color: "#F4DAD5" }}>Opción A</h2>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, color: "rgba(242,231,228,0.5)", marginBottom: "2vh", textTransform: "uppercase", letterSpacing: "0.08em" }}>Lanzar todo free</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh", flex: 1 }}>
            {[
              "Todos los contenidos accesibles sin restricción",
              "Validás la app con usuarios reales sin fricción",
              "Integrás RevenueCat en una actualización posterior",
              "Apple no rechaza la app por botón sin función",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1vw", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw" }}>
                <span style={{ color: "#D4AF37", fontSize: "1.1vw", flexShrink: 0, marginTop: "0.1vh" }}>✓</span>
                <span style={{ fontSize: "1vw", color: "rgba(242,231,228,0.8)", lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div style={{ marginTop: "2.5vh", background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(233,196,106,0.08))", border: "1px solid rgba(212,175,55,0.35)", borderRadius: "0.8vw", padding: "2vh 2vw", display: "flex", alignItems: "center", gap: "1vw" }}>
            <span style={{ fontSize: "1.3vw" }}>★</span>
            <div>
              <div style={{ fontSize: "0.8vw", fontWeight: 600, color: "#D4AF37", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5vh" }}>Recomendación</div>
              <div style={{ fontSize: "0.95vw", color: "#F4DAD5", fontWeight: 500 }}>Lanzar free · pantalla /membresía en modo "Próximamente"</div>
            </div>
          </div>
        </div>

        {/* Right col */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 600, letterSpacing: "0.15em", color: "rgba(242,231,228,0.35)", marginBottom: "1.5vh", textTransform: "uppercase" }}>¿Premium desde el lanzamiento?</div>
          <h2 style={{ fontSize: "3.2vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 0 3vh 0", color: "rgba(242,231,228,0.45)" }}>Opción B</h2>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, color: "rgba(242,231,228,0.35)", marginBottom: "2vh", textTransform: "uppercase", letterSpacing: "0.08em" }}>Lanzar con RevenueCat activo</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh", flex: 1 }}>
            {[
              { text: "Monetizás desde el primer usuario", ok: true },
              { text: "Requiere aprobación previa de productos en App Store Connect y Google Play (1–2 semanas)", ok: false },
              { text: "Necesita rebuild del dev client con SDK nativo", ok: false },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1vw", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw" }}>
                <span style={{ color: item.ok ? "#D4AF37" : "rgba(242,231,228,0.25)", fontSize: "1.1vw", flexShrink: 0 }}>{item.ok ? "✓" : "—"}</span>
                <span style={{ fontSize: "1vw", color: "rgba(242,231,228,0.4)", lineHeight: 1.4 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2vh 5vw", borderTop: "1px solid rgba(212,175,55,0.08)", display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>Casa del Cuenco · Uso interno</span>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>1 / 6</span>
      </div>
    </div>
  );
}
