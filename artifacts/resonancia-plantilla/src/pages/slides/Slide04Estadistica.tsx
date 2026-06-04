const FREE_ITEMS = [
  "Biblioteca básica de sesiones",
  "Mezclador de sonidos ambiente",
  "Diario de bienestar",
  "Frase e intención del día",
];

const PREMIUM_ITEMS = [
  "Biblioteca completa sin límites",
  "Contenido exclusivo y nuevos lanzamientos",
  "Sin publicidad · Descarga offline",
  "Free trial 7 días sin tarjeta",
];

const CHANNELS = [
  { label: "Apple IAP", sub: "15-30% comisión store" },
  { label: "Google Play", sub: "15-30% comisión store" },
  { label: "Stripe Web (futuro)", sub: "sin comisión de store" },
];

export default function Slide04Estadistica() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "8vh 6vw", boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 55%, rgba(190,150,80,0.07) 0%, rgba(6,10,15,0) 62%)" }} />

      {/* Eyebrow */}
      <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "1.8vh", position: "relative" }}>
        <div style={{ width: "2.5vw", height: "2px", backgroundColor: "#BE9650" }} />
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "#BE9650", letterSpacing: "0.18em" }}>MODELO DE NEGOCIOS</div>
      </div>

      {/* Headline */}
      <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.06, marginBottom: "4vh", position: "relative" }}>
        Freemium — acceso libre +{" "}
        <span style={{ color: "#BE9650" }}>Premium.</span>
      </div>

      {/* Free vs Premium */}
      <div style={{ display: "flex", gap: "2.5vw", flex: 1, position: "relative" }}>
        {/* Free */}
        <div style={{ flex: 1, backgroundColor: "#0C1119", borderRadius: "1.2vw", padding: "3vh 2.5vw", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "2.5vh" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: "#7A8FA8" }} />
            <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#EDE1D3" }}>Free</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.4vh" }}>
            {FREE_ITEMS.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "9999px", backgroundColor: "#7A8FA8", flexShrink: 0 }} />
                <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.4 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Premium */}
        <div style={{ flex: 1, border: "1.5px solid #BE9650", borderRadius: "1.2vw", padding: "3vh 2.5vw", boxSizing: "border-box", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "100%", background: "linear-gradient(135deg, rgba(190,150,80,0.05) 0%, transparent 60%)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2.5vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: "#BE9650" }} />
              <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#BE9650" }}>Premium</div>
            </div>
            <div style={{ fontSize: "1.35vw", fontWeight: 600, color: "#BE9650", opacity: 0.8 }}>USD 4/mes · USD 39/año</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.4vh" }}>
            {PREMIUM_ITEMS.map((item) => (
              <div key={item} style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "9999px", backgroundColor: "#BE9650", flexShrink: 0 }} />
                <div style={{ fontSize: "1.5vw", color: "#EDE1D3", lineHeight: 1.4 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channels */}
      <div style={{ display: "flex", gap: "2.5vw", marginTop: "2.5vh", position: "relative" }}>
        {CHANNELS.map((ch) => (
          <div key={ch.label} style={{ flex: 1, backgroundColor: "#0C1119", borderRadius: "0.8vw", padding: "1.6vh 2vw", boxSizing: "border-box", borderTop: "2px solid rgba(190,150,80,0.25)" }}>
            <div style={{ fontSize: "1.55vw", fontWeight: 600, color: "#EDE1D3" }}>{ch.label}</div>
            <div style={{ fontSize: "1.25vw", color: "#7A8FA8", marginTop: "0.4vh" }}>{ch.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: "5vh", right: "6vw", fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.1em" }}>RESONANCIA</div>
    </div>
  );
}
