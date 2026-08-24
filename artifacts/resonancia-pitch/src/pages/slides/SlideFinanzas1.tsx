import { FINANCIAL_MONTHS, FINANCIAL_TOTALS, formatMillions } from "../../data/financialModel";

export default function SlideFinanzas1() {
  // 300 subs nuevos/mes → 3.600 a M12
  // Blend 35/65 sin lifetime
  // M1: ARPU rec $2.506 · M2+: ARPU rec $3.238
  // Cursos M7+: $15.294/venta (post-tienda, post-tallerista/prod 35%)

  const rows = FINANCIAL_MONTHS.map((month) => ({
    mes: month.label,
    subs: month.subscribers.toLocaleString("es-CL"),
    fase: month.phase,
    ingTotal: formatMillions(month.recurringRevenueM),
    upsell: month.courseRevenueM > 0 ? formatMillions(month.courseRevenueM, 1, true) : "—",
    costos: formatMillions(month.nonMarketingCostM, 2),
    mkt: month.roundFundedMarketingM > 0
      ? "Ronda"
      : month.operatingMarketingM > 0
        ? formatMillions(month.operatingMarketingM)
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
          Flujo de caja <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>post-lanzamiento.</span>
        </div>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.50)", marginTop: "0.4vh" }}>
          En millones de CLP · 300 suscriptores nuevos/mes · 3.600 al cierre · Ingresos = recurrente + up-sells
        </div>
      </div>

      {/* Phase legend */}
      <div style={{ display: "flex", gap: "1vw", flexShrink: 0 }}>
        <div style={{ flex: 1, backgroundColor: "rgba(214,164,92,0.09)", border: "1px solid rgba(214,164,92,0.30)", borderRadius: "0.5vw", padding: "0.55vh 1.1vw", display: "flex", alignItems: "baseline", gap: "0.8vw", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82vw", fontWeight: 700, backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "0.09em", flexShrink: 0 }}>LANZAMIENTO M1</span>
          <span style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.50)" }}>ARPU rec. $2.506/sub · precios $5.990 / $39.990</span>
        </div>
        <div style={{ flex: 1, backgroundColor: "rgba(110,196,154,0.06)", border: "1px solid rgba(110,196,154,0.25)", borderRadius: "0.5vw", padding: "0.55vh 1.1vw", display: "flex", alignItems: "baseline", gap: "0.8vw", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82vw", fontWeight: 700, color: "#6EC49A", letterSpacing: "0.09em", flexShrink: 0 }}>NORMAL M2+</span>
          <span style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.50)" }}>ARPU rec. $3.238/sub · precios $7.990 / $49.990 · Cursos desde M7</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.7fr 0.42fr 0.8fr 0.62fr 0.7fr 0.72fr 0.8fr",
          padding: "0.7vh 0.9vw",
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          marginBottom: "0.3vh",
        }}>
          {["Período", "Suscriptores", "Fase", "Ing. totales", "Cursos", "Costos", "Marketing", "Resultado"].map((h) => (
            <div key={h} style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.05em" }}>{h}</div>
          ))}
        </div>

        {rows.map((r, i) => (
          <div key={r.mes} style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.7fr 0.42fr 0.8fr 0.62fr 0.7fr 0.72fr 0.8fr",
            padding: "0.42vh 0.9vw",
            backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
            borderRadius: "0.4vw",
            alignItems: "center",
            border: r.neg ? "1px solid rgba(224,112,112,0.10)" : "none",
          }}>
            <div style={{ fontSize: "0.98vw", fontWeight: 700, color: "#F4F4F4" }}>{r.mes}</div>
            <div style={{ fontSize: "0.98vw", color: "#F4F4F4" }}>{r.subs}</div>
            <div style={{ fontSize: "0.68vw", fontWeight: 700, color: r.fase === "lanzamiento" ? "#D6A45C" : "#6EC49A", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {r.fase === "lanzamiento" ? "Lanz." : "Normal"}
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
          gridTemplateColumns: "1.15fr 0.7fr 0.42fr 0.8fr 0.62fr 0.7fr 0.72fr 0.8fr",
          padding: "1.0vh 0.9vw",
          borderTop: "1px solid rgba(255,255,255,0.35)",
          marginTop: "0.5vh",
          backgroundColor: "rgba(0,0,0,0.14)",
          borderRadius: "0.5vw",
        }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FFFFFF" }}>AÑO 1 TOTAL</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4F4F4" }}>3.600 cierre</div>
          <div />
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4F4F4" }}>{formatMillions(FINANCIAL_TOTALS.recurringRevenueM)}</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#6EC49A" }}>{formatMillions(FINANCIAL_TOTALS.courseRevenueM)}</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>{formatMillions(FINANCIAL_TOTALS.nonMarketingCostM)}</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{formatMillions(FINANCIAL_TOTALS.operatingMarketingM)}</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#6EC49A" }}>{formatMillions(FINANCIAL_TOTALS.netResultM, 1, true)} neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ flexShrink: 0, fontSize: "0.88vw", color: "rgba(244,244,244,0.42)", lineHeight: 1.45 }}>
        Blend 35/65% (sin lifetime) · 300 nuevos suscriptores/mes · Marketing escalonado: el gasto fuerte parte en M9, cuando la operación ya es rentable ·
        Primer mes en equilibrio M4 · Recuperación de caja acumulada M6 · $75,5M suscripciones + $9,2M cursos = $84,7M · Operación $36,4M + marketing operativo $9,6M = $46,0M · Neto +$38,8M · Marketing M1–M3 financiado con la ronda ($1M + $1M + $0,5M, marcado “Ronda” y excluido del resultado) ·
        Vista conservadora: el plan anual (65%) se reconoce mes a mes; en caja real ese ingreso entra por adelantado.
      </div>
    </div>
  );
}
