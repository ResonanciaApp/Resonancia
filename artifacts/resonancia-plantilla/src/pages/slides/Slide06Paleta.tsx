const HOY = [
  "App completa para iOS y Android (Expo SDK 54)",
  "Biblioteca de sesiones, mezclador ambiente, diario de bienestar",
  "Panel admin · API propia con autenticación Clerk",
  "Sincronización en la nube · Arquitectura escalable",
];

const PROX = [
  "Lanzamiento en App Store y Google Play (EAS Build)",
  "Cobro in-app vía RevenueCat — Apple IAP / Google Play",
  "Meta: 10.000 usuarios · 1.000 suscriptores premium",
  "Video meditación en streaming (Bunny.net CDN)",
  "Versión web con pago Stripe directo",
];

export default function Slide06Paleta() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "8vh 6vw", boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 65%, rgba(190,150,80,0.07) 0%, rgba(6,10,15,0) 60%)" }} />

      {/* Eyebrow */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "1.8vh", position: "relative" }}>
        <div style={{ width: "2.5vw", height: "2px", backgroundColor: "#BE9650" }} />
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "#BE9650", letterSpacing: "0.18em" }}>TRACCIÓN Y PRÓXIMOS PASOS</div>
      </div>

      {/* Headline */}
      <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.06, marginBottom: "4vh", position: "relative" }}>
        El producto ya existe.{" "}
        <span style={{ color: "#BE9650" }}>El riesgo técnico, resuelto.</span>
      </div>

      {/* HOY vs PRÓXIMOS */}
      <div style={{ display: "flex", gap: "3vw", flex: 1, position: "relative" }}>
        {/* HOY */}
        <div style={{ flex: 1, backgroundColor: "#0C1119", borderRadius: "1.2vw", padding: "3vh 2.5vw", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "3vh" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "9999px", backgroundColor: "#BE9650" }} />
            <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#7A8FA8", letterSpacing: "0.18em" }}>HOY — LISTO</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0" }}>
            {HOY.map((item, i) => (
              <div
                key={item}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "1.2vw",
                  padding: "1.5vh 0",
                  borderBottom: i < HOY.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div style={{ width: "5px", height: "5px", borderRadius: "9999px", backgroundColor: "#BE9650", marginTop: "0.9vh", flexShrink: 0 }} />
                <div style={{ fontSize: "1.55vw", color: "#EDE1D3", lineHeight: 1.45 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PRÓXIMOS 6 MESES */}
        <div style={{ flex: 1, border: "1.5px solid #BE9650", borderRadius: "1.2vw", padding: "3vh 2.5vw", boxSizing: "border-box", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: "35%", height: "100%", background: "linear-gradient(135deg, rgba(190,150,80,0.05) 0%, transparent 60%)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "3vh" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "9999px", border: "2px solid #BE9650" }} />
            <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.18em" }}>PRÓXIMOS 6 MESES</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0" }}>
            {PROX.map((item, i) => (
              <div
                key={item}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "1.2vw",
                  padding: "1.3vh 0",
                  borderBottom: i < PROX.length - 1 ? "1px solid rgba(190,150,80,0.1)" : "none",
                }}
              >
                <div style={{ width: "5px", height: "5px", borderRadius: "9999px", backgroundColor: "#BE9650", marginTop: "0.9vh", flexShrink: 0 }} />
                <div style={{ fontSize: "1.5vw", color: "#EDE1D3", lineHeight: 1.45 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ marginTop: "3vh", textAlign: "center", position: "relative" }}>
        <div style={{ width: "4vw", height: "2px", backgroundColor: "#BE9650", margin: "0 auto 1.5vh", opacity: 0.5 }} />
        <div style={{ fontSize: "1.9vw", fontWeight: 700, letterSpacing: "0.2em", color: "#BE9650" }}>RESONANCIA</div>
        <div style={{ fontSize: "1.4vw", color: "#7A8FA8", marginTop: "0.5vh" }}>contacto@casadelcuenco.com</div>
      </div>
    </div>
  );
}
