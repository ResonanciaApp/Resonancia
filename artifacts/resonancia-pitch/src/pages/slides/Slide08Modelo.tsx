export default function Slide08Modelo() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7a6050", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          07 · MODELO DE NEGOCIO
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Suscripción <span style={{ color: "#C69B4F" }}>freemium.</span>
        </div>
      </div>

      {/* Two columns Free vs Premium */}
      <div style={{ display: "flex", gap: "2.5vw" }}>
        <div style={{ flex: 1, backgroundColor: "#24160F", borderRadius: "1vw", padding: "3.5vh 2.2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2.2vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "2.2vh" }}>Free</div>
          <div style={{ fontSize: "1.6vw", color: "#cbb9a4", lineHeight: 1.7 }}>
            Sesiones sampler · Intención y frase del día · Comunidad completa · Diario y favoritos limitados · Temporizador hasta 30 min
          </div>
        </div>
        <div style={{ flex: 1, border: "1.5px solid #C69B4F", borderRadius: "1vw", padding: "3.5vh 2.2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2.2vw", fontWeight: 700, color: "#C69B4F", marginBottom: "2.2vh" }}>Premium</div>
          <div style={{ fontSize: "1.6vw", color: "#cbb9a4", lineHeight: 1.7 }}>
            Catálogo completo · Descargas offline · Diario y favoritos ilimitados · Temporizador hasta 8 hs · Estadísticas y personalización avanzada
          </div>
        </div>
      </div>

      {/* Pricing line */}
      <div style={{ display: "flex", gap: "4vw", alignItems: "baseline" }}>
        <div style={{ fontSize: "1.6vw", color: "#7a6050", lineHeight: 1.4, maxWidth: "44vw" }}>
          Pago in-app vía RevenueCat (Apple / Google), con precios regionales y prueba gratis de 7 días.
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: "1.5vw", color: "#7a6050" }}>Precios sugeridos</div>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#C69B4F" }}>[mensual] · [anual]</div>
        </div>
      </div>
    </div>
  );
}
