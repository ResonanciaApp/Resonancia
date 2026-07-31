export default function SlideRetencion() {
  // 300 subs nuevos/mes · subs M12 = 300·(1-(1-c)^12)/c
  // c=15%: ≈1.720 · c=20%: ≈1.400
  // LTV = ARPU $3.238 / churn → 15%: ≈$21.600 · 20%: ≈$16.200
  const scenarios = [
    {
      t: "CASO BASE ACTUAL",
      churn: "0% de churn",
      subs: "3.600",
      ltv: "—",
      ratio: "—",
      note: "Supuesto optimista: nadie cancela. Es el escenario de las proyecciones anteriores.",
      highlight: false,
    },
    {
      t: "CHURN REALISTA",
      churn: "15% mensual",
      subs: "≈ 1.720",
      ltv: "≈ $21.600",
      ratio: "≈ 6,0x",
      note: "Escenario realista para una app nueva de suscripción: retención mensual del 85%.",
      highlight: true,
    },
    {
      t: "CHURN EXIGENTE",
      churn: "20% mensual",
      subs: "≈ 1.400",
      ltv: "≈ $16.200",
      ratio: "≈ 4,5x",
      note: "Escenario de estrés: aun perdiendo 1 de cada 5 suscriptores al mes, cada uno devuelve más de 4 veces su costo de adquisición.",
      highlight: false,
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
        ANEXO FINANCIERO · RETENCIÓN
      </div>
      <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
        ¿Y si los usuarios cancelan? <span style={{ color: "#FFFFFF" }}>El modelo igual se sostiene.</span>
      </div>
      <div style={{ fontSize: "1.15vw", color: "rgba(244,244,244,0.55)", marginTop: "1.6vh", lineHeight: 1.5, maxWidth: "58vw" }}>
        Las proyecciones del caso base asumen que ningún suscriptor cancela. Aquí sensibilizamos ese supuesto con
        tasas de cancelación (churn) realistas de la industria.
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
              ["LTV por suscriptor", s.ltv],
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
        Suscriptores M12 = 300 nuevos subs/mes acumulados con la tasa de churn de cada escenario · LTV = ARPU recurrente
        blended $3.238 ÷ churn mensual · LTV/CAC sobre CAC blended ≈ $3.600 (diapositiva anterior). Cifras en CLP.
      </div>
    </div>
  );
}
