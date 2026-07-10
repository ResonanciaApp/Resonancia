export default function SlideFinanzas1() {
  // Curva: +400 subs/mes (M1=400 … M11=4400, M12=5000)
  // ARPU neto blended $4.350/mes · Fijos M1-2 $3,25M · M3+ $5,25M → $6,25M
  const rows = [
    { mes: "M1 Lanzamiento", subs: "400",   ingreso: "$1,74M",  costoFijo: "$3,25M", costoVar: "$0",    resultado: "–$1,51M", neg: true  },
    { mes: "Mes 2",          subs: "800",   ingreso: "$3,48M",  costoFijo: "$3,25M", costoVar: "$0",    resultado: "+$0,23M", neg: false },
    { mes: "Mes 3",          subs: "1.200", ingreso: "$5,22M",  costoFijo: "$3,75M", costoVar: "$1,5M", resultado: "–$0,03M", neg: true  },
    { mes: "Mes 6",          subs: "2.400", ingreso: "$10,44M", costoFijo: "$3,75M", costoVar: "$1,5M", resultado: "+$5,19M", neg: false },
    { mes: "Mes 9",          subs: "3.600", ingreso: "$15,66M", costoFijo: "$4,25M", costoVar: "$1,5M", resultado: "+$9,91M", neg: false },
    { mes: "Mes 12",         subs: "5.000", ingreso: "$21,75M", costoFijo: "$4,75M", costoVar: "$1,5M", resultado: "+$15,5M", neg: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #2E0D16 0%, #1A0810 100%)", color: "#F4DAD5", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 1 DE 3
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Flujo de caja <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>post-lanzamiento.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(242,231,228,0.50)", marginTop: "1vh" }}>
          En millones de CLP · escenario base · M1 = día del lanzamiento · inversión ya desplegada en los 3 meses previos
        </div>
      </div>

      {/* Banner */}
      <div style={{
        backgroundColor: "rgba(247,203,107,0.06)",
        border: "1px solid rgba(247,203,107,0.22)",
        borderRadius: "0.6vw",
        padding: "0.9vh 1.4vw",
        display: "flex",
        alignItems: "center",
        gap: "1.5vw",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#F7CB6B", letterSpacing: "0.1em", flexShrink: 0 }}>PRE-LANZAMIENTO</div>
        <div style={{ fontSize: "0.95vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.3 }}>
          Los 3 meses previos (M–3 a M–1) cubiertos íntegramente por la inversión inicial ($27M CLP): equipo trabajando, catálogo producido, app lista.
          <strong style={{ color: "#F4DAD5" }}> Break-even operacional: Mes 3.</strong>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1fr",
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
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1fr",
              padding: "1.5vh 1.2vw",
              backgroundColor: r.neg ? "rgba(224,112,112,0.04)" : i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              borderRadius: "0.4vw",
              alignItems: "center",
              border: r.neg ? "1px solid rgba(224,112,112,0.14)" : "none",
            }}
          >
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: r.neg ? "#F9F9F9" : "#F4DAD5" }}>{r.mes}</div>
            <div style={{ fontSize: "1.4vw", color: "#F4DAD5" }}>{r.subs}</div>
            <div style={{ fontSize: "1.4vw", color: "#F4DAD5" }}>{r.ingreso}</div>
            <div style={{ fontSize: "1.4vw", color: "rgba(242,231,228,0.50)" }}>{r.costoFijo}</div>
            <div style={{ fontSize: "1.4vw", color: r.costoVar === "$0" ? "#3D0E16" : "rgba(242,231,228,0.50)" }}>{r.costoVar}</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 700, color: r.neg ? "#F9F9F9" : "#6EC49A" }}>{r.resultado}</div>
          </div>
        ))}

        {/* Totales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1fr",
          padding: "1.8vh 1.2vw",
          borderTop: "1px solid rgba(247,203,107,0.35)",
          marginTop: "0.8vh",
          backgroundColor: "#1A0810",
          borderRadius: "0.6vw",
        }}>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>AÑO 1 TOTAL</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "#F4DAD5" }}>5.000 al cierre</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "#F4DAD5" }}>~$136M</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>~$47M</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>~$16M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#6EC49A" }}>+$73M neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.15vw", color: "#3D0E16", lineHeight: 1.5 }}>
        Curva: +400 subs/mes (M1=400…M11=4.400, M12=5.000) · ARPU neto blended ~$4.350/mes · Precio $8.990/mes (IVA incl.) o $59.990/año ·
        Fijos M1-2: $3,25M/mes; M3+: $3,75-4,75M/mes (contenido + mkt) · Break-even operacional M3 · Inversión $27M ya incluida en pre-lanzamiento.
      </div>
    </div>
  );
}
