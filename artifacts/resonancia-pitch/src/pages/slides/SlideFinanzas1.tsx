export default function SlideFinanzas1() {
  // Escenario base · 5.000 premium al M12
  // ARPU neto blended $4.350/mes (mensual $5.288 neto · anual $2.941 neto/mes equiv.)
  // Fijos $3,25M/mes (RRHH $2,8M + hosting $250K + otros $200K)
  // Contenido $0 M1-2; $1,5M desde M3 · Marketing: $0→$0,5M→$1,0M→$1,5M
  const rows = [
    { mes: "Mes 1",  subs: "0",        ingreso: "$0",        costoFijo: "$3,25M", costoVar: "$0",     resultado: "–$3,25M", neg: true  },
    { mes: "Mes 2",  subs: "400",      ingreso: "$1,74M",    costoFijo: "$3,25M", costoVar: "$0",     resultado: "–$1,51M", neg: true  },
    { mes: "Mes 3",  subs: "1.000",    ingreso: "$4,35M",    costoFijo: "$3,75M", costoVar: "$1,5M",  resultado: "–$0,90M", neg: true  },
    { mes: "Mes 6",  subs: "3.300",    ingreso: "$14,4M",    costoFijo: "$3,75M", costoVar: "$1,5M",  resultado: "+$9,1M",  neg: false },
    { mes: "Mes 9",  subs: "4.500",    ingreso: "$19,6M",    costoFijo: "$4,25M", costoVar: "$1,5M",  resultado: "+$13,8M", neg: false },
    { mes: "Mes 12", subs: "5.000",    ingreso: "$21,75M",   costoFijo: "$4,75M", costoVar: "$1,5M",  resultado: "+$15,5M", neg: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #2E0D16 0%, #1A0810 100%)", color: "#F4DAD5", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 1 DE 3
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Flujo de caja <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>año 1.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(242,231,228,0.50)", marginTop: "1vh" }}>
          En millones de pesos chilenos (CLP) · escenario base · 5.000 suscriptores al cierre
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
          padding: "1.4vh 1.2vw",
          borderBottom: "1px solid rgba(247,203,107,0.35)",
          marginBottom: "0.5vh",
        }}>
          {["Período", "Suscriptores", "Ingresos netos", "Fijo + mkt", "Contenido", "Resultado mes"].map((h) => (
            <div key={h} style={{ fontSize: "1.15vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.06em" }}>{h}</div>
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
            <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#F4DAD5" }}>{r.mes}</div>
            <div style={{ fontSize: "1.45vw", color: "#F4DAD5" }}>{r.subs}</div>
            <div style={{ fontSize: "1.45vw", color: "#F4DAD5" }}>{r.ingreso}</div>
            <div style={{ fontSize: "1.45vw", color: "rgba(242,231,228,0.50)" }}>{r.costoFijo}</div>
            <div style={{ fontSize: "1.45vw", color: r.costoVar === "$0" ? "#3D0E16" : "rgba(242,231,228,0.50)" }}>{r.costoVar}</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: r.neg ? "#E07070" : "#6EC49A" }}>{r.resultado}</div>
          </div>
        ))}

        {/* Totales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
          padding: "1.8vh 1.2vw",
          borderTop: "1px solid rgba(247,203,107,0.35)",
          marginTop: "0.8vh",
          backgroundColor: "#1A0810",
          borderRadius: "0.6vw",
        }}>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>AÑO 1 TOTAL</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#F4DAD5" }}>5.000 al cierre</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#F4DAD5" }}>~$159M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>~$48,5M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>~$15M</div>
          <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#6EC49A" }}>+$95M neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.2vw", color: "#3D0E16", lineHeight: 1.5 }}>
        Ingresos netos = precio excl. IVA (19%) × 70% (comisión Apple/Google 30%) · ARPU neto blended ~$4.350/mes (mensual $8.990 → $5.288 neto · anual $59.990/12 → $2.941 neto equiv.) ·
        Contenido $0 en M1-2, $1,5M/mes desde M3 (25 sesiones × $60.000 promedio) ·
        Fijo + mkt: RRHH $2,8M + hosting $250K + otros $200K + marketing variable ·
        Inversión inicial $27M CLP no incluida · Break-even acumulado estimado mes 7–8.
      </div>
    </div>
  );
}
