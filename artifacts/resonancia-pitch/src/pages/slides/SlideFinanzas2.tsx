export default function SlideFinanzas2() {
  // 300 subs nuevos/mes → 3.600 a M12 · blend 35/65 sin lifetime
  // M1: ARPU rec $2.506 · M2+: ARPU rec $3.238
  // Cursos M7+: neto $15.294/venta
  const ARPU_LAUNCH = 2506;
  const ARPU_NORMAL = 3238;
  const NETO_CURSO = 15294;

  const meses = [
    { label: "M1",  subs: 300,  launch: true,  costos: 4.31, cursos: 0   },
    { label: "M2",  subs: 600,  launch: false, costos: 4.31, cursos: 0   },
    { label: "M3",  subs: 900,  launch: false, costos: 4.81, cursos: 0   },
    { label: "M4",  subs: 1200, launch: false, costos: 4.81, cursos: 0   },
    { label: "M5",  subs: 1500, launch: false, costos: 4.81, cursos: 0   },
    { label: "M6",  subs: 1800, launch: false, costos: 4.81, cursos: 0   },
    { label: "M7",  subs: 2100, launch: false, costos: 7.21, cursos: 60  },
    { label: "M8",  subs: 2400, launch: false, costos: 7.21, cursos: 80  },
    { label: "M9",  subs: 2700, launch: false, costos: 8.16, cursos: 100 },
    { label: "M10", subs: 3000, launch: false, costos: 8.16, cursos: 110 },
    { label: "M11", subs: 3300, launch: false, costos: 8.41, cursos: 120 },
    { label: "M12", subs: 3600, launch: false, costos: 8.41, cursos: 130 },
  ];

  let cumulative = 0;
  const data = meses.map((m) => {
    const arpu      = m.launch ? ARPU_LAUNCH : ARPU_NORMAL;
    const ingresoRec = (m.subs * arpu) / 1_000_000;
    const ingresoUp  = (m.cursos * NETO_CURSO) / 1_000_000;
    const ingreso    = ingresoRec + ingresoUp;
    const neto       = ingreso - m.costos;
    cumulative      += neto;
    return { ...m, ingreso, ingresoUp, neto, cumulative: parseFloat(cumulative.toFixed(2)) };
  });

  const maxSubs  = 3600;
  const allCum   = data.map((d) => d.cumulative);
  const minCum   = Math.min(...allCum);
  const maxCum   = Math.max(...allCum);
  const cumRange = maxCum - minCum;
  const ZERO_PCT = (-minCum / cumRange) * 100;

  const scenarios = [
    { label: "Base",      subs12: "3.600",  cursos6m: "600",    ingTotal: "~$85M",  neto: "+$9M",   highlight: true  },
    { label: "Optimista", subs12: "4.500",  cursos6m: "~750",   ingTotal: "~$106M", neto: "+$30M",  highlight: false },
    { label: "Agresivo",  subs12: "6.000",  cursos6m: "~1.000", ingTotal: "~$141M", neto: "+$66M",  highlight: false },
    { label: "Churn 15%", subs12: "≈1.720", cursos6m: "600",    ingTotal: "~$55M",  neto: "−$20M",  highlight: false, negative: true },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 2 DE 3
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Caja acumulada y <span style={{ color: "#FFFFFF" }}>escenarios.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(244,244,244,0.50)", marginTop: "1vh" }}>
          Caja <strong style={{ color: "#FFFFFF" }}>acumulada desde M1</strong> (suma de los resultados mensuales de la hoja 1, no el resultado de cada mes) · <span style={{ color: "#BE9650" }}>dorado</span> = lanzamiento M1 · <span style={{ color: "#6EC49A" }}>verde</span> = normal M2+
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "3vw", minHeight: 0 }}>
        {/* Chart */}
        <div style={{ flex: 2, position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: `${ZERO_PCT}%`, height: "1px", backgroundColor: "rgba(255,255,255,0.30)", zIndex: 1 }} />
          <div style={{ position: "absolute", left: 0, top: `${ZERO_PCT}%`, transform: "translateY(-50%)", fontSize: "0.85vw", color: "rgba(255,255,255,0.40)", zIndex: 2 }}>$0</div>
          <div style={{ display: "flex", alignItems: "flex-end", height: "100%", gap: "0.4vw", paddingLeft: "2vw", position: "relative" }}>
            {data.map((d) => {
              const isNeg      = d.cumulative < 0;
              const heightPct  = (Math.abs(d.cumulative) / cumRange) * 100;
              const barColor   = isNeg ? "rgba(224,112,112,0.55)" : d.launch ? "rgba(190,150,80,0.65)" : "rgba(110,196,154,0.65)";
              const borderColor= isNeg ? "rgba(224,112,112,0.8)"  : d.launch ? "rgba(190,150,80,0.9)"  : "rgba(110,196,154,0.8)";
              return (
                <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", position: "relative", height: `${(Math.abs(d.cumulative) / cumRange) * 100}%` }}>
                    <div style={{
                      position: "absolute", bottom: isNeg ? "auto" : 0, top: isNeg ? 0 : "auto", left: 0, right: 0,
                      height: `${heightPct}%`, minHeight: "2px",
                      backgroundColor: barColor, border: `1px solid ${borderColor}`, borderRadius: "0.3vw 0.3vw 0 0",
                    }} />
                  </div>
                  <div style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.45)", marginTop: "0.5vh", textAlign: "center" }}>{d.label}</div>
                  <div style={{ fontSize: "0.78vw", fontWeight: 700, color: isNeg ? "rgba(224,112,112,0.9)" : d.launch ? "#BE9650" : "#6EC49A", textAlign: "center" }}>
                    {d.cumulative > 0 ? "+" : ""}{d.cumulative.toFixed(1)}M
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.9vh", minHeight: 0, overflow: "hidden" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em" }}>ESCENARIOS AÑO 1 · TOTALES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6vh" }}>
            {scenarios.map((s) => (
              <div key={s.label} style={{
                backgroundColor: s.highlight ? "rgba(110,196,154,0.08)" : "rgba(0,0,0,0.14)",
                border: s.highlight ? "1px solid rgba(110,196,154,0.40)" : "1px solid rgba(255,255,255,0.10)",
                borderRadius: "0.6vw", padding: "0.55vh 1.1vw",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: "1.1vw", fontWeight: 700, color: s.highlight ? "#6EC49A" : "#F4F4F4" }}>{s.label}</div>
                  <div style={{ fontSize: "0.8vw", color: "rgba(244,244,244,0.45)" }}>{s.subs12} subs · {s.cursos6m} cursos</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#F4F4F4" }}>{s.ingTotal}</div>
                  <div style={{ fontSize: "1.05vw", fontWeight: 700, color: (s as any).negative ? "rgba(224,112,112,0.9)" : "#6EC49A" }}>{s.neto} neto</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "auto" }}>
            <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "rgba(244,244,244,0.55)", letterSpacing: "0.08em", marginBottom: "0.6vh" }}>CURVA BASE · SUSCRIPTORES (+300/mes)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.22vh" }}>
              {data.map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                  <div style={{ fontSize: "0.68vw", color: "rgba(244,244,244,0.40)", minWidth: "2.2vw" }}>{d.label}</div>
                  <div style={{ flex: 1, height: "0.35vh", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{
                      width: `${(d.subs / maxSubs) * 100}%`, height: "100%",
                      backgroundColor: d.launch ? "rgba(190,150,80,0.70)" : d.cursos > 0 ? "rgba(110,196,154,0.80)" : "rgba(110,196,154,0.50)",
                      borderRadius: "9999px"
                    }} />
                  </div>
                  <div style={{ fontSize: "0.68vw", color: "#F4F4F4", minWidth: "3vw", textAlign: "right" }}>{d.subs.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "0.9vw", color: "rgba(244,244,244,0.40)", lineHeight: 1.4, marginTop: "1vh" }}>
        Base: 300 nuevos subs/mes · Blend 35/65% (sin lifetime) · ARPU rec. $3.238 normal · Cursos $15.294/venta (post-tallerista/prod 35%) ·
        Marketing escalonado (gasto fuerte desde M9) · Valle máximo ≈ −$8,8M (M4–M5), dentro del tramo mayor de $10M · Break-even operacional M6 · Recuperación caja M11 · "Churn 15%": 300 nuevos subs/mes con 15% de cancelación mensual (≈1.720 subs a M12), mismos costos · Escenarios ilustrativos, no garantizados.
      </div>
    </div>
  );
}
