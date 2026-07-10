export default function SlideFinanzas2() {
  // Curva base: +400/mes; M11=4.400, M12=5.000 (+600 último mes)
  // ARPU neto blended $4.350/mes
  const ARPU = 4350;
  const COLCHON = 0.5;

  const meses = [
    { label: "M1",  subs: 400,  costos: 3.25 },
    { label: "M2",  subs: 800,  costos: 3.25 },
    { label: "M3",  subs: 1200, costos: 5.25 },
    { label: "M4",  subs: 1600, costos: 5.25 },
    { label: "M5",  subs: 2000, costos: 5.25 },
    { label: "M6",  subs: 2400, costos: 5.25 },
    { label: "M7",  subs: 2800, costos: 5.50 },
    { label: "M8",  subs: 3200, costos: 5.50 },
    { label: "M9",  subs: 3600, costos: 5.75 },
    { label: "M10", subs: 4000, costos: 5.75 },
    { label: "M11", subs: 4400, costos: 6.00 },
    { label: "M12", subs: 5000, costos: 6.25 },
  ];

  let cumulative = COLCHON;
  const data = meses.map((m) => {
    const ingreso = (m.subs * ARPU) / 1_000_000;
    const neto = ingreso - m.costos;
    cumulative += neto;
    return { ...m, ingreso, neto, cumulative: parseFloat(cumulative.toFixed(2)) };
  });

  const maxSubs = 5000;
  const allCum = data.map((d) => d.cumulative);
  const minCum = Math.min(...allCum);
  const maxCum = Math.max(...allCum);
  const cumRange = maxCum - minCum;
  const ZERO_PCT = (-minCum / cumRange) * 100;

  const scenarios = [
    { label: "Base",      subs12: "5.000",  ingAnual: "~$136M", neto: "+$73M",  highlight: true },
    { label: "Optimista", subs12: "7.000",  ingAnual: "~$200M", neto: "+$137M", highlight: false },
    { label: "Agresivo",  subs12: "10.000", ingAnual: "~$280M", neto: "+$217M", highlight: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #2E0D16 0%, #1A0810 100%)", color: "#F4DAD5", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 2 DE 3
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Caja acumulada y{" "}
          <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            escenarios.
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", gap: "3vw", alignItems: "stretch", marginTop: "2.5vh" }}>

        {/* Left: dual chart */}
        <div style={{ flex: 1.6, display: "flex", flexDirection: "column", gap: "2vh" }}>

          {/* Subscriber bars */}
          <div style={{ flex: 0.8, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.0vw", fontWeight: 600, color: "rgba(242,231,228,0.40)", letterSpacing: "0.1em", marginBottom: "0.8vh" }}>
              SUSCRIPTORES PREMIUM — ESCENARIO BASE
            </div>
            <div style={{ flex: 1, display: "flex", gap: "0.55vw", alignItems: "flex-end", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.4vh" }}>
              {data.map((m) => {
                const pct = (m.subs / maxSubs) * 100;
                return (
                  <div key={m.label + "s"} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                      <div
                        style={{
                          width: "100%",
                          height: `${Math.max(pct, 3)}%`,
                          background: "linear-gradient(180deg, #F7CB6B 0%, #C8963E 100%)",
                          borderRadius: "0.2vw 0.2vw 0 0",
                          opacity: 0.85,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: "0.72vw", color: "rgba(242,231,228,0.40)", textAlign: "center", marginTop: "0.2vh" }}>{m.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3vh" }}>
              <div style={{ fontSize: "0.8vw", color: "#3D0E16" }}>0</div>
              <div style={{ fontSize: "0.8vw", color: "#3D0E16" }}>5.000 subs</div>
            </div>
          </div>

          {/* Cumulative cash bars */}
          <div style={{ flex: 1.2, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "1.0vw", fontWeight: 600, color: "rgba(242,231,228,0.40)", letterSpacing: "0.1em", marginBottom: "0.8vh" }}>
              CAJA ACUMULADA MES A MES (MM CLP)
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              {/* Zero line */}
              <div
                style={{
                  position: "absolute",
                  left: 0, right: 0,
                  bottom: `${ZERO_PCT}%`,
                  height: "1.5px",
                  backgroundColor: "rgba(255,255,255,0.25)",
                  zIndex: 1,
                }}
              />
              {/* Bars container */}
              <div style={{ position: "absolute", inset: 0, display: "flex", gap: "0.55vw", paddingBottom: "2vh" }}>
                {data.map((m) => {
                  const isNeg = m.cumulative < 0;
                  const barHeightPct = (Math.abs(m.cumulative) / cumRange) * 100;
                  const bottomPct = ZERO_PCT;
                  return (
                    <div key={m.label + "c"} style={{ flex: 1, position: "relative" }}>
                      {/* Numeric label */}
                      <div
                        style={{
                          position: "absolute",
                          left: "50%",
                          transform: "translateX(-50%)",
                          bottom: isNeg
                            ? `${bottomPct - barHeightPct - 10}%`
                            : `${bottomPct + barHeightPct + 1}%`,
                          fontSize: "0.68vw",
                          fontWeight: 700,
                          color: isNeg ? "#E07070" : "#6EC49A",
                          whiteSpace: "nowrap",
                          zIndex: 2,
                        }}
                      >
                        {isNeg
                          ? `–${Math.abs(m.cumulative).toFixed(1)}`
                          : m.cumulative < 10
                          ? m.cumulative.toFixed(1)
                          : Math.round(m.cumulative).toString()}
                      </div>
                      {/* Bar */}
                      <div
                        style={{
                          position: "absolute",
                          left: "10%",
                          right: "10%",
                          bottom: isNeg ? `${bottomPct - barHeightPct}%` : `${bottomPct}%`,
                          height: `${barHeightPct}%`,
                          background: isNeg
                            ? "linear-gradient(180deg, rgba(224,112,112,0.15), rgba(224,112,112,0.55))"
                            : "linear-gradient(180deg, #6EC49A, rgba(110,196,154,0.45))",
                          border: `1px solid ${isNeg ? "rgba(224,112,112,0.55)" : "rgba(110,196,154,0.55)"}`,
                          borderRadius: isNeg ? "0 0 0.2vw 0.2vw" : "0.2vw 0.2vw 0 0",
                        }}
                      />
                      {/* Month label */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "0.68vw",
                          color: "rgba(242,231,228,0.40)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3vh" }}>
              <div style={{ fontSize: "0.8vw", color: "#E07070" }}>Negativo M1–M3</div>
              <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#6EC49A" }}>M12 ≈ $75M en caja</div>
            </div>
          </div>
        </div>

        {/* Right: scenario cards + KPI */}
        <div style={{ flex: 0.8, display: "flex", flexDirection: "column", gap: "1.6vh" }}>
          <div style={{ fontSize: "1.0vw", fontWeight: 600, color: "rgba(242,231,228,0.40)", letterSpacing: "0.1em" }}>
            ESCENARIOS AÑO 1
          </div>
          {scenarios.map((s) => (
            <div
              key={s.label}
              style={{
                padding: "1.6vh 1.4vw",
                backgroundColor: "#1A0810",
                border: `1.5px solid ${s.highlight ? "#F7CB6B" : "rgba(255,255,255,0.09)"}`,
                borderRadius: "0.8vw",
              }}
            >
              <div style={{ fontSize: "1.3vw", fontWeight: 700, color: s.highlight ? "#F7CB6B" : "#F4DAD5", marginBottom: "0.3vh" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "1.0vw", color: "rgba(242,231,228,0.50)", marginBottom: "0.6vh" }}>
                {s.subs12} subs al mes 12
              </div>
              <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#F4DAD5" }}>{s.ingAnual}</div>
              <div style={{ fontSize: "1.1vw", color: "#6EC49A", fontWeight: 600 }}>neto {s.neto}</div>
            </div>
          ))}

          {/* Caja KPI */}
          <div
            style={{
              marginTop: "auto",
              padding: "1.8vh 1.4vw",
              backgroundColor: "rgba(110,196,154,0.06)",
              border: "1px solid rgba(110,196,154,0.3)",
              borderRadius: "0.8vw",
            }}
          >
            <div style={{ fontSize: "1.0vw", color: "rgba(242,231,228,0.50)", marginBottom: "0.5vh" }}>
              CAJA AL MES 12 (BASE)
            </div>
            <div
              style={{
                fontSize: "2.8vw",
                fontWeight: 700,
                background: "linear-gradient(90deg, #F7CB6B, #FBA980)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1,
              }}
            >
              ~$75M CLP
            </div>
            <div style={{ fontSize: "0.9vw", color: "rgba(242,231,228,0.50)", marginTop: "0.4vh" }}>
              acumulados post-lanzamiento
            </div>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.0vw", color: "#3D0E16", lineHeight: 1.5, marginTop: "1.5vh" }}>
        Curva base: +400 subs/mes (M1=400…M11=4.400, M12=5.000) · ARPU neto blended ~$4.350/mes ·
        Break-even operacional M3 · Caja incluye $0,5M colchón pre-lanzamiento ·
        Optimista/Agresivo = curva más acelerada, mismos costos fijos.
      </div>
    </div>
  );
}
