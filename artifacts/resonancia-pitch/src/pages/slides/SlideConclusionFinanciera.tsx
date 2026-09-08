import {
  BASE_CASE,
  FINANCIAL_MONTHS,
  FINANCIAL_TOTALS,
  YEAR_ONE_SCENARIOS,
  formatMillions,
} from "../../data/financialModel";

export default function SlideConclusionFinanciera() {
  const month12 = FINANCIAL_MONTHS[11];
  const month12RevenueM = month12.recurringRevenueM + month12.courseRevenueM;
  const baseScenario = YEAR_ONE_SCENARIOS.find((scenario) => scenario.label === "Base")!;

  const fases = [
    {
      t: "ANTES DEL M1 · CONSTRUCCIÓN",
      d: "La ronda objetivo es cercana a $21M CLP. Financia el plan visible de inversión —contenido, marketing, runway reducido, externos, equipamiento y otros— con una escala progresiva de participación de hasta 20%.",
      tint: "rgba(224,112,112,0.9)",
    },
    {
      t: "M1+ · OPERACIÓN AUTOFINANCIADA",
       d: `El 30% de las 1.000 altas M1 paga Premium anual por adelantado: en caja real M1 entran ${formatMillions(FINANCIAL_MONTHS[0].subscriptionCashM)} de suscripciones contra ${formatMillions(FINANCIAL_MONTHS[0].cashExpensesM, 2)} de gastos incurridos (incluido marketing financiado por ronda). El primer equilibrio operacional es M${BASE_CASE.firstPositiveMonth}; Premium Plus inicia M3.`,
      tint: "#D6A45C",
    },
    {
      t: "AÑO 1 · RESULTADO",
      d: `El año cierra con ${formatMillions(FINANCIAL_TOTALS.netResultM, 1, true)} netos en la vista conservadora, y M12 factura ${formatMillions(month12RevenueM)} contra ${formatMillions(month12.totalOperatingCostM, 2)} de costos.`,
      tint: "#6EC49A",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{
        background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)",
        color: "#F4F4F4",
        padding: "7vh 6vw",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
        ANEXO FINANCIERO · CONCLUSIÓN
      </div>
      <div style={{ fontSize: "3.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: "62vw" }}>
        La ronda construye y lanza la app: <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>los prepagos sostienen la caja.</span>
      </div>

      {/* Fases */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "4.2vh" }}>
        {fases.map((f) => (
          <div
            key={f.t}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.14)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderTop: `3px solid ${f.tint}`,
              borderRadius: "0.7vw",
              padding: "2.4vh 1.5vw",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: "0.95vw", fontWeight: 700, color: f.tint, letterSpacing: "0.10em", marginBottom: "1.2vh" }}>{f.t}</div>
            <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.60)", lineHeight: 1.6 }}>{f.d}</div>
          </div>
        ))}
      </div>

      {/* Lectura de los dos escenarios */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "3vh" }}>
        <div style={{ flex: 1, backgroundColor: "rgba(110,196,154,0.07)", border: "1px solid rgba(110,196,154,0.30)", borderRadius: "0.7vw", padding: "2.2vh 1.6vw" }}>
           <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#6EC49A", letterSpacing: "0.10em", marginBottom: "0.9vh" }}>CASO BASE (CHURN 15%)</div>
          <div style={{ fontSize: "1.1vw", color: "rgba(244,244,244,0.65)", lineHeight: 1.6 }}>
             El año 1 cierra con <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{formatMillions(FINANCIAL_TOTALS.netResultM, 1, true)} netos</span>, 4.400 activos y {baseScenario.registrations} registros acumulados. En P&amp;L el anual se reconoce mes a mes; caja recibe el prepago.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.14)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: "0.7vw", padding: "2.2vh 1.6vw" }}>
           <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "rgba(244,244,244,0.55)", letterSpacing: "0.10em", marginBottom: "0.9vh" }}>CAJA Y PREPAGOS</div>
          <div style={{ fontSize: "1.1vw", color: "rgba(244,244,244,0.65)", lineHeight: 1.6 }}>
             Los prepagos anuales suman <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{formatMillions(FINANCIAL_TOTALS.annualPrepaidCashM)}</span> de caja de suscripción durante el año. En M12 la operación mantiene <span style={{ color: "#6EC49A", fontWeight: 700 }}>margen mensual positivo</span>; retención y mix anual siguen siendo los controles principales.
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", fontSize: "0.85vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.45 }}>
         Lectura: caja real acumulada (hoja 2), CAC sobre altas pagadas, recuperación P&amp;L M{BASE_CASE.cumulativeRecoveryMonth} y churn mensual 15% solo para mensualidades.
        El rol de la ronda es construir y lanzar el producto; la operación se sostiene con los prepagos anuales desde el mes 1. Cifras en CLP.
      </div>
    </div>
  );
}
