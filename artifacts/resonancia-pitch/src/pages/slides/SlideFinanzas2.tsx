export default function SlideFinanzas2() {
  // Suscriptores mes a mes (escenario base, 12 meses)
  // ARPU neto blended: $4.350/mes
  const meses = [
    { label: "M1",  subs: 0     },
    { label: "M2",  subs: 400   },
    { label: "M3",  subs: 1000  },
    { label: "M4",  subs: 2000  },
    { label: "M5",  subs: 2700  },
    { label: "M6",  subs: 3300  },
    { label: "M7",  subs: 3800  },
    { label: "M8",  subs: 4200  },
    { label: "M9",  subs: 4500  },
    { label: "M10", subs: 4700  },
    { label: "M11", subs: 4900  },
    { label: "M12", subs: 5000  },
  ];

  const maxSubs = 5000;

  const scenarios = [
    { label: "Base",      subs12: "5.000",  ing12: "$21,75M/mes", ingAnual: "~$159M", highlight: true },
    { label: "Optimista", subs12: "7.000",  ing12: "$30,45M/mes", ingAnual: "~$220M", color: "#6EC49A" },
    { label: "Agresivo",  subs12: "10.000", ing12: "$43,5M/mes",  ingAnual: "~$308M", color: "#6EC49A" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #2E0D16 0%, #1A0810 100%)", color: "#F4DAD5", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 2 DE 3
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Curva de crecimiento y <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>escenarios.</span>
        </div>
      </div>

      {/* Main content: chart + scenarios */}
      <div style={{ display: "flex", gap: "4vw", alignItems: "flex-start", flex: 1, marginTop: "4vh" }}>

        {/* Left: bar chart suscriptores */}
        <div style={{ flex: 1.4, display: "flex", flexDirection: "column", height: "34vh" }}>
          <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.08em", marginBottom: "1.2vh" }}>
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
                        ? "linear-gradient(180deg, #F7CB6B 0%, #C8963E 100%)"
                        : m.subs > 0
                        ? "rgba(247,203,107,0.4)"
                        : "rgba(224,112,112,0.3)",
                      borderRadius: "0.25vw 0.25vw 0 0",
                    }} />
                  </div>
                  <div style={{ fontSize: "0.9vw", color: "#3D0E16", textAlign: "center" }}>{m.label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.8vh" }}>
            {[0, 1700, 3400, 5000].map(v => (
              <div key={v} style={{ fontSize: "1vw", color: "#3D0E16" }}>{v === 0 ? "0" : `${v.toLocaleString("es-CL")}`}</div>
            ))}
          </div>
        </div>

        {/* Right: escenarios */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.2vh" }}>
          <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.08em", marginBottom: "0.4vh" }}>
            ESCENARIOS AÑO 1 (CLP)
          </div>
          {scenarios.map((s) => (
            <div
              key={s.label}
              style={{
                padding: "1.6vh 1.4vw",
                backgroundColor: s.highlight ? "#1A0810" : "transparent",
                border: `1.5px solid ${s.highlight ? "#F7CB6B" : "rgba(255,255,255,0.09)"}`,
                borderRadius: "0.8vw",
                display: "flex",
                alignItems: "center",
                gap: "2vw",
              }}
            >
              <div style={{ width: "0.5vw", height: "3vh", backgroundColor: s.color, borderRadius: "0.2vw", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: s.highlight ? "#F7CB6B" : "#F4DAD5" }}>{s.label}</div>
                <div style={{ fontSize: "1.1vw", color: "rgba(242,231,228,0.50)" }}>{s.subs12} suscriptores al mes 12</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.55vw", fontWeight: 700, color: s.highlight ? "#F7CB6B" : "#F4DAD5" }}>{s.ingAnual}</div>
                <div style={{ fontSize: "1.0vw", color: "rgba(242,231,228,0.50)" }}>{s.ing12}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5vw", marginTop: "3vh" }}>
        {[
          { label: "Inversión inicial",   value: "$27M CLP",    sub: "capital inicial requerido" },
          { label: "Break-even acum.",    value: "Mes 7–8",     sub: "incl. recuperar inversión" },
          { label: "ARPU neto blended",   value: "$4.350 CLP",  sub: "post IVA 19% + tienda 30%" },
          { label: "ROI proyectado año 1",value: "+$95M neto",  sub: "excl. inversión inicial" },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              padding: "1.8vh 1.2vw",
              backgroundColor: "#1A0810",
              border: "1px solid rgba(247,203,107,0.18)",
              borderRadius: "0.8vw",
            }}
          >
            <div style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.50)", letterSpacing: "0.06em", marginBottom: "0.6vh" }}>{k.label.toUpperCase()}</div>
            <div style={{ fontSize: "1.9vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: "1.05vw", color: "#3D0E16", marginTop: "0.5vh" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.1vw", color: "#3D0E16", lineHeight: 1.5, marginTop: "2vh" }}>
        Precio $8.990/mes (IVA 19% incl.) · $59.990/año · ARPU neto blended ~$4.350/mes (60% mensual × $5.288 neto + 40% anual × $2.941 neto equiv.) ·
        Fijos $3,25M/mes (RRHH $2,8M + hosting $250K + otros $200K) · Contenido $1,5M/mes desde M3 · Escenarios ilustrativos.
      </div>
    </div>
  );
}
