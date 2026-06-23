export default function P08Ronda() {
  const funds = [
    { pct: "45%", label: "Producto & Tecnología", desc: "Infraestructura de escala, nuevas funcionalidades, EAS build + publicación en stores" },
    { pct: "35%", label: "Adquisición & Crecimiento", desc: "Performance marketing en mercados clave: Chile, México, Colombia, España" },
    { pct: "20%", label: "Contenido & Comunidad", desc: "Producción de nuevas sesiones, artistas y guiadores certificados" },
  ];

  const milestones = [
    { time: "M3", text: "App publicada en App Store + Play Store" },
    { time: "M6", text: "5.000 suscriptores Premium activos" },
    { time: "M9", text: "Expansión a México + Colombia" },
    { time: "M12", text: "20.000 suscriptores — MRR USD 150K" },
    { time: "M18", text: "Punto de equilibrio operacional" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      {/* Decorative BG number */}
      <div style={{ position: "absolute", bottom: "-8vh", right: "-3vw", fontSize: "40vw", fontWeight: 900, color: "rgba(212,175,55,0.03)", letterSpacing: "-0.06em", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>$</div>

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left — The ask */}
        <div style={{ width: "44vw", padding: "8vh 4vw 8vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", marginBottom: "1.5vh" }}>LA RONDA</div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5, marginBottom: "5vh" }} />

            <div style={{ fontSize: "2vw", fontWeight: 500, color: "rgba(244,218,213,0.45)", letterSpacing: "0.05em", marginBottom: "1.5vh" }}>RONDA SEED</div>
            <div style={{ fontSize: "9vw", fontWeight: 800, lineHeight: 0.85, letterSpacing: "-0.05em", color: "#D4AF37", marginBottom: "1.5vh" }}>
              [ — ]
            </div>
            <div style={{ fontSize: "1.35vw", fontWeight: 400, color: "rgba(244,218,213,0.4)", marginBottom: "5vh" }}>* Completar con monto y equity antes de presentar</div>

            {/* Use of funds */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5vh" }}>
              {funds.map((f) => (
                <div key={f.label} style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                  <div style={{ fontSize: "2vw", fontWeight: 800, color: "#D4AF37", width: "4vw", flexShrink: 0 }}>{f.pct}</div>
                  <div>
                    <div style={{ fontSize: "1.35vw", fontWeight: 600, color: "#F4DAD5", marginBottom: "0.2vh" }}>{f.label}</div>
                    <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(244,218,213,0.4)", lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>08 / 08</div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.12)", margin: "8vh 0" }} />

        {/* Right — Milestones */}
        <div style={{ flex: 1, padding: "8vh 8vw 8vh 4vw", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(244,218,213,0.3)", marginBottom: "4vh" }}>HITOS A 18 MESES</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {milestones.map((m, i) => (
              <div key={m.time} style={{ display: "flex", alignItems: "flex-start", gap: "2.5vw", paddingBottom: "3vh", borderBottom: i < milestones.length - 1 ? "1px solid rgba(244,218,213,0.07)" : "none", marginBottom: i < milestones.length - 1 ? "3vh" : 0 }}>
                <div style={{ fontSize: "1.3vw", fontWeight: 800, color: "#D4AF37", width: "3vw", flexShrink: 0 }}>{m.time}</div>
                <div style={{ fontSize: "1.45vw", fontWeight: 400, color: "rgba(244,218,213,0.75)", lineHeight: 1.4 }}>{m.text}</div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div style={{ marginTop: "5vh", paddingTop: "3vh", borderTop: "1px solid rgba(212,175,55,0.2)" }}>
            <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(244,218,213,0.3)", letterSpacing: "0.08em", marginBottom: "0.5vh" }}>CONTACTO</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "#F4DAD5" }}>hola@casadelcuenco.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
