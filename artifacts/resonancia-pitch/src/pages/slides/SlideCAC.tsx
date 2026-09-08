import { BLENDED_CAC, CAC_MARKETING_M, FINANCIAL_TOTALS, MONTHLY_COHORT_ARPU, PAYBACK_MONTHS, formatMillions } from "../../data/financialModel";

export default function SlideCAC() {
  const totalMarketingM = CAC_MARKETING_M;
  const blendedCac = BLENDED_CAC;
  const paybackMonths = PAYBACK_MONTHS;

  const drivers = [
    {
      t: "Comunidad propia",
      d: "+839.000 seguidores activos en redes: distribución orgánica con costo de adquisición casi nulo",
    },
    {
      t: "Nicho de alta intención",
      d: "Pauta segmentada a audiencia wellness/meditación en Chile: menos competencia y mejor conversión que categorías masivas",
    },
    {
      t: "Contenido que se comparte",
      d: "Sesiones, encuentros en vivo y artistas (Resonadores) generan alcance orgánico que baja el CAC blended mes a mes",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{
        background: "linear-gradient(160deg, #10242B 0%, #142735 34%, #17243A 68%, #1A1F38 100%)",
        color: "#F4F4F4",
        padding: "7vh 6vw",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
        ANEXO FINANCIERO · COSTO POR ADQUISICIÓN
      </div>
      <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
         Cada alta se paga <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>en ~{paybackMonths.toFixed(1).replace(".", ",")} meses.</span>
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "4.5vh" }}>
        {[
           { k: "CAC BLENDED AÑO 1", v: `≈ $${(Math.round(blendedCac / 10) * 10).toLocaleString("es-CL")}`, s: "por alta pagada (numerador: marketing total)" },
          { k: "INVERSIÓN EN MARKETING AÑO 1", v: `≈ ${formatMillions(totalMarketingM)}`, s: "pre-lanzamiento + ramp-up M1–M12" },
           { k: "ALTAS PAGADAS AÑO 1", v: Math.round(FINANCIAL_TOTALS.grossAdditions).toLocaleString("es-CL"), s: `${Math.round(FINANCIAL_TOTALS.cumulativeRegistrations).toLocaleString("es-CL")} signups pagados acumulados; 4.400 activos M12` },
           { k: "PAYBACK DEL CAC", v: `${paybackMonths.toFixed(1).replace(".", ",")} meses`, s: `CAC ÷ ARPU neto cohorte mensual $${Math.round(MONTHLY_COHORT_ARPU).toLocaleString("es-CL")}/mes` },
        ].map((c) => (
          <div
            key={c.k}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.14)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "0.7vw",
              padding: "2.6vh 1.4vw",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", letterSpacing: "0.10em", marginBottom: "1.2vh" }}>{c.k}</div>
            <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>{c.v}</div>
            <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.48)", marginTop: "1vh", lineHeight: 1.4 }}>{c.s}</div>
          </div>
        ))}
      </div>

      {/* Why CAC stays low */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "3.5vh" }}>
        {drivers.map((d) => (
          <div key={d.t} style={{ flex: 1 }}>
            <div style={{ fontSize: "1.35vw", fontWeight: 700, color: "#F4F4F4", marginBottom: "0.8vh" }}>{d.t}</div>
            <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.55 }}>{d.d}</div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div style={{ marginTop: "auto", fontSize: "0.85vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.45 }}>
         CAC blended = marketing total de adquisición $12,6M (pre-lanzamiento $1M + P&amp;L año 1 $11,6M) ÷ altas pagadas año 1; no usa descargas genéricas. Payback sobre ARPU neto de cohorte mensual (IVA 19% y comisión tienda 30% descontados). Cifras en CLP.
      </div>
    </div>
  );
}
