export default function SlideFinanzas1() {
  // Escenario base · 5.000 premium al M12 · Todo el capital desplegado ANTES del lanzamiento
  // Desde el día 1, la operación se cubre con ingresos de suscripciones
  // ARPU neto blended $4.350/mes · Fijos $3,25M/mes (RRHH $2,8M + hosting $250K + otros $200K)
  // Contenido $0 M1-2; $1,5M desde M3 · Marketing: $0→$0,5M→$1,0M→$1,5M
  // M1 = lanzamiento: app lista, equipo con 3 meses de trabajo previo, ~800 subs iniciales por hype de comunidad
  const rows = [
    { mes: "M1 Lanzamiento", subs: "~800",    ingreso: "$3,48M",   costoFijo: "$3,25M", costoVar: "$0",     resultado: "+$0,23M", neg: false },
    { mes: "Mes 2",          subs: "1.200",   ingreso: "$5,22M",   costoFijo: "$3,25M", costoVar: "$0",     resultado: "+$1,97M", neg: false },
    { mes: "Mes 3",          subs: "2.000",   ingreso: "$8,70M",   costoFijo: "$3,75M", costoVar: "$1,5M",  resultado: "+$3,45M", neg: false },
    { mes: "Mes 6",          subs: "3.500",   ingreso: "$15,23M",  costoFijo: "$3,75M", costoVar: "$1,5M",  resultado: "+$9,98M", neg: false },
    { mes: "Mes 9",          subs: "4.500",   ingreso: "$19,58M",  costoFijo: "$4,25M", costoVar: "$1,5M",  resultado: "+$13,83M", neg: false },
    { mes: "Mes 12",         subs: "5.000",   ingreso: "$21,75M",  costoFijo: "$4,75M", costoVar: "$1,5M",  resultado: "+$15,5M",  neg: false },
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
          Flujo de caja <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>post-lanzamiento.</span>
        </div>
        <div style={{ fontSize: "1.45vw", color: "rgba(242,231,228,0.50)", marginTop: "1vh" }}>
          En millones de CLP · escenario base · M1 = día del lanzamiento · inversión ya desplegada en los 3 meses previos
        </div>
      </div>

      {/* Banner: pre-launch already covered */}
      <div style={{
        backgroundColor: "rgba(110,196,154,0.06)",
        border: "1px solid rgba(110,196,154,0.25)",
        borderRadius: "0.6vw",
        padding: "0.9vh 1.4vw",
        display: "flex",
        alignItems: "center",
        gap: "1.5vw",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#6EC49A", letterSpacing: "0.1em", flexShrink: 0 }}>PRE-LANZAMIENTO</div>
        <div style={{ fontSize: "0.95vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.3 }}>
          Los 3 meses previos (M–3 a M–1) están cubiertos por la inversión inicial ($27M CLP):
          equipo trabajando, catálogo producido, app lista. <strong style={{ color: "#F4DAD5" }}>Desde M1, cero dependencia de capital externo.</strong>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header row */}
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
              backgroundColor: i === 0 ? "rgba(110,196,154,0.05)" : i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              borderRadius: "0.4vw",
              alignItems: "center",
              border: i === 0 ? "1px solid rgba(110,196,154,0.18)" : "none",
            }}
          >
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: i === 0 ? "#6EC49A" : "#F4DAD5" }}>{r.mes}</div>
            <div style={{ fontSize: "1.4vw", color: "#F4DAD5" }}>{r.subs}</div>
            <div style={{ fontSize: "1.4vw", color: "#F4DAD5" }}>{r.ingreso}</div>
            <div style={{ fontSize: "1.4vw", color: "rgba(242,231,228,0.50)" }}>{r.costoFijo}</div>
            <div style={{ fontSize: "1.4vw", color: r.costoVar === "$0" ? "#3D0E16" : "rgba(242,231,228,0.50)" }}>{r.costoVar}</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 700, color: r.neg ? "#E07070" : "#6EC49A" }}>{r.resultado}</div>
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
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "#F4DAD5" }}>~$172M</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>~$48,5M</div>
          <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "rgba(242,231,228,0.50)" }}>~$14M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#6EC49A" }}>+$109M neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.15vw", color: "#3D0E16", lineHeight: 1.5 }}>
        M1 lanzamiento: ~800 subs iniciales (comunidad de +1M seguidores previa) · Ingresos netos = precio excl. IVA × 70% (comisión tienda 30%) · ARPU neto blended ~$4.350/mes ·
        Contenido $0 en M1-2, $1,5M/mes desde M3 · Fijo + mkt: RRHH $2,8M + hosting $250K + otros $200K + marketing variable ·
        Inversión $27M ya incluida en pre-lanzamiento · Break-even de la inversión estimado mes 3–4.
      </div>
    </div>
  );
}
