export default function Slide05Modelo() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          04 · EL MODELO, EN SIMPLE
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Suscripción <span style={{ color: "#BE9650" }}>freemium.</span>
        </div>
      </div>

      {/* Two columns Free vs Premium */}
      <div style={{ display: "flex", gap: "2.5vw" }}>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "3.5vh 2.2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2.2vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "2vh" }}>Free</div>
          <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.7 }}>
            Una muestra del catálogo · Frase e intención del día · Comunidad completa · Diario y favoritos limitados
          </div>
        </div>
        <div style={{ flex: 1, border: "1.5px solid #BE9650", borderRadius: "1vw", padding: "3.5vh 2.2vw", boxSizing: "border-box", backgroundColor: "rgba(190,150,80,0.06)" }}>
          <div style={{ fontSize: "2.2vw", fontWeight: 700, color: "#BE9650", marginBottom: "2vh" }}>Premium</div>
          <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.7 }}>
            Catálogo completo · Descargas offline · Diario y favoritos ilimitados · Personalización y estadísticas
          </div>
        </div>
      </div>

      {/* Pricing strip */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "3vw" }}>
        <div style={{ maxWidth: "52vw" }}>
          <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.55 }}>
            Cobro in-app vía Apple y Google, con prueba gratis de 7 días. La audiencia que ya existe se convierte en usuarios.
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "3.6vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>$6.900<span style={{ fontSize: "1.6vw", color: "#7A8FA8", fontWeight: 500 }}> /mes</span></div>
          <div style={{ fontSize: "1.4vw", color: "#7A8FA8", marginTop: "1vh" }}>ARPU neto ≈ $3.300 tras impuestos y comisión de tienda</div>
        </div>
      </div>
    </div>
  );
}
