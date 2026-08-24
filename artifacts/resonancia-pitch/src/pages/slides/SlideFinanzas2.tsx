import {
  BASE_CASE,
  FINANCIAL_MONTHS,
  YEAR_ONE_SCENARIOS,
  formatMillions,
} from "../../data/financialModel";

export default function SlideFinanzas2() {
  const data = FINANCIAL_MONTHS.map((month) => ({
    label: month.shortLabel,
    subs: month.subscribers,
    launch: month.phase === "lanzamiento",
    cursos: month.courseUnits,
    cumulative: month.cumulativeResultM,
  }));

  const maxSubs  = 3600;
  const allCum   = data.map((d) => d.cumulative);
  const minCum   = Math.min(...allCum);
  const maxCum   = Math.max(...allCum);
  const cumRange = maxCum - minCum;
  const PLOT_HEIGHT_PCT = 82;
  const ZERO_PCT = (maxCum / cumRange) * PLOT_HEIGHT_PCT;

  const scenarios = YEAR_ONE_SCENARIOS.map((scenario) => ({
    ...scenario,
    ingTotal: `≈${formatMillions(scenario.revenueM)}`,
    neto: formatMillions(scenario.netM, 1, true),
  }));

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
          Caja acumulada y <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>escenarios.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(244,244,244,0.50)", marginTop: "1vh" }}>
          Caja <strong style={{ color: "#FFFFFF" }}>acumulada desde M1</strong> (suma de los resultados mensuales de la hoja 1, no el resultado de cada mes) · <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>dorado</span> = lanzamiento M1 · <span style={{ color: "#6EC49A" }}>verde</span> = normal M2+
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", gap: "3vw", minHeight: 0 }}>
        {/* Chart */}
        <div style={{ flex: 2, position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: `${ZERO_PCT}%`, height: "1px", backgroundColor: "rgba(255,255,255,0.30)", zIndex: 1 }} />
          <div style={{ position: "absolute", left: 0, top: `${ZERO_PCT}%`, transform: "translateY(-50%)", fontSize: "0.85vw", color: "rgba(255,255,255,0.40)", zIndex: 2 }}>$0</div>
          <div style={{ display: "flex", height: "100%", gap: "0.4vw", paddingLeft: "2vw", position: "relative" }}>
            {data.map((d) => {
              const isNeg      = d.cumulative < 0;
              const heightPct  = (Math.abs(d.cumulative) / cumRange) * PLOT_HEIGHT_PCT;
              const barColor   = isNeg ? "rgba(224,112,112,0.55)" : d.launch ? "rgba(214,164,92,0.65)" : "rgba(110,196,154,0.65)";
              const borderColor= isNeg ? "rgba(224,112,112,0.8)"  : d.launch ? "rgba(214,164,92,0.9)"  : "rgba(110,196,154,0.8)";
              return (
                <div key={d.label} style={{ flex: 1, position: "relative", height: "100%" }}>
                  <div style={{
                    position: "absolute",
                    top: `${isNeg ? ZERO_PCT : ZERO_PCT - heightPct}%`,
                    left: 0,
                    right: 0,
                    height: `${heightPct}%`,
                    minHeight: "2px",
                    backgroundColor: barColor,
                    border: `1px solid ${borderColor}`,
                    borderRadius: isNeg ? "0 0 0.3vw 0.3vw" : "0.3vw 0.3vw 0 0",
                  }} />
                  <div style={{ position: "absolute", bottom: "1.7vh", left: 0, right: 0, fontSize: "0.82vw", color: "rgba(244,244,244,0.45)", textAlign: "center" }}>{d.label}</div>
                  <div style={{ position: "absolute", bottom: "0", left: 0, right: 0, fontSize: "0.78vw", fontWeight: 700, color: isNeg ? "rgba(224,112,112,0.9)" : d.launch ? "#D6A45C" : "#6EC49A", textAlign: "center" }}>
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
                  <div style={{ fontSize: "1.05vw", fontWeight: 700, color: s.negative ? "rgba(224,112,112,0.9)" : "#6EC49A" }}>{s.neto} neto</div>
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
                      backgroundColor: d.launch ? "rgba(214,164,92,0.70)" : d.cursos > 0 ? "rgba(110,196,154,0.80)" : "rgba(110,196,154,0.50)",
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
        Marketing operativo escalonado desde M7 · Valle conservador ≈ {formatMillions(BASE_CASE.conservativeValleyM)} en M5 · Primer mes en equilibrio M{BASE_CASE.firstPositiveMonth} · Recuperación de caja acumulada M{BASE_CASE.cumulativeRecoveryMonth} · El marketing de lanzamiento M1–M3 ($2,5M) está financiado por la ronda y fuera de esta curva · "Churn 15%": 300 nuevos subs/mes con 15% de cancelación mensual (≈1.720 subs a M12), mismos costos · Escenarios ilustrativos, no garantizados.
      </div>
    </div>
  );
}
