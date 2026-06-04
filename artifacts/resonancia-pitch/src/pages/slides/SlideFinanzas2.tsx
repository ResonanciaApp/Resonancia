function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
      <div style={{ width: "100%", height: `${pct}%`, backgroundColor: color, borderRadius: "0.3vw 0.3vw 0 0", transition: "height 0.3s" }} />
    </div>
  );
}

export default function SlideFinanzas2() {
  // Suscriptores mes a mes (escenario base)
  const meses = [
    { label: "M1", subs: 0,      ingM: 0,    costoM: 2.8 },
    { label: "M2", subs: 200,    ingM: 0.4,  costoM: 2.8 },
    { label: "M3", subs: 800,    ingM: 1.7,  costoM: 3.9 },
    { label: "M4", subs: 1800,   ingM: 3.8,  costoM: 4.2 },
    { label: "M5", subs: 3000,   ingM: 6.3,  costoM: 4.3 },
    { label: "M6", subs: 3500,   ingM: 7.4,  costoM: 4.4 },
    { label: "M7", subs: 5000,   ingM: 10.5, costoM: 4.6 },
    { label: "M8", subs: 6500,   ingM: 13.7, costoM: 4.8 },
    { label: "M9", subs: 7000,   ingM: 14.7, costoM: 4.9 },
    { label: "M10", subs: 8500,  ingM: 17.9, costoM: 5.0 },
    { label: "M11", subs: 10000, ingM: 21.0, costoM: 5.2 },
    { label: "M12", subs: 11000, ingM: 23.1, costoM: 5.5 },
  ];

  const maxSubs = 11000;
  const maxCLP = 25;

  const scenarios = [
    { label: "Conservador", subs12: "4.000", ing12: "$8,4M/mes", ingAnual: "~$50M", color: "#3D4F62" },
    { label: "Base",        subs12: "11.000", ing12: "$23,1M/mes", ingAnual: "~$120M", color: "#BE9650", highlight: true },
    { label: "Optimista",   subs12: "20.000", ing12: "$42,0M/mes", ingAnual: "~$215M", color: "#6EC49A" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 2 DE 2
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Curva de crecimiento y <span style={{ color: "#BE9650" }}>escenarios.</span>
        </div>
      </div>

      {/* Main content: chart + scenarios */}
      <div style={{ display: "flex", gap: "4vw", alignItems: "flex-start", flex: 1, marginTop: "4vh" }}>

        {/* Left: bar chart suscriptores */}
        <div style={{ flex: 1.4, display: "flex", flexDirection: "column", height: "34vh" }}>
          <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.08em", marginBottom: "1.2vh" }}>
            SUSCRIPTORES PREMIUM · ESCENARIO BASE
          </div>
          <div style={{ flex: 1, display: "flex", gap: "0.5vw", alignItems: "flex-end", borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: "0.6vh" }}>
            {meses.map((m) => {
              const pct = Math.round((m.subs / maxSubs) * 100);
              return (
                <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6vh", height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                    <div style={{
                      width: "100%",
                      height: `${Math.max(pct, 2)}%`,
                      background: m.subs >= 3000
                        ? "linear-gradient(180deg, #BE9650 0%, #8A6A30 100%)"
                        : "rgba(190,150,80,0.25)",
                      borderRadius: "0.25vw 0.25vw 0 0",
                    }} />
                  </div>
                  <div style={{ fontSize: "0.9vw", color: "#3D4F62", textAlign: "center" }}>{m.label}</div>
                </div>
              );
            })}
          </div>
          {/* Etiquetas eje Y */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.8vh" }}>
            {[0, 3000, 7000, 11000].map(v => (
              <div key={v} style={{ fontSize: "1vw", color: "#3D4F62" }}>{v.toLocaleString("es-CL")}</div>
            ))}
          </div>
        </div>

        {/* Right: escenarios + KPIs clave */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.2vh" }}>
          <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.08em", marginBottom: "0.4vh" }}>
            ESCENARIOS AÑO 1 (CLP)
          </div>
          {scenarios.map((s) => (
            <div
              key={s.label}
              style={{
                padding: "1.6vh 1.4vw",
                backgroundColor: s.highlight ? "#090E17" : "transparent",
                border: `1.5px solid ${s.highlight ? "#BE9650" : "rgba(255,255,255,0.09)"}`,
                borderRadius: "0.8vw",
                display: "flex",
                alignItems: "center",
                gap: "2vw",
              }}
            >
              <div style={{ width: "0.5vw", height: "3vh", backgroundColor: s.color, borderRadius: "0.2vw", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: s.highlight ? "#BE9650" : "#EDE1D3" }}>{s.label}</div>
                <div style={{ fontSize: "1.1vw", color: "#7A8FA8" }}>{s.subs12} suscriptores al mes 12</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.55vw", fontWeight: 700, color: s.highlight ? "#BE9650" : "#EDE1D3" }}>{s.ingAnual}</div>
                <div style={{ fontSize: "1.0vw", color: "#7A8FA8" }}>{s.ing12}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5vw", marginTop: "3vh" }}>
        {[
          { label: "Inversión inicial", value: "$22,5M CLP", sub: "US$ 25.000 · TC $900" },
          { label: "Break-even", value: "Mes 5–6", sub: "~3.000 suscriptores" },
          { label: "ARPU neto mensual", value: "$2.100 CLP", sub: "$3.300 bruto · 30% tienda" },
          { label: "ROI proyectado año 1", value: "+$47M neto", sub: "Excl. inversión inicial" },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              padding: "1.8vh 1.2vw",
              backgroundColor: "#090E17",
              border: "1px solid rgba(190,150,80,0.18)",
              borderRadius: "0.8vw",
            }}
          >
            <div style={{ fontSize: "1.05vw", color: "#7A8FA8", letterSpacing: "0.06em", marginBottom: "0.6vh" }}>{k.label.toUpperCase()}</div>
            <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: "1.05vw", color: "#3D4F62", marginTop: "0.5vh" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.1vw", color: "#3D4F62", lineHeight: 1.5, marginTop: "2vh" }}>
        Supuestos: crecimiento orgánico desde comunidad +1M seguidores · precio $3.300/mes o $33.990/año · comisión tienda 30% · costos contenido: artistas US$80/sesión + voces US$50/sesión ($2–3,6M CLP/mes) ·
        costos fijos $1,9M/mes · escenarios ilustrativos, no garantizados.
      </div>
    </div>
  );
}
