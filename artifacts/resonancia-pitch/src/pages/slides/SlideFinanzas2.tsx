export default function SlideFinanzas2() {
  // Suscriptores mes a mes (escenario base, 24 meses)
  // ARPU neto: $3.300/mes
  const meses = [
    { label: "M1",  subs: 0     },
    { label: "M2",  subs: 500   },
    { label: "M3",  subs: 1500  },
    { label: "M4",  subs: 3000  },
    { label: "M5",  subs: 5000  },
    { label: "M6",  subs: 7500  },
    { label: "M7",  subs: 9500  },
    { label: "M8",  subs: 11500 },
    { label: "M9",  subs: 13000 },
    { label: "M10", subs: 14000 },
    { label: "M11", subs: 14500 },
    { label: "M12", subs: 15000 },
    { label: "M13", subs: 16500 },
    { label: "M14", subs: 18500 },
    { label: "M15", subs: 21000 },
    { label: "M16", subs: 24000 },
    { label: "M17", subs: 27000 },
    { label: "M18", subs: 30000 },
    { label: "M19", subs: 33000 },
    { label: "M20", subs: 36000 },
    { label: "M21", subs: 39000 },
    { label: "M22", subs: 41000 },
    { label: "M23", subs: 42500 },
    { label: "M24", subs: 44000 },
  ];

  const maxSubs = 44000;

  const scenarios = [
    {
      label: "Conservador",
      subs12: "7.000", subs24: "18.000",
      ing12: "$85M CLP", ing24: "$380M CLP",
      color: "#3D4F62",
    },
    {
      label: "Base",
      subs12: "15.000", subs24: "44.000",
      ing12: "$314M CLP", ing24: "$1.543M CLP",
      color: "#BE9650",
      highlight: true,
    },
    {
      label: "Optimista",
      subs12: "25.000", subs24: "75.000",
      ing12: "$475M CLP", ing24: "$2.650M CLP",
      color: "#6EC49A",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "7vh 6vw 5.5vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1vh" }}>
          ANEXO FINANCIERO · HOJA 2 DE 3
        </div>
        <div style={{ fontSize: "3.6vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Curva de crecimiento <span style={{ color: "#BE9650" }}>24 meses.</span>
        </div>
      </div>

      {/* Main: chart + scenarios */}
      <div style={{ display: "flex", gap: "3.5vw", flex: 1, marginTop: "3vh" }}>

        {/* Left: bar chart 24 months */}
        <div style={{ flex: 1.6, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "1.05vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.08em", marginBottom: "1vh" }}>
            SUSCRIPTORES PREMIUM · ESCENARIO BASE (M1–M24)
          </div>

          {/* Year divider labels */}
          <div style={{ display: "flex", marginBottom: "0.5vh" }}>
            <div style={{ flex: 12, fontSize: "0.9vw", color: "rgba(190,150,80,0.45)", letterSpacing: "0.08em" }}>── AÑO 1 ──────────────────</div>
            <div style={{ flex: 12, fontSize: "0.9vw", color: "rgba(190,150,80,0.7)", letterSpacing: "0.08em" }}>── AÑO 2 ──────────────────</div>
          </div>

          <div style={{ flex: 1, display: "flex", gap: "0.3vw", alignItems: "flex-end", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.5vh" }}>
            {meses.map((m, i) => {
              const pct = Math.round((m.subs / maxSubs) * 100);
              const isY2 = i >= 12;
              const isPositive = m.subs > 0; // M1 negative, M2+ positive monthly flow
              return (
                <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                    <div style={{
                      width: "100%",
                      height: `${Math.max(pct, 1.5)}%`,
                      background: isY2
                        ? "linear-gradient(180deg, #D6A85B 0%, #BE9650 100%)"
                        : isPositive
                        ? "linear-gradient(180deg, #BE9650 0%, #8A6A30 100%)"
                        : "rgba(224,112,112,0.35)",
                      borderRadius: "0.2vw 0.2vw 0 0",
                    }} />
                  </div>
                  <div style={{ fontSize: "0.72vw", color: i % 3 === 0 ? "#7A8FA8" : "#3D4F62", marginTop: "0.3vh" }}>{m.label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5vh" }}>
            {[0, 10000, 22000, 33000, 44000].map(v => (
              <div key={v} style={{ fontSize: "0.85vw", color: "#3D4F62" }}>{v === 0 ? "0" : `${(v / 1000).toFixed(0)}K`}</div>
            ))}
          </div>
        </div>

        {/* Right: scenarios */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5vh" }}>
          <div style={{ fontSize: "1.05vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.08em", marginBottom: "0.2vh" }}>
            ESCENARIOS · INGRESOS ACUMULADOS
          </div>
          {scenarios.map((s) => (
            <div
              key={s.label}
              style={{
                padding: "1.4vh 1.2vw",
                backgroundColor: s.highlight ? "#090E17" : "transparent",
                border: `1.5px solid ${s.highlight ? "#BE9650" : "rgba(255,255,255,0.08)"}`,
                borderRadius: "0.7vw",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "0.8vh" }}>
                <div style={{ width: "0.45vw", height: "2.5vh", backgroundColor: s.color, borderRadius: "0.15vw", flexShrink: 0 }} />
                <div style={{ fontSize: "1.3vw", fontWeight: 700, color: s.highlight ? "#BE9650" : "#EDE1D3" }}>{s.label}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4vw" }}>
                <div>
                  <div style={{ fontSize: "0.9vw", color: "#3D4F62" }}>AÑO 1 · {s.subs12} subs</div>
                  <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#EDE1D3" }}>{s.ing12}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.9vw", color: s.highlight ? "rgba(190,150,80,0.6)" : "#3D4F62" }}>AÑO 2 · {s.subs24} subs</div>
                  <div style={{ fontSize: "1.3vw", fontWeight: 700, color: s.highlight ? "#BE9650" : "#EDE1D3" }}>{s.ing24}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.2vw", marginTop: "2.5vh" }}>
        {[
          { label: "Inversión inicial", value: "$22,5M CLP", sub: "US$25.000 · TC $900" },
          { label: "Break-even acum.", value: "Mes 5–6", sub: "incl. recuperar inversión" },
          { label: "ARPU neto mensual", value: "$3.300 CLP", sub: "post IVA 19% + tienda 30%" },
          { label: "Ingreso neto 24M", value: "$1.442M CLP", sub: "≈ US$ 1,6M acumulado" },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              padding: "1.4vh 1.1vw",
              backgroundColor: "#090E17",
              border: "1px solid rgba(190,150,80,0.18)",
              borderRadius: "0.7vw",
            }}
          >
            <div style={{ fontSize: "0.9vw", color: "#7A8FA8", letterSpacing: "0.06em", marginBottom: "0.5vh" }}>{k.label.toUpperCase()}</div>
            <div style={{ fontSize: "1.75vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: "0.9vw", color: "#3D4F62", marginTop: "0.4vh" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: "1.0vw", color: "#3D4F62", lineHeight: 1.5, marginTop: "1.5vh" }}>
        Precio $6.900/mes (IVA incl.) · $43.900/año · ARPU neto blended ~$3.300 · crecimiento orgánico desde +1M seguidores · escenarios ilustrativos, no garantizados.
      </div>
    </div>
  );
}
