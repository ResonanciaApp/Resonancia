export default function SlideFinanzas1() {
  // Escenario base · ARPU neto $3.300/mes
  // Fijos $3,65M/mes (incl. gerente $2M + otros $350K) · Contenido $0 M1-2; $3,0M desde M3
  // Marketing: $0→$0,5M→$1,0M→$1,5M
  // Costos totales: M1-2=$3,65M · M3-6=$7,15M · M7-10=$7,65M · M11-12=$8,15M
  const rows = [
    { mes: "Mes 1–2",  subs: "0 → 500",  ingreso: "– / $1,7M",  costoFijo: "$3,65M", costoVar: "$0",     resultado: "–$3,7M / –$2,0M", neg: true  },
    { mes: "Mes 3",    subs: "1.500",     ingreso: "$5,0M",       costoFijo: "$4,15M", costoVar: "$3,0M",  resultado: "–$2,2M",          neg: true  },
    { mes: "Mes 6",    subs: "7.500",     ingreso: "$24,8M",      costoFijo: "$4,15M", costoVar: "$3,0M",  resultado: "+$17,6M",         neg: false },
    { mes: "Mes 9",    subs: "13.000",    ingreso: "$42,9M",      costoFijo: "$4,65M", costoVar: "$3,0M",  resultado: "+$35,3M",         neg: false },
    { mes: "Mes 12",   subs: "15.000",    ingreso: "$49,5M",      costoFijo: "$5,15M", costoVar: "$3,0M",  resultado: "+$41,4M",         neg: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 1 DE 3
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Flujo de caja <span style={{ color: "#BE9650" }}>año 1.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "#7A8FA8", marginTop: "1vh" }}>
          En millones de pesos chilenos (CLP) · TC referencial $900/USD · escenario base
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
          padding: "1.4vh 1.2vw",
          borderBottom: "1px solid rgba(190,150,80,0.35)",
          marginBottom: "0.5vh",
        }}>
          {["Período", "Suscriptores", "Ingresos netos", "Fijo + mkt", "Contenido", "Resultado mes"].map((h) => (
            <div key={h} style={{ fontSize: "1.15vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {rows.map((r, i) => (
          <div
            key={r.mes}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
              padding: "1.7vh 1.2vw",
              backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              borderRadius: "0.4vw",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#EDE1D3" }}>{r.mes}</div>
            <div style={{ fontSize: "1.45vw", color: "#EDE1D3" }}>{r.subs}</div>
            <div style={{ fontSize: "1.45vw", color: "#EDE1D3" }}>{r.ingreso}</div>
            <div style={{ fontSize: "1.45vw", color: "#7A8FA8" }}>{r.costoFijo}</div>
            <div style={{ fontSize: "1.45vw", color: r.costoVar === "$0" ? "#3D4F62" : "#7A8FA8" }}>{r.costoVar}</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: r.neg ? "#E07070" : "#6EC49A" }}>{r.resultado}</div>
          </div>
        ))}

        {/* Totales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
          padding: "1.8vh 1.2vw",
          borderTop: "1px solid rgba(190,150,80,0.35)",
          marginTop: "0.8vh",
          backgroundColor: "#090E17",
          borderRadius: "0.6vw",
        }}>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#BE9650" }}>AÑO 1 TOTAL</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#EDE1D3" }}>15.000 al cierre</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#EDE1D3" }}>~$314M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#7A8FA8" }}>~$53M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#7A8FA8" }}>~$30M</div>
          <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#6EC49A" }}>+$231M neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.2vw", color: "#3D4F62", lineHeight: 1.5 }}>
        Ingresos netos = precio excl. IVA (19%) × 70% (comisión Apple/Google 30%) · ARPU neto blended ~$3.300/mes ·
        Contenido $0 en M1-2, $3,0M/mes desde M3 (~43 sesiones × $70.000 promedio) ·
        Fijo + mkt: gerente $2M + coordinador $700K + hosting $150K + asesoría TI $200K + admin $250K + otros $350K + marketing variable ·
        Inversión inicial US$25.000 ($22,5M CLP) no incluida · Break-even acumulado estimado mes 7.
      </div>
    </div>
  );
}
