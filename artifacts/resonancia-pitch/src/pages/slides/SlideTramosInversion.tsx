export default function SlideTramosInversion() {
  // Anchor: $27.5M → 10% → post-money $275M → pre-money $247.5M
  const PRE_MONEY = 247.5;
  // Valoración estimada M12 escenario base (5.000 subs × $4.350 × 12 × 4×)
  const VAL_M12 = 1044;

  const tramos = [5, 10, 15, 20, 27.5].map((inv) => {
    const postMoney = PRE_MONEY + inv;
    const equity = (inv / postMoney) * 100;
    const stakeM12 = (equity / 100) * VAL_M12;
    const retorno = stakeM12 / inv;
    return { inv, postMoney, equity, stakeM12, retorno };
  });

  const fmt = (n: number, dec = 1) =>
    n.toFixed(dec).replace(".", ",") + "M";
  const fmtPct = (n: number) => n.toFixed(1).replace(".", ",") + "%";
  const fmtX = (n: number) => n.toFixed(1).replace(".", ",") + "×";

  const COL_HEADERS = [
    "INVERSIÓN",
    "EQUITY",
    "POST-MONEY",
    "STAKE VALE · M12 (BASE)",
    "RETORNO ESTIMADO",
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{
        background: "linear-gradient(160deg, #2E0D16 0%, #1A0810 100%)",
        color: "#F4DAD5",
        padding: "7vh 6vw 5vh",
        boxSizing: "border-box",
        gap: "2.8vh",
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(242,231,228,0.45)", letterSpacing: "0.14em", marginBottom: "0.8vh" }}>
          TRAMOS DE INVERSIÓN
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Elige el nivel que{" "}
          <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            se ajuste a ti.
          </span>
        </div>
        <div style={{ fontSize: "1.2vw", color: "rgba(242,231,228,0.40)", marginTop: "0.7vh" }}>
          Valuación pre-money fija · $247,5M CLP · mismo precio por cada peso invertido
        </div>
      </div>

      {/* Table header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1.2fr 1.6fr 1fr",
          gap: "0.5vw",
          flexShrink: 0,
          paddingBottom: "1vh",
          borderBottom: "1px solid rgba(247,203,107,0.20)",
        }}
      >
        {COL_HEADERS.map((h) => (
          <div
            key={h}
            style={{
              fontSize: "0.82vw",
              fontWeight: 700,
              letterSpacing: "0.1em",
              background: "linear-gradient(90deg, #F7CB6B, #FBA980)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.0vh", flex: 1 }}>
        {tramos.map((t, i) => {
          const isHighlight = i === 4; // Tramo E ($27.5M) = recomendado
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr 1.2fr 1.6fr 1fr",
                gap: "0.5vw",
                alignItems: "center",
                backgroundColor: isHighlight ? "#1A0810" : "rgba(255,255,255,0.02)",
                border: isHighlight
                  ? "1.5px solid rgba(247,203,107,0.55)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "0.7vw",
                padding: "1.5vh 1.2vw",
              }}
            >
              {/* Inversión */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
                {isHighlight && (
                  <div style={{
                    fontSize: "0.72vw", fontWeight: 700, letterSpacing: "0.08em",
                    background: "linear-gradient(90deg, #F7CB6B, #FBA980)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    border: "1px solid rgba(247,203,107,0.40)", borderRadius: "0.3vw",
                    padding: "0.1vh 0.4vw", whiteSpace: "nowrap",
                  }}>
                    COMPLETO
                  </div>
                )}
                <div style={{
                  fontSize: isHighlight ? "1.8vw" : "1.6vw",
                  fontWeight: 700,
                  color: isHighlight ? "#F4DAD5" : "rgba(242,231,228,0.70)",
                }}>
                  ${t.inv === 27.5 ? "27,5" : t.inv.toFixed(0)}M CLP
                </div>
              </div>

              {/* Equity */}
              <div style={{
                fontSize: isHighlight ? "2.0vw" : "1.7vw",
                fontWeight: 700,
                background: isHighlight
                  ? "linear-gradient(90deg, #F7CB6B, #FBA980)"
                  : "none",
                WebkitBackgroundClip: isHighlight ? "text" : "unset",
                WebkitTextFillColor: isHighlight ? "transparent" : "unset",
                backgroundClip: isHighlight ? "text" : "unset",
                color: isHighlight ? undefined : "rgba(242,231,228,0.65)",
              }}>
                {fmtPct(t.equity)}
              </div>

              {/* Post-money */}
              <div style={{ fontSize: "1.3vw", color: "rgba(242,231,228,0.50)" }}>
                ${t.postMoney.toFixed(1).replace(".", ",")}M CLP
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
                <div style={{ fontSize: "0.9vw", color: "rgba(242,231,228,0.35)" }}>CLP</div>
              </div>

              {/* Retorno */}
              <div style={{
                fontSize: isHighlight ? "1.9vw" : "1.6vw",
                fontWeight: 700,
                color: isHighlight ? "#F7CB6B" : "rgba(242,231,228,0.55)",
              }}>
                {fmtX(t.retorno)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(247,203,107,0.12)", paddingTop: "1.5vh", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: "1.0vw", color: "rgba(242,231,228,0.32)", maxWidth: "68vw", lineHeight: 1.5 }}>
          Stake M12 calculado sobre valoración base (5.000 suscriptores × $4.350 ARPU × 12 meses × 4× ARR = $1.044M CLP) · Retorno estimado ilustrativo, no garantizado · El retorno real depende del exit y dilución en rondas futuras.
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.3vw", fontWeight: 700, letterSpacing: "-0.04em", background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</div>
          <div style={{ fontSize: "1.0vw", color: "rgba(242,231,228,0.35)", letterSpacing: "0.08em" }}>CASA DEL CUENCO</div>
        </div>
      </div>
    </div>
  );
}
