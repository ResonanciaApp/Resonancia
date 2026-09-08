import { BLENDED_CAC, MONTHLY_CHURN, MONTHLY_COHORT_ARPU } from "../../data/financialModel";

export default function SlideRetencion() {
  const cac = BLENDED_CAC;
  const ltv15 = MONTHLY_COHORT_ARPU / MONTHLY_CHURN;
  const ltv20 = MONTHLY_COHORT_ARPU / 0.20;
  const scenarios = [
    {
       t: "CASO BASE ACTIVO",
      churn: "15% mensual",
       subs: "4.400",
       ltv: `≈ $${Math.round(ltv15).toLocaleString("es-CL")}`,
       ratio: `≈ ${(ltv15 / cac).toFixed(1).replace(".", ",")}x`,
       note: "Las cohortes mensuales retienen 85% mensual; las anuales se mantienen activas durante su término pagado.",
      highlight: true,
    },
    {
      t: "CHURN EXIGENTE",
      churn: "20% mensual",
       subs: "Sensibilidad",
       ltv: `≈ $${Math.round(ltv20).toLocaleString("es-CL")}`,
       ratio: `≈ ${(ltv20 / cac).toFixed(1).replace(".", ",")}x`,
       note: "Con el mismo ARPU, una vida media menor reduce directamente el LTV.",
      highlight: false,
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
      <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
        ANEXO FINANCIERO · RETENCIÓN
      </div>
      <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
        ¿Y si los usuarios cancelan? <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>El modelo igual se sostiene.</span>
      </div>
      <div style={{ fontSize: "1.15vw", color: "rgba(244,244,244,0.55)", marginTop: "1.6vh", lineHeight: 1.5, maxWidth: "58vw" }}>
         El caso base ya incorpora churn mensual de 15%. Aquí se muestra su economía unitaria y una sensibilidad más exigente.
      </div>

      {/* Scenario cards */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "4vh" }}>
        {scenarios.map((s) => (
          <div
            key={s.t}
            style={{
              flex: 1,
              backgroundColor: s.highlight ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.14)",
              border: s.highlight ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(255,255,255,0.10)",
              borderRadius: "0.7vw",
              padding: "2.6vh 1.5vw",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", letterSpacing: "0.10em", marginBottom: "0.8vh" }}>{s.t}</div>
            <div style={{ fontSize: "2.0vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1, marginBottom: "2vh" }}>{s.churn}</div>

            {[
              ["Suscriptores a M12", s.subs],
               ["LTV mensual por suscriptor", s.ltv],
              ["LTV / CAC", s.ratio],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.9vh" }}>
                <span style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.48)" }}>{k}</span>
                <span style={{ fontSize: "1.25vw", fontWeight: 700, color: "#F4F4F4" }}>{v}</span>
              </div>
            ))}

            <div style={{ marginTop: "auto", paddingTop: "1.4vh", fontSize: "0.90vw", color: "rgba(244,244,244,0.42)", lineHeight: 1.5 }}>
              {s.note}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", fontSize: "0.85vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.45 }}>
         Activos M12 = cohortes anuales vigentes + cohortes mensuales sobrevivientes; registros acumulados y activos no son equivalentes. LTV de cohorte mensual = ARPU neto mensual $${Math.round(MONTHLY_COHORT_ARPU).toLocaleString("es-CL")} ÷ churn · LTV/CAC usa el mismo CAC de marketing total ÷ altas pagadas. No se proyecta churn/LTV anual: el contrato se retiene durante su término pagado.
      </div>
    </div>
  );
}
