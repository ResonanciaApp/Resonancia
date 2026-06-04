export default function Slide04Estadistica() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(190,150,80,0.06) 0%, rgba(6,10,15,0) 65%)" }} />

      <div style={{ position: "relative" }}>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          03 · MODELO DE NEGOCIOS
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Freemium — acceso libre +{" "}
          <span style={{ color: "#BE9650" }}>Premium.</span>
        </div>
      </div>

      {/* Free vs Premium */}
      <div style={{ position: "relative", display: "flex", gap: "2.5vw" }}>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "3.5vh 2.5vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "2vh" }}>Free</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
            {["Biblioteca básica de sesiones", "Mezclador de sonidos ambiente", "Diario de bienestar", "Frase e intención del día"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "9999px", backgroundColor: "#7A8FA8", flexShrink: 0 }} />
                <div style={{ fontSize: "1.55vw", color: "#7A8FA8", lineHeight: 1.4 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, border: "1.5px solid #BE9650", borderRadius: "1vw", padding: "3.5vh 2.5vw", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2vh" }}>
            <div style={{ fontSize: "2vw", fontWeight: 700, color: "#BE9650" }}>Premium</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#BE9650" }}>USD 4/mes · USD 39/año</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
            {["Biblioteca completa sin límites", "Contenido exclusivo y nuevos lanzamientos", "Sin publicidad · Descarga offline", "Free trial 7 días sin tarjeta"].map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "9999px", backgroundColor: "#BE9650", flexShrink: 0 }} />
                <div style={{ fontSize: "1.55vw", color: "#EDE1D3", lineHeight: 1.4 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channels */}
      <div style={{ position: "relative", display: "flex", gap: "2.5vw" }}>
        {[
          { label: "Apple IAP", sub: "15-30% comisión store" },
          { label: "Google Play", sub: "15-30% comisión store" },
          { label: "Stripe Web (futuro)", sub: "sin comisión de store" },
        ].map((ch) => (
          <div key={ch.label} style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "0.8vw", padding: "1.8vh 2vw", boxSizing: "border-box" }}>
            <div style={{ fontSize: "1.6vw", fontWeight: 600, color: "#EDE1D3" }}>{ch.label}</div>
            <div style={{ fontSize: "1.3vw", color: "#7A8FA8", marginTop: "0.5vh" }}>{ch.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: "5vh", right: "6vw", fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.08em" }}>
        RESONANCIA
      </div>
    </div>
  );
}
