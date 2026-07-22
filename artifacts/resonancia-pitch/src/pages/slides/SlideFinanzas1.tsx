export default function SlideFinanzas1() {
  // Curva: +400 subs/mes (M1=400 … M11=4400, M12=5000)
  // ARPU neto blended $3.250/mes · Fijos $3,9M/mes · mkt: M3-6 $0,5M · M7-8 $1,0M · M9-10 $1,25M · M11-12 $1,5M
  // Contenido: M1-2 $0 · M3-6 $1,2M · M7-12 $1,5M
  const rows = [
    { mes: "M1 Lanzamiento", subs: "400",   ingreso: "$1,3M",  costoFijo: "$3,9M", costoVar: "$0",    resultado: "–$2,6M", neg: true  },
    { mes: "Mes 2",          subs: "800",   ingreso: "$2,6M",  costoFijo: "$3,9M", costoVar: "$0",    resultado: "–$1,3M", neg: true  },
    { mes: "Mes 3",          subs: "1.200", ingreso: "$3,9M",  costoFijo: "$4,4M", costoVar: "$1,2M", resultado: "–$1,7M", neg: true  },
    { mes: "Mes 6",          subs: "2.400", ingreso: "$7,8M",  costoFijo: "$4,4M", costoVar: "$1,2M", resultado: "+$2,2M", neg: false },
    { mes: "Mes 9",          subs: "3.600", ingreso: "$11,7M", costoFijo: "$5,2M", costoVar: "$1,5M", resultado: "+$5,0M", neg: false },
    { mes: "Mes 12",         subs: "5.000", ingreso: "$16,3M", costoFijo: "$5,4M", costoVar: "$1,5M", resultado: "+$9,4M", neg: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 1 DE 3
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Flujo de caja <span style={{ color: "#FFFFFF" }}>post-lanzamiento.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(244,244,244,0.50)", marginTop: "1vh" }}>
          En millones de CLP · escenario base · M1 = día del lanzamiento · inversión ya desplegada en los 4 meses previos
        </div>
      </div>

      {/* Banner */}
      <div style={{
        backgroundColor: "rgba(0,0,0,0.27)",
        border: "1px solid rgba(255,255,255,0.22)",
        borderRadius: "0.6vw",
        padding: "0.9vh 1.4vw",
        display: "flex",
        alignItems: "center",
        gap: "1.5vw",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", flexShrink: 0 }}>PRE-LANZAMIENTO</div>
        <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.3 }}>
          Los 4 meses previos (M–4 a M–1) cubiertos íntegramente por la inversión inicial ($25M CLP): equipo trabajando, catálogo producido, app lista.
          <strong style={{ color: "#F4F4F4" }}> Break-even operacional: Mes 5.</strong>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1fr",
          padding: "1.4vh 1.2vw",
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          marginBottom: "0.5vh",
        }}>
          {["Período", "Suscriptores", "Ingresos netos", "Fijo + mkt", "Contenido", "Resultado mes"].map((h) => (
            <div key={h} style={{ fontSize: "1.15vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {rows.map((r, i) => (
          <div
            key={r.mes}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1fr",
              padding: "1.5vh 1.2vw",
              backgroundColor: (!r.neg && i > 0) ? "transparent" : (i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent"),
              borderRadius: "0.4vw",
              alignItems: "center",
              border: r.neg ? "1px solid rgba(224,112,112,0.14)" : "none",
            }}
          >
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4F4F4" }}>{r.mes}</div>
            <div style={{ fontSize: "1.4vw", color: "#F4F4F4" }}>{r.subs}</div>
            <div style={{ fontSize: "1.4vw", color: "#F4F4F4" }}>{r.ingreso}</div>
            <div style={{ fontSize: "1.4vw", color: "rgba(244,244,244,0.50)" }}>{r.costoFijo}</div>
            <div style={{ fontSize: "1.4vw", color: r.costoVar === "$0" ? "rgba(244,244,244,0.45)" : "rgba(244,244,244,0.50)" }}>{r.costoVar}</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 700, color: r.neg ? "#F4F4F4" : "#6EC49A" }}>{r.resultado}</div>
          </div>
        ))}

        {/* Totales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1fr",
          padding: "1.8vh 1.2vw",
          borderTop: "1px solid rgba(255,255,255,0.35)",
          marginTop: "0.8vh",
          backgroundColor: "rgba(0,0,0,0.14)",
          borderRadius: "0.6vw",
        }}>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "#FFFFFF" }}>AÑO 1 TOTAL</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "#F4F4F4" }}>5.000 al cierre</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "#F4F4F4" }}>~$102M</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>~$56M</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>~$14M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#6EC49A" }}>+$33M neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.15vw", color: "rgba(244,244,244,0.45)", lineHeight: 1.5 }}>
        Curva: +400 subs/mes (M1=400…M11=4.400, M12=5.000) · ARPU neto blended ~$3.250/mes · Precio $6.990/mes (IVA incl.) o $39.990/año ·
        Fijos: $3,9M/mes (RRHH $2,3M + operacionales $1,6M) · M3+: + mkt $0,5–1,5M + contenido $1,2–1,5M · Break-even operacional M5 · Inversión $25M ya incluida en pre-lanzamiento.
      </div>

    </div>
  );
}
