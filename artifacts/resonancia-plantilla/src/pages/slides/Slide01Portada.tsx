export default function Slide01Portada() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}
    >
      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 72% 50%, rgba(190,150,80,0.12) 0%, rgba(6,10,15,0) 58%)", zIndex: 0 }} />
      {/* Subtle grid texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(190,150,80,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(190,150,80,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px", zIndex: 0 }} />

      {/* Left column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "54vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box", position: "relative", zIndex: 1 }}
      >
        {/* Brand */}
        <div>
          <div style={{ fontSize: "1.3vw", fontWeight: 700, letterSpacing: "0.22em", color: "#BE9650" }}>RESONANCIA</div>
          <div style={{ width: "5vw", height: "2px", backgroundColor: "#BE9650", marginTop: "1.2vh", opacity: 0.6 }} />
        </div>

        {/* Hero */}
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.16em", marginBottom: "3vh", textTransform: "uppercase" }}>
            Modelo de Negocios
          </div>
          <div style={{ fontSize: "5.6vw", fontWeight: 300, lineHeight: 1.04, letterSpacing: "-0.04em" }}>
            La primera app de
          </div>
          <div style={{ fontSize: "5.6vw", fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.04em", color: "#BE9650", marginBottom: "3.5vh" }}>
            meditación nativa.
          </div>
          <div style={{ width: "2px", height: "6vh", backgroundColor: "#BE9650", opacity: 0.5, marginBottom: "3vh" }} />
          <div style={{ fontSize: "1.75vw", fontWeight: 400, color: "#7A8FA8", maxWidth: "38vw", lineHeight: 1.7 }}>
            580 millones de hispanohablantes. Una sola plataforma pensada desde su idioma, su cultura y su espiritualidad.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.1em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.06em" }}>iOS · Android</div>
        </div>
      </div>

      {/* Right column — stats */}
      <div style={{ width: "46vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
        {/* Edge fade */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "12%", height: "100%", background: "linear-gradient(90deg, #060A0F, transparent)", zIndex: 2 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "2vh", width: "32vw" }}>
          {[
            { val: "580M+", label: "hispanohablantes en el mundo" },
            { val: "USD 4/mes", label: "plan premium más accesible del mercado" },
            { val: "0", label: "competidores nativos en español de calidad" },
          ].map((item) => (
            <div
              key={item.val}
              style={{
                backgroundColor: "#0C1119",
                borderRadius: "1vw",
                padding: "3vh 2.4vw",
                boxSizing: "border-box",
                borderLeft: "3px solid #BE9650",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ fontSize: "3.4vw", fontWeight: 800, color: "#BE9650", lineHeight: 1, letterSpacing: "-0.02em" }}>{item.val}</div>
              <div style={{ fontSize: "1.35vw", color: "#7A8FA8", marginTop: "0.9vh", lineHeight: 1.4 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
