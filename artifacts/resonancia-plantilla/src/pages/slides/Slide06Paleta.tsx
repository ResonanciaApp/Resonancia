export default function Slide06Paleta() {
  const hoy = [
    "App funcional en iOS y Android (Expo SDK 54)",
    "Biblioteca de sesiones, mezclador, diario, comunidad",
    "Panel admin · API propia · Sincronización en la nube",
  ];
  const prox = [
    "Lanzamiento en stores con EAS Build",
    "Cobro in-app vía RevenueCat (Apple / Google)",
    "10.000 usuarios · 1.000 suscriptores premium",
    "Contenido de video meditación (streaming Bunny.net)",
    "Versión web con pago Stripe directo",
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 60%, rgba(190,150,80,0.06) 0%, rgba(6,10,15,0) 65%)" }} />

      <div style={{ position: "relative" }}>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          05 · TRACCIÓN Y PRÓXIMOS PASOS
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          El producto ya existe.{" "}
          <span style={{ color: "#BE9650" }}>El riesgo técnico, resuelto.</span>
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", gap: "3vw" }}>
        {/* HOY */}
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "2.2vh" }}>HOY</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.6vh" }}>
            {hoy.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "9999px", backgroundColor: "#BE9650", marginTop: "0.85vh", flexShrink: 0 }} />
                <div style={{ fontSize: "1.6vw", color: "#EDE1D3", lineHeight: 1.45 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PRÓXIMOS 6 MESES */}
        <div style={{ flex: 1, border: "1.5px solid #BE9650", borderRadius: "1.2vw", padding: "3.5vh 2.5vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "#BE9650", letterSpacing: "0.14em", marginBottom: "2.2vh" }}>PRÓXIMOS 6 MESES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.6vh" }}>
            {prox.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: "1.2vw" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "9999px", backgroundColor: "#BE9650", marginTop: "0.85vh", flexShrink: 0 }} />
                <div style={{ fontSize: "1.6vw", color: "#EDE1D3", lineHeight: 1.45 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Closing */}
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ fontSize: "2.2vw", fontWeight: 700, letterSpacing: "0.16em", color: "#BE9650", marginBottom: "1vh" }}>RESONANCIA</div>
        <div style={{ fontSize: "1.5vw", color: "#7A8FA8" }}>contacto@casadelcuenco.com</div>
      </div>
    </div>
  );
}
