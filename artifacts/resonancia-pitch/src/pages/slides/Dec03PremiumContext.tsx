export default function Dec03PremiumContext() {
  const done = [
    "PremiumContext + isPremium por sesión",
    "Cards con estrellita dorada para sesiones premium",
    "Toggle de testing en Configuraciones → DESARROLLO",
    "Tap en sesión premium → redirige a /membresía",
  ];
  const pending = [
    "Instalar react-native-purchases (RevenueCat SDK)",
    "Crear productos en App Store Connect y Google Play",
    "Conectar PremiumContext a estado real de RevenueCat",
    "Rebuild del dev client con el SDK nativo",
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0E0508", color: "#F4DAD5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)", backgroundSize: "8vw 8vw", zIndex: 0 }} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3.5vh 5vw", borderBottom: "1px solid rgba(212,175,55,0.15)", zIndex: 2 }}>
        <span style={{ fontSize: "0.85vw", fontWeight: 700, letterSpacing: "0.06em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
          <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.35)", letterSpacing: "0.1em" }}>ESTADO ACTUAL</span>
          <span style={{ fontSize: "1.4vw", fontWeight: 700, color: "#D4AF37" }}>01</span>
        </div>
      </div>

      <div style={{ position: "absolute", top: "13vh", left: "5vw", right: "5vw", bottom: "10vh", zIndex: 2 }}>
        <h2 style={{ fontSize: "3vw", fontWeight: 700, margin: "0 0 0.5vh 0", letterSpacing: "-0.02em" }}>PremiumContext</h2>
        <p style={{ fontSize: "1.1vw", color: "rgba(242,231,228,0.45)", margin: "0 0 3.5vh 0" }}>Lo que ya existe en código — y lo que falta para activar el cobro real.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3vw" }}>
          {/* Done */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vh" }}>
              <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "50%", background: "#D4AF37" }} />
              <span style={{ fontSize: "0.85vw", fontWeight: 600, color: "#D4AF37", letterSpacing: "0.12em", textTransform: "uppercase" }}>Ya codificado</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
              {done.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1vw", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: "0.6vw", padding: "1.6vh 1.5vw" }}>
                  <span style={{ color: "#D4AF37", fontWeight: 700, fontSize: "1vw", flexShrink: 0 }}>✅</span>
                  <span style={{ fontSize: "0.95vw", color: "rgba(242,231,228,0.85)", lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vh" }}>
              <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "50%", background: "rgba(242,231,228,0.3)" }} />
              <span style={{ fontSize: "0.85vw", fontWeight: 600, color: "rgba(242,231,228,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Falta para activar cobro</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
              {pending.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1vw", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.6vw", padding: "1.6vh 1.5vw" }}>
                  <span style={{ color: "rgba(242,231,228,0.3)", fontSize: "1vw", flexShrink: 0 }}>⬜</span>
                  <span style={{ fontSize: "0.95vw", color: "rgba(242,231,228,0.45)", lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2vh", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.6vw", padding: "1.5vh 1.5vw" }}>
              <div style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.35)", marginBottom: "0.8vh", letterSpacing: "0.08em", textTransform: "uppercase" }}>Nota</div>
              <div style={{ fontSize: "0.9vw", color: "rgba(242,231,228,0.55)", lineHeight: 1.5 }}>El PremiumContext está diseñado para conectarse a RevenueCat sin cambiar la lógica existente. Es un add-on limpio sobre lo que ya funciona.</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2vh 5vw", borderTop: "1px solid rgba(212,175,55,0.08)", display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>Casa del Cuenco · Uso interno</span>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>2 / 6</span>
      </div>
    </div>
  );
}
