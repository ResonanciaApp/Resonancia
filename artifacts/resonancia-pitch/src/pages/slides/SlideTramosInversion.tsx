export default function SlideTramosInversion() {
  // Tramos simples: equity fijo por monto de inversión
  const VAL_M12 = 537; // millones CLP · 3.600 subs × $3.116 ARR rec. (blend 35/60/5%) × 12 × 4×

  const tramos = [
    { inv: 3,  equity: 2.0 },
    { inv: 6,  equity: 4.5 },
    { inv: 8,  equity: 6.5 },
    { inv: 10, equity: 8.5 },
  ].map(({ inv, equity }) => {
    const postMoney = inv / (equity / 100);
    const stakeM12 = (equity / 100) * VAL_M12;
    const retorno = stakeM12 / inv;
    const tasaMM = equity / inv;
    return { inv, equity, postMoney, stakeM12, retorno, tasaMM };
  });

  const fmt = (n: number, dec = 1) =>
    n.toFixed(dec).replace(".", ",") + "M";
  const fmtPct = (n: number) => n.toFixed(1).replace(".", ",") + "%";
  const fmtX = (n: number) => n.toFixed(1).replace(".", ",") + "×";
  const fmtInv = (inv: number) => {
    return inv % 1 === 0 ? inv.toFixed(0) : inv.toFixed(1).replace(".", ",");
  };

  const COL_HEADERS = [
    "INVERSIÓN",
    "EQUITY",
    "VALUACIÓN IMPLÍCITA",
    "STAKE VALE · M12 (BASE)",
    "RETORNO EST.",
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{
        background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)",
        color: "#F4F4F4",
        padding: "7vh 6vw 5vh",
        boxSizing: "border-box",
        gap: "2.4vh",
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(244,244,244,0.45)", letterSpacing: "0.14em", marginBottom: "0.8vh" }}>
          TRAMOS DE INVERSIÓN
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Oportunidad de{" "}
          <span style={{ color: "#FFFFFF" }}>
            inversión.
          </span>
        </div>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.40)", marginTop: "0.7vh" }}>
          Modelo de prima por escala · cada tramo mayor recibe más equity por peso invertido
        </div>
      </div>

      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr 1.3fr 1.6fr 1fr",
          gap: "0.5vw",
          flexShrink: 0,
          paddingBottom: "1vh",
          borderBottom: "1px solid rgba(255,255,255,0.20)",
        }}
      >
        {COL_HEADERS.map((h) => (
          <div
            key={h}
            style={{
              fontSize: "0.82vw",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#FFFFFF",
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.9vh", flex: 1 }}>
        {tramos.map((t, i) => {
          const isHighlight = i === tramos.length - 1; // Tramo mayor ($10M)
          const rowBg = ["rgba(0,0,0,0.12)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.20)"];
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr 1.3fr 1.6fr 1fr",
                gap: "0.5vw",
                alignItems: "center",
                backgroundColor: isHighlight ? "#181C3E" : rowBg[i],
                border: isHighlight
                  ? "1.5px solid rgba(255,255,255,0.55)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "0.7vw",
                padding: "1.4vh 1.2vw",
              }}
            >
              {/* Inversión */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
                <div style={{
                  fontSize: isHighlight ? "1.8vw" : "1.6vw",
                  fontWeight: 700,
                  color: isHighlight ? "#F4F4F4" : "rgba(244,244,244,0.70)",
                }}>
                  ${fmtInv(t.inv)}M CLP
                </div>
              </div>

              {/* Equity + tasa */}
              <div>
                <div style={{
                  fontSize: isHighlight ? "2.0vw" : "1.7vw",
                  fontWeight: 700,
                  background: isHighlight
                    ? "linear-gradient(90deg, #FFFFFF, #FFFFFF)"
                    : "none",
                  WebkitBackgroundClip: isHighlight ? "text" : "unset",
                  WebkitTextFillColor: isHighlight ? "transparent" : "unset",
                  backgroundClip: isHighlight ? "text" : "unset",
                  color: isHighlight ? undefined : "rgba(244,244,244,0.65)",
                }}>
                  {fmtPct(t.equity)}
                </div>
                <div style={{ fontSize: "0.78vw", color: "rgba(255,255,255,0.55)", marginTop: "0.15vh" }}>
                  {t.tasaMM.toFixed(2).replace(".", ",")}%/M
                </div>
              </div>

              {/* Valuación implícita */}
              <div style={{ fontSize: "1.3vw", color: "rgba(244,244,244,0.50)" }}>
                ~${fmt(t.postMoney, 0)} CLP
              </div>

              {/* Stake M12 */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5vw" }}>
                <div style={{
                  fontSize: isHighlight ? "1.9vw" : "1.6vw",
                  fontWeight: 700,
                  color: "#6EC49A",
                }}>
                  ~${fmt(t.stakeM12)}
                </div>
                <div style={{ fontSize: "0.9vw", color: "rgba(244,244,244,0.35)" }}>CLP</div>
              </div>

              {/* Retorno */}
              <div style={{
                fontSize: isHighlight ? "1.9vw" : "1.6vw",
                fontWeight: 700,
                color: isHighlight ? "#FFFFFF" : "rgba(244,244,244,0.55)",
              }}>
                {fmtX(t.retorno)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "1.5vh" }}>
        <div style={{ fontSize: "1.0vw", color: "rgba(244,244,244,0.32)", lineHeight: 1.5 }}>
          Stake M12 calculado sobre ARR recurrente (3.600 suscriptores × $3.116 ARPU rec. × 12 meses × 4× = $537M CLP · blend 35/60/5% · 300 nuevos subs/mes) · Excluye lifetime (no recurrente) · Retorno estimado ilustrativo.
        </div>
      </div>

    </div>
  );
}
