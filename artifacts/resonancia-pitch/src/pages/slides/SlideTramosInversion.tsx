export default function SlideTramosInversion() {
  // Modelo acelerado: tasa de equity crece con el tamaño del cheque
  // Anchor máximo: $23,504M → 25%
  const VAL_M12 = 1044; // millones CLP · 5.000 subs × $4.350 × 12 × 4×

  const tramos = [
    { inv: 5,      equity: 5.0   },
    { inv: 10,     equity: 12.0 },
    { inv: 15,     equity: 20.0 },
    { inv: 20,     equity: 28.0 },
    { inv: 23.504, equity: 35.0 },
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
    if (inv === 23.504) return "23,50";
    return inv.toFixed(0);
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
        background: "linear-gradient(160deg, #2d1c52 0%, #24245d 33%, #1f2a62 66%, #2d4081 100%)",
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
          Más inversión,{" "}
          <span style={{ color: "#FFFFFF" }}>
            mejor tasa.
          </span>
        </div>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.40)", marginTop: "0.7vh" }}>
          Modelo de prima por escala · cada tramo mayor recibe más equity por peso invertido · ancla máxima $23,50M = 35%
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
          const isHighlight = i === 4; // Tramo E ($23,50M)
          const rowBg = ["rgba(0,0,0,0.12)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.20)"];
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr 1.3fr 1.6fr 1fr",
                gap: "0.5vw",
                alignItems: "center",
                backgroundColor: isHighlight ? "#1f2a62" : rowBg[i],
                border: isHighlight
                  ? "1.5px solid rgba(255,255,255,0.55)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "0.7vw",
                padding: "1.4vh 1.2vw",
              }}
            >
              {/* Inversión */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
                {isHighlight && (
                  <div style={{
                    fontSize: "0.72vw", fontWeight: 700, letterSpacing: "0.08em",
                    color: "#FFFFFF",
                    border: "1px solid rgba(255,255,255,0.40)", borderRadius: "0.3vw",
                    padding: "0.1vh 0.4vw", whiteSpace: "nowrap",
                  }}>
                    COMPLETO
                  </div>
                )}
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
          Stake M12 calculado sobre valoración base (5.000 suscriptores × $4.350 ARPU × 12 meses × 4× ARR = $1.044B CLP) · Retorno estimado ilustrativo, no garantizado · El retorno real depende del exit y dilución en rondas futuras.
        </div>
      </div>

      {/* Pulso 4 · logo esquina */}
      <div style={{ position: "absolute", top: "3.5vh", right: "3vw", zIndex: 200, pointerEvents: "none" }}>
        <img src={`${import.meta.env.BASE_URL}logo-pulso4.png`} alt="Pulso 4" style={{ height: "4.5vh", opacity: 0.50, display: "block" }} />
      </div>
    </div>
  );
}
