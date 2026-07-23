export default function SlideFinanzas2() {
  // Curva base: +400/mes; M11=4.400, M12=5.000 (+600 último mes)
  // ARPU neto blended $2.550/mes
  // Costos: fijo $3,9M + mkt ramp + contenido
  const ARPU = 2550;
  const COLCHON = 0.6;

  const meses = [
    { label: "M1",  subs: 400,  costos: 3.90 },
    { label: "M2",  subs: 800,  costos: 3.90 },
    { label: "M3",  subs: 1200, costos: 5.60 },
    { label: "M4",  subs: 1600, costos: 5.60 },
    { label: "M5",  subs: 2000, costos: 5.60 },
    { label: "M6",  subs: 2400, costos: 5.60 },
    { label: "M7",  subs: 2800, costos: 6.40 },
    { label: "M8",  subs: 3200, costos: 6.40 },
    { label: "M9",  subs: 3600, costos: 6.65 },
    { label: "M10", subs: 4000, costos: 6.65 },
    { label: "M11", subs: 4400, costos: 6.90 },
    { label: "M12", subs: 5000, costos: 6.90 },
  ];

  let cumulative = COLCHON;
  const data = meses.map((m) => {
    const ingreso = (m.subs * ARPU) / 1_000_000;
    const neto = ingreso - m.costos;
    cumulative += neto;
    return { ...m, ingreso, neto, cumulative: parseFloat(cumulative.toFixed(2)) };
  });

  const maxSubs = 5000;
  const allCum = data.map((d) => d.cumulative);
  const minCum = Math.min(...allCum);
  const maxCum = Math.max(...allCum);
  const cumRange = maxCum - minCum;
  const ZERO_PCT = (-minCum / cumRange) * 100;

  const scenarios = [
    { label: "Base",      subs12: "5.000",  ingAnual: "~$80M",  neto: "+$10M",  highlight: true },
    { label: "Optimista", subs12: "7.000",  ingAnual: "~$112M", neto: "+$40M",  highlight: false },
    { label: "Agresivo",  subs12: "10.000", ingAnual: "~$160M", neto: "+$90M",  highlight: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 2 DE 3
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Caja acumulada y{" "}
          <span style={{ color: "#FFFFFF" }}>
            escenarios.
          </span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(244,244,244,0.50)", marginTop: "1vh" }}>
          En millones de CLP · línea sólida = escenario base · eje Y = caja neta acumulada
        </div>
      </div>

      {/* Chart area */}
      <div style={{ flex: 1, display: "flex", gap: "3vw", minHeight: 0 }}>

        {/* Chart */}
        <div style={{ flex: 2, position: "relative", display: "flex", flexDirection: "column" }}>
          {/* Zero line */}
          <div style={{
            position: "absolute",
            left: 0, right: 0,
            top: `${ZERO_PCT}%`,
            height: "1px",
            backgroundColor: "rgba(255,255,255,0.30)",
            zIndex: 1,
          }} />
          <div style={{
            position: "absolute",
            left: 0,
            top: `${ZERO_PCT}%`,
            transform: "translateY(-50%)",
            fontSize: "0.85vw",
            color: "rgba(255,255,255,0.40)",
            zIndex: 2,
          }}>$0</div>

          {/* Bars */}
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            height: "100%",
            gap: "0.4vw",
            paddingLeft: "2vw",
            position: "relative",
          }}>
            {data.map((d, i) => {
              const heightPct = (Math.abs(d.cumulative) / cumRange) * 100;
              const isNeg = d.cumulative < 0;
              return (
                <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", position: "relative", height: `${(Math.abs(d.cumulative) / cumRange) * 100}%` }}>
                    <div style={{
                      position: "absolute",
                      bottom: isNeg ? "auto" : 0,
                      top: isNeg ? 0 : "auto",
                      left: 0, right: 0,
                      height: `${heightPct}%`,
                      minHeight: "2px",
                      backgroundColor: isNeg ? "rgba(224,112,112,0.55)" : "rgba(110,196,154,0.55)",
                      border: `1px solid ${isNeg ? "rgba(224,112,112,0.8)" : "rgba(110,196,154,0.8)"}`,
                      borderRadius: "0.3vw 0.3vw 0 0",
                      transition: "height 0.3s",
                    }} />
                  </div>
                  <div style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.45)", marginTop: "0.5vh", textAlign: "center" }}>{d.label}</div>
                  <div style={{
                    fontSize: "0.78vw",
                    fontWeight: 700,
                    color: isNeg ? "rgba(224,112,112,0.9)" : "#6EC49A",
                    textAlign: "center",
                  }}>
                    {d.cumulative > 0 ? "+" : ""}{d.cumulative.toFixed(1)}M
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel: scenarios + subs curve */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5vh" }}>

          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em" }}>SUSCRIPTORES PREMIUM — ESCENARIO BASE</div>
          <div style={{
            backgroundColor: "rgba(0,0,0,0.18)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "0.6vw",
            padding: "1.0vh 1.1vw",
            display: "flex",
            flexDirection: "column",
            gap: "0.5vh",
          }}>
            {data.map((d) => {
              const pct = (d.subs / maxSubs) * 100;
              return (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "0.6vw" }}>
                  <div style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.45)", minWidth: "2.4vw" }}>{d.label}</div>
                  <div style={{ flex: 1, height: "0.5vh", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "#6EC49A", borderRadius: "9999px" }} />
                  </div>
                  <div style={{ fontSize: "0.82vw", color: "#F4F4F4", minWidth: "3.2vw", textAlign: "right" }}>{d.subs.toLocaleString()}</div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginTop: "0.5vh" }}>ESCENARIOS AÑO 1</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6vh" }}>
            {scenarios.map((s) => (
              <div
                key={s.label}
                style={{
                  backgroundColor: s.highlight ? "rgba(110,196,154,0.10)" : "rgba(0,0,0,0.14)",
                  border: s.highlight ? "1px solid rgba(110,196,154,0.40)" : "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "0.6vw",
                  padding: "0.9vh 1.1vw",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "1.0vw", fontWeight: 700, color: s.highlight ? "#6EC49A" : "#F4F4F4" }}>{s.label}</div>
                  <div style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.45)" }}>{s.subs12} subs al M12</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#F4F4F4" }}>{s.ingAnual}</div>
                  <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#6EC49A" }}>{s.neto}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.1vw", color: "rgba(244,244,244,0.40)", lineHeight: 1.5 }}>
        ARPU neto blended $2.550/mes (60% mensual $4.990 · 40% anual $39.990 · desc. IVA 19% + comisión tienda 30%) ·
        Costos: fijos $3,9M + mkt ramp ($0,5M→$1,5M) + contenido ($1,2M→$1,5M) · Retorno estimado, no garantizado.
      </div>

    </div>
  );
}
