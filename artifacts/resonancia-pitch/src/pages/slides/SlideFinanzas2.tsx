export default function SlideFinanzas2() {
  // Curva base: +400/mes; M11=4.400, M12=5.000 (+600 último mes)
  // ARPU neto blended $3.750/mes (45% mensual $8.990 · 55% anual $49.990)
  // Up-sells (cursos): M7+ neto $23.529/curso; curva M7=60 M8=80 M9=100 M10=110 M11=120 M12=130
  const ARPU = 3750;
  const NETO_CURSO = 23529;
  const COLCHON = 0.6;

  const meses = [
    { label: "M1",  subs: 400,  costos: 3.90, cursos: 0   },
    { label: "M2",  subs: 800,  costos: 3.90, cursos: 0   },
    { label: "M3",  subs: 1200, costos: 5.60, cursos: 0   },
    { label: "M4",  subs: 1600, costos: 5.60, cursos: 0   },
    { label: "M5",  subs: 2000, costos: 5.60, cursos: 0   },
    { label: "M6",  subs: 2400, costos: 5.60, cursos: 0   },
    { label: "M7",  subs: 2800, costos: 6.40, cursos: 60  },
    { label: "M8",  subs: 3200, costos: 6.40, cursos: 80  },
    { label: "M9",  subs: 3600, costos: 6.65, cursos: 100 },
    { label: "M10", subs: 4000, costos: 6.65, cursos: 110 },
    { label: "M11", subs: 4400, costos: 6.90, cursos: 120 },
    { label: "M12", subs: 5000, costos: 6.90, cursos: 130 },
  ];

  let cumulative = COLCHON;
  const data = meses.map((m) => {
    const ingresoSubs = (m.subs * ARPU) / 1_000_000;
    const ingresoUp   = (m.cursos * NETO_CURSO) / 1_000_000;
    const ingreso     = ingresoSubs + ingresoUp;
    const neto        = ingreso - m.costos;
    cumulative       += neto;
    return { ...m, ingreso, ingresoUp, neto, cumulative: parseFloat(cumulative.toFixed(2)) };
  });

  const maxSubs  = 5000;
  const allCum   = data.map((d) => d.cumulative);
  const minCum   = Math.min(...allCum);
  const maxCum   = Math.max(...allCum);
  const cumRange = maxCum - minCum;
  const ZERO_PCT = (-minCum / cumRange) * 100;

  // Escenarios: up-sells escalan proporcionalmente a suscriptores
  const scenarios = [
    { label: "Base",      subs12: "5.000",  cursos6m: "600",    ingSubs: "~$118M", ingCursos: "~$14M", total: "~$132M", neto: "+$62M",  highlight: true  },
    { label: "Optimista", subs12: "7.000",  cursos6m: "~840",   ingSubs: "~$165M", ingCursos: "~$20M", total: "~$185M", neto: "+$105M", highlight: false },
    { label: "Agresivo",  subs12: "10.000", cursos6m: "~1.200", ingSubs: "~$236M", ingCursos: "~$28M", total: "~$264M", neto: "+$174M", highlight: false },
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
          <span style={{ color: "#FFFFFF" }}>escenarios.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(244,244,244,0.50)", marginTop: "1vh" }}>
          En millones de CLP · suscripciones + cursos · eje Y = caja neta acumulada
        </div>
      </div>

      {/* Chart area */}
      <div style={{ flex: 1, display: "flex", gap: "3vw", minHeight: 0 }}>

        {/* Chart */}
        <div style={{ flex: 2, position: "relative", display: "flex", flexDirection: "column" }}>
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

          <div style={{
            display: "flex",
            alignItems: "flex-end",
            height: "100%",
            gap: "0.4vw",
            paddingLeft: "2vw",
            position: "relative",
          }}>
            {data.map((d) => {
              const heightPct = (Math.abs(d.cumulative) / cumRange) * 100;
              const isNeg = d.cumulative < 0;
              const hasUp = d.ingresoUp > 0;
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
                      backgroundColor: isNeg ? "rgba(224,112,112,0.55)" : hasUp ? "rgba(110,196,154,0.70)" : "rgba(110,196,154,0.50)",
                      border: `1px solid ${isNeg ? "rgba(224,112,112,0.8)" : "rgba(110,196,154,0.8)"}`,
                      borderRadius: "0.3vw 0.3vw 0 0",
                    }} />
                  </div>
                  <div style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.45)", marginTop: "0.5vh", textAlign: "center" }}>{d.label}</div>
                  <div style={{ fontSize: "0.78vw", fontWeight: 700, color: isNeg ? "rgba(224,112,112,0.9)" : "#6EC49A", textAlign: "center" }}>
                    {d.cumulative > 0 ? "+" : ""}{d.cumulative.toFixed(1)}M
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.2vh" }}>

          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em" }}>ESCENARIOS AÑO 1 · INGRESOS TOTALES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8vh" }}>
            {scenarios.map((s) => (
              <div
                key={s.label}
                style={{
                  backgroundColor: s.highlight ? "rgba(110,196,154,0.08)" : "rgba(0,0,0,0.14)",
                  border: s.highlight ? "1px solid rgba(110,196,154,0.40)" : "1px solid rgba(255,255,255,0.10)",
                  borderRadius: "0.6vw",
                  padding: "1.0vh 1.1vw",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6vh" }}>
                  <div>
                    <div style={{ fontSize: "1.1vw", fontWeight: 700, color: s.highlight ? "#6EC49A" : "#F4F4F4" }}>{s.label}</div>
                    <div style={{ fontSize: "0.8vw", color: "rgba(244,244,244,0.45)" }}>{s.subs12} subs · {s.cursos6m} cursos</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.7vw", fontWeight: 700, color: "#F4F4F4" }}>{s.total}</div>
                    <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#6EC49A" }}>{s.neto} neto</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5vw" }}>
                  {[
                    { label: "Suscripciones", val: s.ingSubs },
                    { label: "Cursos", val: s.ingCursos },
                  ].map((item) => (
                    <div key={item.label} style={{
                      flex: 1,
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: "0.3vw",
                      padding: "0.4vh 0.6vw",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <span style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.45)" }}>{item.label}</span>
                      <span style={{ fontSize: "0.85vw", fontWeight: 700, color: "#F4F4F4" }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mini curva */}
          <div style={{ marginTop: "auto" }}>
            <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "rgba(244,244,244,0.55)", letterSpacing: "0.08em", marginBottom: "0.6vh" }}>CURVA BASE · SUSCRIPTORES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35vh" }}>
              {data.map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                  <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.40)", minWidth: "2.2vw" }}>{d.label}</div>
                  <div style={{ flex: 1, height: "0.45vh", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ width: `${(d.subs / maxSubs) * 100}%`, height: "100%", backgroundColor: d.cursos > 0 ? "rgba(110,196,154,0.75)" : "rgba(110,196,154,0.45)", borderRadius: "9999px" }} />
                  </div>
                  <div style={{ fontSize: "0.75vw", color: "#F4F4F4", minWidth: "3vw", textAlign: "right" }}>{d.subs.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "0.72vw", color: "rgba(110,196,154,0.6)", marginTop: "0.5vh" }}>■ verde intenso = mes con cursos activos (M7+)</div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.40)", lineHeight: 1.5 }}>
        ARPU subs $3.750/mes (45% mensual $8.990 · 55% anual $49.990 · desc. IVA 19% + Apple/Google 30%) ·
        Cursos neto $23.529/venta · Escenario optimista/agresivo escala cursos proporcionalmente a suscriptores · Retorno estimado, no garantizado.
      </div>

    </div>
  );
}
