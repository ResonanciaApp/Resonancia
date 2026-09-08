import { FINANCIAL_MONTHS, FINANCIAL_TOTALS, PHASE_ARPU, formatMillions } from "../../data/financialModel";

export default function SlideFinanzas1() {
  const rows = FINANCIAL_MONTHS.map((month) => ({
    mes: month.label,
    altas: Math.round(month.grossAdditions).toLocaleString("es-CL"),
    registros: Math.round(month.cumulativeRegistrations).toLocaleString("es-CL"),
    subs: Math.round(month.activeSubscribers).toLocaleString("es-CL"),
    fase: month.phase,
    ingTotal: formatMillions(month.recurringRevenueM),
    upsell: month.courseRevenueM > 0 ? formatMillions(month.courseRevenueM, 1, true) : "—",
    costos: formatMillions(month.nonMarketingCostM, 2),
    mkt: month.roundFundedMarketingM + month.operatingMarketingM > 0
      ? formatMillions(month.roundFundedMarketingM + month.operatingMarketingM)
      : "$0",
    resultado: formatMillions(month.netResultM, 1, true),
    neg: month.netResultM < 0,
  }));

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "3.5vh 5.5vw 3vh", boxSizing: "border-box", gap: "1.2vh" }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.2vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.4vh" }}>
          ANEXO FINANCIERO · HOJA 1 DE 3
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
           Estado de resultados <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>post-lanzamiento.</span>
        </div>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.50)", marginTop: "0.4vh" }}>
           P&amp;L en millones de CLP · altas brutas, registros acumulados y suscriptores activos (churn mensual 15%)
        </div>
      </div>

      {/* Phase legend */}
      <div style={{ display: "flex", gap: "1vw", flexShrink: 0 }}>
        <div style={{ flex: 1, backgroundColor: "rgba(214,164,92,0.09)", border: "1px solid rgba(214,164,92,0.30)", borderRadius: "0.5vw", padding: "0.55vh 1.1vw", display: "flex", alignItems: "baseline", gap: "0.8vw", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82vw", fontWeight: 700, backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "0.09em", flexShrink: 0 }}>LANZAMIENTO M1</span>
           <span style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.50)" }}>Solo Premium · 70/30% · $1.990 / $19.990 · ARPU ${Math.round(PHASE_ARPU.launch).toLocaleString("es-CL")}</span>
        </div>
        <div style={{ flex: 1, backgroundColor: "rgba(110,196,154,0.06)", border: "1px solid rgba(110,196,154,0.25)", borderRadius: "0.5vw", padding: "0.55vh 1.1vw", display: "flex", alignItems: "baseline", gap: "0.8vw", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82vw", fontWeight: 700, color: "#6EC49A", letterSpacing: "0.09em", flexShrink: 0 }}>NORMAL M2+</span>
           <span style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.50)" }}>M2 Premium $4.990/$39.990 · M3+ incluye Plus · Cursos desde M7</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{
          display: "grid",
           gridTemplateColumns: "1.05fr .55fr .7fr .65fr .48fr .72fr .5fr .62fr .65fr .72fr",
          padding: "0.7vh 0.9vw",
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          marginBottom: "0.3vh",
        }}>
            {["Período", "Altas", "Registros", "Activos", "Fase", "Ing. rec.", "Cursos", "Otros costos", "Mkt. P&L", "Resultado"].map((h) => (
            <div key={h} style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.05em" }}>{h}</div>
          ))}
        </div>

        {rows.map((r, i) => (
          <div key={r.mes} style={{
            display: "grid",
             gridTemplateColumns: "1.05fr .55fr .7fr .65fr .48fr .72fr .5fr .62fr .65fr .72fr",
            padding: "0.42vh 0.9vw",
            backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
            borderRadius: "0.4vw",
            alignItems: "center",
            border: r.neg ? "1px solid rgba(224,112,112,0.10)" : "none",
          }}>
            <div style={{ fontSize: "0.98vw", fontWeight: 700, color: "#F4F4F4" }}>{r.mes}</div>
            <div style={{ fontSize: "0.88vw", color: "#F4F4F4" }}>{r.altas}</div>
            <div style={{ fontSize: "0.88vw", color: "rgba(244,244,244,0.6)" }}>{r.registros}</div>
            <div style={{ fontSize: "0.98vw", color: "#F4F4F4" }}>{r.subs}</div>
            <div style={{ fontSize: "0.68vw", fontWeight: 700, color: r.fase === "lanzamiento" ? "#D6A45C" : "#6EC49A", letterSpacing: "0.05em", textTransform: "uppercase" }}>
               {r.fase === "lanzamiento" ? "Lanz." : r.fase === "premium" ? "Prem." : "P +"}
            </div>
            <div style={{ fontSize: "0.98vw", color: "#F4F4F4" }}>{r.ingTotal}</div>
            <div style={{ fontSize: "0.95vw", color: r.upsell === "—" ? "rgba(244,244,244,0.28)" : "#6EC49A", fontWeight: r.upsell === "—" ? 400 : 700 }}>{r.upsell}</div>
            <div style={{ fontSize: "0.98vw", color: "rgba(244,244,244,0.50)" }}>{r.costos}</div>
            <div style={{ fontSize: "0.95vw", color: r.mkt === "—" || r.mkt === "$0" ? "rgba(244,244,244,0.28)" : "#D6A45C", fontWeight: r.mkt === "—" || r.mkt === "$0" ? 400 : 700 }}>{r.mkt}</div>
            <div style={{ fontSize: "1.05vw", fontWeight: 700, color: r.neg ? "#F4F4F4" : "#6EC49A" }}>{r.resultado}</div>
          </div>
        ))}

        {/* Totales */}
        <div style={{
          display: "grid",
           gridTemplateColumns: "1.05fr .55fr .7fr .65fr .48fr .72fr .5fr .62fr .65fr .72fr",
          padding: "1.0vh 0.9vw",
          borderTop: "1px solid rgba(255,255,255,0.35)",
          marginTop: "0.5vh",
          backgroundColor: "rgba(0,0,0,0.14)",
          borderRadius: "0.5vw",
        }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FFFFFF" }}>AÑO 1 TOTAL</div>
           <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#F4F4F4" }}>{Math.round(FINANCIAL_TOTALS.grossAdditions).toLocaleString("es-CL")}</div>
           <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#F4F4F4" }}>{Math.round(FINANCIAL_TOTALS.cumulativeRegistrations).toLocaleString("es-CL")}</div>
           <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#F4F4F4" }}>4.400</div>
          <div />
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4F4F4" }}>{formatMillions(FINANCIAL_TOTALS.recurringRevenueM)}</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#6EC49A" }}>{formatMillions(FINANCIAL_TOTALS.courseRevenueM)}</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>{formatMillions(FINANCIAL_TOTALS.nonMarketingCostM)}</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{formatMillions(FINANCIAL_TOTALS.marketingExpenseM)}</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#6EC49A" }}>{formatMillions(FINANCIAL_TOTALS.netResultM, 1, true)} neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ flexShrink: 0, fontSize: "0.88vw", color: "rgba(244,244,244,0.42)", lineHeight: 1.45 }}>
         Reconciliación año 1: ingresos {formatMillions(FINANCIAL_TOTALS.recurringRevenueM + FINANCIAL_TOTALS.courseRevenueM)} − otros costos {formatMillions(FINANCIAL_TOTALS.nonMarketingCostM)} − marketing P&amp;L {formatMillions(FINANCIAL_TOTALS.marketingExpenseM)} = neto {formatMillions(FINANCIAL_TOTALS.netResultM, 1, true)}. Incluye $2,0M post-lanzamiento financiado por ronda + $9,6M operativo.
      </div>
    </div>
  );
}
