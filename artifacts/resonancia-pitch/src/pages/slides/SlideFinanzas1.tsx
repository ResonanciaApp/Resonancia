export default function SlideFinanzas1() {
  // Curva: +400 subs/mes (M1=400 … M11=4400, M12=5000)
  // ARPU neto blended $4.350/mes · Fijos $4,5M/mes · + mkt M3-6 $0,5M · M9 $1,0M · M12 $1,5M
  const rows = [
    { mes: "M1 Lanzamiento", subs: "400",   ingreso: "$1,74M",  costoFijo: "$4,5M", costoVar: "$0",    resultado: "–$2,76M", neg: true  },
    { mes: "Mes 2",          subs: "800",   ingreso: "$3,48M",  costoFijo: "$4,5M", costoVar: "$0",    resultado: "–$1,02M", neg: true  },
    { mes: "Mes 3",          subs: "1.200", ingreso: "$5,22M",  costoFijo: "$5,0M", costoVar: "$1,5M", resultado: "–$1,28M", neg: true  },
    { mes: "Mes 6",          subs: "2.400", ingreso: "$10,44M", costoFijo: "$5,0M", costoVar: "$1,5M", resultado: "+$3,94M", neg: false },
    { mes: "Mes 9",          subs: "3.600", ingreso: "$15,66M", costoFijo: "$5,5M", costoVar: "$1,5M", resultado: "+$8,66M", neg: false },
    { mes: "Mes 12",         subs: "5.000", ingreso: "$21,75M", costoFijo: "$6,0M", costoVar: "$1,5M", resultado: "+$14,25M", neg: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #2d1c52 0%, #24245d 33%, #1f2a62 66%, #2d4081 100%)", color: "#F4F4F4", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
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
          Los 4 meses previos (M–4 a M–1) cubiertos íntegramente por la inversión inicial ($29,7M CLP): equipo trabajando, catálogo producido, app lista.
          <strong style={{ color: "#F4F4F4" }}> Break-even operacional: Mes 4.</strong>
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
              backgroundColor: (i === 0 || i === 2) ? "rgba(255,255,255,0.025)" : r.neg ? "rgba(224,112,112,0.04)" : i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              borderRadius: "0.4vw",
              alignItems: "center",
              border: r.neg && i !== 0 && i !== 2 ? "1px solid rgba(224,112,112,0.14)" : "none",
            }}
          >
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: r.neg ? "#F4F4F4" : "#F4F4F4" }}>{r.mes}</div>
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
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "#F4F4F4" }}>~$136M</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>~$63M</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>~$15M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#6EC49A" }}>+$58M neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.15vw", color: "rgba(244,244,244,0.45)", lineHeight: 1.5 }}>
        Curva: +400 subs/mes (M1=400…M11=4.400, M12=5.000) · ARPU neto blended ~$4.350/mes · Precio $8.990/mes (IVA incl.) o $59.990/año ·
        Fijos: $4,5M/mes (RRHH $3,0M + operacionales $1,5M) · M3+: + mkt $0,5-1,5M + contenido $1,5M · Break-even operacional M4 · Inversión $29,7M ya incluida en pre-lanzamiento.
      </div>

      {/* Pulso 4 · logo esquina */}
      <div style={{ position: "absolute", top: "3.5vh", right: "3vw", zIndex: 200, pointerEvents: "none" }}>
        <img src={`${import.meta.env.BASE_URL}logo-pulso4.png`} alt="Pulso 4" style={{ height: "4.5vh", opacity: 0.50, display: "block" }} />
      </div>
    </div>
  );
}
