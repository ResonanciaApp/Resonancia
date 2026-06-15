export default function Slide08Modelo() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          07 · MODELO DE NEGOCIO
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Suscripción <span style={{ background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>freemium.</span>
        </div>
      </div>

      {/* Two columns Free vs Premium */}
      <div style={{ display: "flex", gap: "2.5vw" }}>
        <div style={{ flex: 1, backgroundColor: "#27070E", borderRadius: "1vw", padding: "3.5vh 2.2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2.2vw", fontWeight: 700, color: "#F4DAD5", marginBottom: "2.2vh" }}>Free</div>
          <div style={{ fontSize: "1.6vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.7 }}>
            Sesiones sampler · Intención y frase del día · Comunidad completa · Diario y favoritos limitados · Temporizador hasta 30 min
          </div>
        </div>
        <div style={{ flex: 1, border: "1.5px solid #D4AF37", borderRadius: "1vw", padding: "3.5vh 2.2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2.2vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "2.2vh" }}>Premium</div>
          <div style={{ fontSize: "1.6vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.7 }}>
            Catálogo completo · Descargas offline · Diario y favoritos ilimitados · Temporizador hasta 8 hs · Estadísticas y personalización avanzada
          </div>
        </div>
      </div>

      {/* Embudo de conversión */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
        {[
          { big: "1.000.000+", small: "seguidores", gold: false },
          { big: "200.000", small: "free · 20% instala", gold: false },
          { big: "10.000", small: "techo · 5% a madurez", gold: true },
          { big: "5.000", small: "base año 1 · 2,5%", gold: true },
        ].map((s, i) => (
          <div key={s.big} style={{ display: "flex", alignItems: "center", gap: "0.8vw", flex: 1 }}>
            <div style={{
              flex: 1,
              backgroundColor: s.gold ? "rgba(212,175,55,0.08)" : "#27070E",
              border: s.gold ? "1.5px solid #D4AF37" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "0.8vw",
              padding: "1.8vh 0.8vw",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "2vw", fontWeight: 700, color: s.gold ? "#D4AF37" : "#F4DAD5", lineHeight: 1 }}>{s.big}</div>
              <div style={{ fontSize: "0.95vw", color: "rgba(242,231,228,0.50)", marginTop: "0.6vh" }}>{s.small}</div>
            </div>
            {i < 3 && <div style={{ fontSize: "1.6vw", color: "rgba(212,175,55,0.5)", flexShrink: 0 }}>→</div>}
          </div>
        ))}
      </div>

      {/* Pricing line */}
      <div style={{ display: "flex", gap: "4vw", alignItems: "baseline" }}>
        <div style={{ fontSize: "1.6vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.4, maxWidth: "44vw" }}>
          Pago in-app vía RevenueCat (Apple / Google), con precios regionales y prueba gratis de 7 días.
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: "1.5vw", color: "rgba(242,231,228,0.50)" }}>Precios sugeridos</div>
          <div style={{ fontSize: "2vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>[mensual] · [anual]</div>
        </div>
      </div>
    </div>
  );
}
