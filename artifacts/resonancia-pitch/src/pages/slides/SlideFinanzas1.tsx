export default function SlideFinanzas1() {
  // Escenario base · 5.000 premium al M12 (1M seguidores → 20% free → 2,5% año 1 = 5.000; techo 5% = 10.000)
  // ARPU neto $3.300/mes · Fijos $3,05M/mes (incl. gerente $1,3M + otros $350K) · Contenido $0 M1-2; $2,0M desde M3
  // Marketing: $0→$0,5M→$1,0M→$1,5M · Costos totales: M1-2=$3,05M · M3-6=$5,55M · M7-9=$6,05M · M10-12=$6,55M
  const rows = [
    { mes: "Mes 1–2",  subs: "0 → 400",  ingreso: "– / $1,3M",  costoFijo: "$3,05M", costoVar: "$0",     resultado: "–$3,1M / –$1,7M", neg: true  },
    { mes: "Mes 3",    subs: "1.000",     ingreso: "$3,3M",       costoFijo: "$3,55M", costoVar: "$2,0M",  resultado: "–$2,3M",          neg: true  },
    { mes: "Mes 6",    subs: "3.300",     ingreso: "$10,9M",      costoFijo: "$3,55M", costoVar: "$2,0M",  resultado: "+$5,3M",          neg: false },
    { mes: "Mes 9",    subs: "4.500",     ingreso: "$14,9M",      costoFijo: "$4,05M", costoVar: "$2,0M",  resultado: "+$8,8M",          neg: false },
    { mes: "Mes 12",   subs: "5.000",     ingreso: "$16,5M",      costoFijo: "$4,55M", costoVar: "$2,0M",  resultado: "+$9,9M",          neg: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 1 DE 3
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Flujo de caja <span style={{ background: "linear-gradient(90deg, #FF6B3D, #FF9E4D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>año 1.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(242,231,228,0.50)", marginTop: "1vh" }}>
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
          borderBottom: "1px solid rgba(212,175,55,0.35)",
          marginBottom: "0.5vh",
        }}>
          {["Período", "Suscriptores", "Ingresos netos", "Fijo + mkt", "Contenido", "Resultado mes"].map((h) => (
            <div key={h} style={{ fontSize: "1.15vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.06em" }}>{h}</div>
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
            <div style={{ fontSize: "1.45vw", color: r.costoVar === "$0" ? "#3D4F62" : "rgba(242,231,228,0.50)" }}>{r.costoVar}</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 700, color: r.neg ? "#E07070" : "#6EC49A" }}>{r.resultado}</div>
          </div>
        ))}

        {/* Totales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
          padding: "1.8vh 1.2vw",
          borderTop: "1px solid rgba(212,175,55,0.35)",
          marginTop: "0.8vh",
          backgroundColor: "#27070E",
          borderRadius: "0.6vw",
        }}>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>AÑO 1 TOTAL</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#F4DAD5" }}>5.000 al cierre</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#F4DAD5" }}>~$121M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>~$46M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>~$20M</div>
          <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#6EC49A" }}>+$55M neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.2vw", color: "#3D4F62", lineHeight: 1.5 }}>
        Ingresos netos = precio excl. IVA (19%) × 70% (comisión Apple/Google 30%) · ARPU neto blended ~$3.300/mes ·
        Contenido $0 en M1-2, $2,0M/mes desde M3 (~28 sesiones × $70.000 promedio) ·
        Fijo + mkt: gerente $1,3M + coordinador $700K + hosting $250K + asesoría TI $200K + admin $250K + otros $350K + marketing variable ·
        Inversión inicial US$30.000 ($27M CLP) no incluida · Break-even acumulado estimado mes 10.
      </div>
    </div>
  );
}
