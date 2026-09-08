import {
  BASE_CASE,
  FINANCIAL_MONTHS,
  INVESTMENT,
  PRICING,
  formatMillions,
} from "../../data/financialModel";

export default function SlideContingencia() {
  const contingencyLineM = Math.abs(BASE_CASE.conservativeValleyM) - INVESTMENT.launchMarketingReserveM;

  const cols = [
    {
      t: "CAJA REAL · MES 1",
      tint: "#6EC49A",
      d: (
        <>
           El 30% de las altas M1 elige Premium anual y lo paga <span style={{ color: "#FFFFFF", fontWeight: 700 }}>completo por adelantado</span>:
           300 anuales + 700 mensuales = <span style={{ color: "#FFFFFF", fontWeight: 700 }}>{formatMillions(FINANCIAL_MONTHS[0].subscriptionCashM)} de ingreso real</span> contra {formatMillions(FINANCIAL_MONTHS[0].cashExpensesM, 2)} de gastos incurridos.
          El mes 1 prácticamente se paga solo, con la campaña post-lanzamiento de la ronda ($2,0M: $1M M1 + $1M M2; M3 $0) ya financiada.
        </>
      ),
    },
    {
      t: "EL RIESGO",
      tint: "rgba(224,112,112,0.9)",
      d: (
        <>
           Que el mix anual tarde: en una app nueva es común probar primero el plan mensual.
           Si el anual queda <span style={{ color: "#FFFFFF", fontWeight: 700 }}>bajo el 30% M1 o 35% M2+</span> de las altas,
           La hoja 1 muestra un proxy acumulado de P&amp;L devengado, cuyo valle es
           <span style={{ color: "#FFFFFF", fontWeight: 700 }}> {formatMillions(BASE_CASE.conservativeValleyM)} en M{BASE_CASE.valleyMonth}</span>.
           No es caja: en la hoja 2 la caja real base permanece positiva, con mínimo de {formatMillions(BASE_CASE.cashValleyM)} en M{BASE_CASE.cashValleyMonth}.
        </>
      ),
    },
    {
      t: "LA CONTINGENCIA",
      tint: "#D6A45C",
      d: (
        <>
          Línea comprometida de los socios por <span style={{ color: "#FFFFFF", fontWeight: 700 }}>~{formatMillions(contingencyLineM)}</span> ({formatMillions(Math.abs(BASE_CASE.conservativeValleyM))} de valle − {formatMillions(INVESTMENT.launchMarketingReserveM)} de campaña ya financiados).
           Solo se gira si el mix anual no alcanza el supuesto en los primeros 3 meses.
           <span style={{ color: "#FFFFFF", fontWeight: 700 }}> No es parte de la ronda ni diluye</span>: es un puente contingente.
        </>
      ),
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
        ANEXO FINANCIERO · PLAN DE CONTINGENCIA
      </div>
      <div style={{ fontSize: "3.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: "66vw" }}>
        Sin préstamos: la operación se financia con <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>prepagos anuales.</span>
      </div>

      <div style={{ display: "flex", gap: "1.6vw", marginTop: "4.2vh" }}>
        {cols.map((c) => (
          <div
            key={c.t}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.14)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderTop: `3px solid ${c.tint}`,
              borderRadius: "0.7vw",
              padding: "2.4vh 1.5vw",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: "0.95vw", fontWeight: 700, color: c.tint, letterSpacing: "0.10em", marginBottom: "1.2vh" }}>{c.t}</div>
            <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.60)", lineHeight: 1.6 }}>{c.d}</div>
          </div>
        ))}
      </div>

      {/* Trigger / monitoreo */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "3vh" }}>
        <div style={{ flex: 1, backgroundColor: "rgba(214,164,92,0.07)", border: "1px solid rgba(214,164,92,0.35)", borderRadius: "0.7vw", padding: "2.2vh 1.6vw" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "0.10em", marginBottom: "0.9vh" }}>GATILLO Y MONITOREO</div>
          <div style={{ fontSize: "1.1vw", color: "rgba(244,244,244,0.65)", lineHeight: 1.6 }}>
            Indicador único: <span style={{ color: "#FFFFFF", fontWeight: 700 }}>% de suscripciones anuales sobre altas nuevas</span>, revisado mes a mes en M1–M3.
             Si el mix alcanza 30% en M1 y 35% desde M2, la línea no se usa y la operación se autofinancia de principio a fin.
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", fontSize: "0.85vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.45 }}>
         Neto anual M1 por adelantado = ${PRICING.launchPremium.annual.toLocaleString("es-CL")} ÷ 1,19 × 70%; desde M2 Premium normal = ${PRICING.premium.annual.toLocaleString("es-CL")} y Premium Plus desde M3 = ${PRICING.premiumPlus.annual.toLocaleString("es-CL")}. Vista P&amp;L reconoce anual mes a mes ·
        La línea de contingencia es un compromiso de los socios fundadores, externo a la ronda. Cifras en CLP.
      </div>
    </div>
  );
}
