export default function SlideFinanzas2() {
  // Suscriptores mes a mes (escenario base, 12 meses)
  // ARPU neto: $3.300/mes
  const meses = [
    { label: "M1",  subs: 0     },
    { label: "M2",  subs: 500   },
    { label: "M3",  subs: 1500  },
    { label: "M4",  subs: 3000  },
    { label: "M5",  subs: 5000  },
    { label: "M6",  subs: 7500  },
    { label: "M7",  subs: 9500  },
    { label: "M8",  subs: 11500 },
    { label: "M9",  subs: 13000 },
    { label: "M10", subs: 14000 },
    { label: "M11", subs: 14500 },
    { label: "M12", subs: 15000 },
  ];

  const maxSubs = 15000;

  const scenarios = [
    { label: "Conservador", subs12: "7.000",  ing12: "$23,1M/mes", ingAnual: "~$85M",  color: "#3D4F62" },
    { label: "Base",        subs12: "15.000", ing12: "$49,5M/mes", ingAnual: "~$314M", color: "#BE9650", highlight: true },
    { label: "Optimista",   subs12: "25.000", ing12: "$82,5M/mes", ingAnual: "~$475M", color: "#6EC49A" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 2 DE 3
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
                      background: m.subs >= 1500
                        ? "linear-gradient(180deg, #BE9650 0%, #8A6A30 100%)"
                        : m.subs > 0
                        ? "rgba(190,150,80,0.4)"
                        : "rgba(224,112,112,0.3)",
                      borderRadius: "0.25vw 0.25vw 0 0",
                    }} />
                  </div>
                  <div style={{ fontSize: "0.9vw", color: "#3D4F62", textAlign: "center" }}>{m.label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.8vh" }}>
            {[0, 5000, 10000, 15000].map(v => (
              <div key={v} style={{ fontSize: "1vw", color: "#3D4F62" }}>{v === 0 ? "0" : `${v.toLocaleString("es-CL")}`}</div>
            ))}
          </div>
        </div>

        {/* Right: escenarios */}
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
          { label: "Inversión inicial",   value: "$22,5M CLP",  sub: "US$25.000 · TC $900" },
          { label: "Break-even acum.",    value: "Mes 7",       sub: "incl. recuperar inversión" },
          { label: "ARPU neto mensual",   value: "$3.300 CLP",  sub: "post IVA 19% + tienda 30%" },
          { label: "ROI proyectado año 1",value: "+$231M neto", sub: "excl. inversión inicial" },
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
        Precio $6.900/mes (IVA 19% incl.) · $43.900/año · ARPU neto blended ~$3.300/mes (descontado IVA + comisión tienda 30%) ·
        Fijos $3,65M/mes (gerente $2M + coordinador $700K + TI $200K + hosting $150K + admin $250K + otros $350K) · Contenido $3,0M/mes desde M3 · Escenarios ilustrativos.
      </div>
    </div>
  );
}
