import { FINANCIAL_MONTHS, formatMillions } from "../../data/financialModel";

const FIRST_MILLION_EQUITY = 805 / 1092;
const MARGINAL_STEP_PP = 47 / 2184;

const equityForInvestment = (investmentM: number) =>
  FIRST_MILLION_EQUITY * investmentM +
  MARGINAL_STEP_PP * investmentM * (investmentM - 1) / 2;

const fmtPct = (n: number, decimals = 2) =>
  n.toFixed(decimals).replace(".", ",") + "%";

const fmtMoney = (n: number, decimals = 1) =>
  n.toFixed(decimals).replace(".", ",") + "M";

export default function SlideTramosInversion() {
  const arrM12 = FINANCIAL_MONTHS[11].recurringRevenueM * 12;
  const valuationM12 = arrM12 * 4;
  const scenarios = Array.from({ length: 21 }, (_, index) => {
    const investmentM = index + 1;
    const equity = equityForInvestment(investmentM);
    const stakeValueM12 = (equity / 100) * valuationM12;
    return { investmentM, equity, stakeValueM12 };
  });
  const groups = [scenarios.slice(0, 7), scenarios.slice(7, 14), scenarios.slice(14, 21)];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{
        background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)",
        color: "#F4F4F4",
        padding: "5.6vh 5.2vw 4.2vh",
        boxSizing: "border-box",
        gap: "2vh",
      }}
    >
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "4vw" }}>
        <div>
          <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "rgba(244,244,244,0.45)", letterSpacing: "0.14em", marginBottom: "0.7vh" }}>
            ESCALA DE INVERSIÓN · $1M A $21M CLP
          </div>
          <div style={{ fontSize: "3.1vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Más aporte,{" "}
            <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              mejor participación.
            </span>
          </div>
        </div>
        <div style={{ maxWidth: "32vw", padding: "1.25vh 1.2vw", border: "1px solid rgba(214,164,92,0.28)", borderRadius: "0.7vw", background: "rgba(214,164,92,0.07)" }}>
          <div style={{ fontSize: "0.76vw", fontWeight: 700, letterSpacing: "0.1em", color: "#D6A45C", marginBottom: "0.35vh" }}>
            PRIMA PROGRESIVA POR ESCALA
          </div>
          <div style={{ fontSize: "0.92vw", color: "rgba(244,244,244,0.63)", lineHeight: 1.45 }}>
            Cada nuevo millón suma <strong style={{ color: "#F4F4F4" }}>0,0215 pp más</strong> de equity que el millón anterior.
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25vw", flex: 1, minHeight: 0 }}>
        {groups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              borderRadius: "0.85vw",
              border: "1px solid rgba(255,255,255,0.11)",
              background: "rgba(4,7,23,0.16)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "0.8fr 0.72fr 1.28fr",
                padding: "0.8vh 1vw",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                fontSize: "0.68vw",
                fontWeight: 700,
                letterSpacing: "0.09em",
                color: "rgba(244,244,244,0.42)",
              }}
            >
              <div>APORTE</div>
              <div>EQUITY</div>
              <div>VALOR EST. EN M12</div>
            </div>
            {group.map((scenario) => {
              const isAnchor = scenario.investmentM === 8 || scenario.investmentM === 21;
              return (
                <div
                  key={scenario.investmentM}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.8fr 0.72fr 1.28fr",
                    alignItems: "center",
                    flex: 1,
                    padding: "0 1vw",
                    borderBottom: scenario.investmentM % 7 === 0 ? "none" : "1px solid rgba(255,255,255,0.055)",
                    background: isAnchor
                      ? scenario.investmentM === 21
                        ? "linear-gradient(90deg, rgba(110,196,154,0.16), rgba(110,196,154,0.06))"
                        : "linear-gradient(90deg, rgba(214,164,92,0.15), rgba(214,164,92,0.05))"
                      : "transparent",
                    boxShadow: isAnchor ? "inset 3px 0 0 " + (scenario.investmentM === 21 ? "#6EC49A" : "#D6A45C") : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.3vw" }}>
                    <span style={{ fontSize: isAnchor ? "1.35vw" : "1.12vw", fontWeight: 700, color: isAnchor ? "#FFFFFF" : "rgba(244,244,244,0.78)" }}>
                      ${scenario.investmentM}M
                    </span>
                    {isAnchor && (
                      <span style={{ fontSize: "0.58vw", fontWeight: 700, letterSpacing: "0.07em", color: scenario.investmentM === 21 ? "#6EC49A" : "#D6A45C" }}>
                        ANCLA
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: isAnchor ? "1.42vw" : "1.16vw", fontWeight: 700, color: scenario.investmentM === 21 ? "#6EC49A" : isAnchor ? "#D6A45C" : "#F4F4F4" }}>
                    {fmtPct(scenario.equity)}
                  </div>
                  <div style={{ fontSize: isAnchor ? "1.16vw" : "1.03vw", fontWeight: isAnchor ? 700 : 500, color: isAnchor ? "#6EC49A" : "rgba(110,196,154,0.72)" }}>
                    ~${fmtMoney(scenario.stakeValueM12)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", gap: "2vw", paddingTop: "0.9vh", borderTop: "1px solid rgba(255,255,255,0.11)" }}>
        <div style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.34)", lineHeight: 1.45 }}>
          Curva progresiva con aceleración marginal constante. Anclajes exactos: <strong style={{ color: "#D6A45C" }}>$8M = 6,5%</strong> y <strong style={{ color: "#6EC49A" }}>$21M = 20%</strong>.
        </div>
        <div style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.28)", textAlign: "right", lineHeight: 1.45 }}>
          Referencia M12: ARR {formatMillions(arrM12)} · valoración ilustrativa 4× ARR {formatMillions(valuationM12)}.<br />
          Escenarios sujetos a acuerdo definitivo.
        </div>
      </div>
    </div>
  );
}