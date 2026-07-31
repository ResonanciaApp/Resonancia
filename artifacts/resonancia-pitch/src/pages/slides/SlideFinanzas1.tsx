export default function SlideFinanzas1() {
  // 300 subs nuevos/mes → 3.600 a M12
  // Blend 35/65 sin lifetime
  // M1: ARPU rec $2.506 · M2+: ARPU rec $3.238
  // Cursos M7+: $15.294/venta (post-tienda, post-tallerista/prod 35%)

  const rows = [
    { mes: "M1 Lanzamiento", subs: "300",   fase: "lanzamiento", ingTotal: "$0,8M",  upsell: "—",      costos: "$4,3M",  mkt: "—", resultado: "–$3,6M", neg: true  },
    { mes: "Mes 2",          subs: "600",   fase: "normal",      ingTotal: "$1,9M",  upsell: "—",      costos: "$4,3M",  mkt: "—", resultado: "–$2,4M", neg: true  },
    { mes: "Mes 3",          subs: "900",   fase: "normal",      ingTotal: "$2,9M",  upsell: "—",      costos: "$4,8M",  mkt: "—", resultado: "–$2,0M", neg: true  },
    { mes: "Mes 4",          subs: "1.200", fase: "normal",      ingTotal: "$3,9M",  upsell: "—",      costos: "$4,8M",  mkt: "$0", resultado: "–$1,0M", neg: true  },
    { mes: "Mes 5",          subs: "1.500", fase: "normal",      ingTotal: "$4,9M",  upsell: "—",      costos: "$4,8M",  mkt: "$0", resultado: "–$0,1M", neg: true  },
    { mes: "Mes 6",          subs: "1.800", fase: "normal",      ingTotal: "$5,8M",  upsell: "—",      costos: "$4,8M",  mkt: "$0", resultado: "+$0,9M", neg: false },
    { mes: "Mes 7",          subs: "2.100", fase: "normal",      ingTotal: "$6,8M",  upsell: "+$0,9M", costos: "$6,2M",  mkt: "$1,0M", resultado: "+$0,5M", neg: false },
    { mes: "Mes 8",          subs: "2.400", fase: "normal",      ingTotal: "$7,8M",  upsell: "+$1,2M", costos: "$6,2M",  mkt: "$1,0M", resultado: "+$1,8M", neg: false },
    { mes: "Mes 9",          subs: "2.700", fase: "normal",      ingTotal: "$8,7M",  upsell: "+$1,5M", costos: "$6,4M",  mkt: "$1,8M", resultado: "+$2,1M", neg: false },
    { mes: "Mes 10",         subs: "3.000", fase: "normal",      ingTotal: "$9,7M",  upsell: "+$1,7M", costos: "$6,4M",  mkt: "$1,8M", resultado: "+$3,2M", neg: false },
    { mes: "Mes 11",         subs: "3.300", fase: "normal",      ingTotal: "$10,7M", upsell: "+$1,8M", costos: "$6,4M",  mkt: "$2,0M", resultado: "+$4,1M", neg: false },
    { mes: "Mes 12",         subs: "3.600", fase: "normal",      ingTotal: "$11,7M", upsell: "+$2,0M", costos: "$6,4M",  mkt: "$2,0M", resultado: "+$5,2M", neg: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "3.5vh 5.5vw 3vh", boxSizing: "border-box", gap: "1.2vh" }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.2vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.4vh" }}>
          ANEXO FINANCIERO · HOJA 1 DE 3
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Flujo de caja <span style={{ color: "#FFFFFF" }}>post-lanzamiento.</span>
        </div>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.50)", marginTop: "0.4vh" }}>
          En millones de CLP · 300 suscriptores nuevos/mes · 3.600 al cierre · Ingresos = recurrente + up-sells
        </div>
      </div>

      {/* Phase legend */}
      <div style={{ display: "flex", gap: "1vw", flexShrink: 0 }}>
        <div style={{ flex: 1, backgroundColor: "rgba(214,164,92,0.09)", border: "1px solid rgba(214,164,92,0.30)", borderRadius: "0.5vw", padding: "0.55vh 1.1vw", display: "flex", alignItems: "baseline", gap: "0.8vw", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82vw", fontWeight: 700, backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "0.09em", flexShrink: 0 }}>LANZAMIENTO M1</span>
          <span style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.50)" }}>ARPU rec. $2.506/sub · precios $5.990 / $39.990</span>
        </div>
        <div style={{ flex: 1, backgroundColor: "rgba(110,196,154,0.06)", border: "1px solid rgba(110,196,154,0.25)", borderRadius: "0.5vw", padding: "0.55vh 1.1vw", display: "flex", alignItems: "baseline", gap: "0.8vw", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82vw", fontWeight: 700, color: "#6EC49A", letterSpacing: "0.09em", flexShrink: 0 }}>NORMAL M2+</span>
          <span style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.50)" }}>ARPU rec. $3.238/sub · precios $7.990 / $49.990 · Cursos desde M7</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.7fr 0.42fr 0.8fr 0.62fr 0.7fr 0.72fr 0.8fr",
          padding: "0.7vh 0.9vw",
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          marginBottom: "0.3vh",
        }}>
          {["Período", "Suscriptores", "Fase", "Ing. totales", "Cursos", "Costos", "Marketing", "Resultado"].map((h) => (
            <div key={h} style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.05em" }}>{h}</div>
          ))}
        </div>

        {rows.map((r, i) => (
          <div key={r.mes} style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.7fr 0.42fr 0.8fr 0.62fr 0.7fr 0.72fr 0.8fr",
            padding: "0.42vh 0.9vw",
            backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
            borderRadius: "0.4vw",
            alignItems: "center",
            border: r.neg ? "1px solid rgba(224,112,112,0.10)" : "none",
          }}>
            <div style={{ fontSize: "0.98vw", fontWeight: 700, color: "#F4F4F4" }}>{r.mes}</div>
            <div style={{ fontSize: "0.98vw", color: "#F4F4F4" }}>{r.subs}</div>
            <div style={{ fontSize: "0.68vw", fontWeight: 700, color: r.fase === "lanzamiento" ? "#D6A45C" : "#6EC49A", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {r.fase === "lanzamiento" ? "Lanz." : "Normal"}
            </div>
            <div style={{ fontSize: "0.98vw", color: "#F4F4F4" }}>{r.ingTotal}</div>
            <div style={{ fontSize: "0.95vw", color: r.upsell === "—" ? "rgba(244,244,244,0.28)" : "#6EC49A", fontWeight: r.upsell === "—" ? 400 : 700 }}>{r.upsell}</div>
            <div style={{ fontSize: "0.98vw", color: "rgba(244,244,244,0.50)" }}>{r.costos}</div>
            <div style={{ fontSize: "0.95vw", color: r.mkt === "—" || r.mkt === "$0" ? "rgba(244,244,244,0.28)" : "#D6A45C", fontWeight: r.mkt === "—" || r.mkt === "$0" ? 400 : 700 }}>{r.mkt}</div>
            <div style={{ fontSize: "1.05vw", fontWeight: 700, color: r.neg ? "#F4F4F4" : "#6EC49A" }}>{r.resultado}</div>
          </div>
        ))}

        {/* Totales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.7fr 0.42fr 0.8fr 0.62fr 0.7fr 0.72fr 0.8fr",
          padding: "1.0vh 0.9vw",
          borderTop: "1px solid rgba(255,255,255,0.35)",
          marginTop: "0.5vh",
          backgroundColor: "rgba(0,0,0,0.14)",
          borderRadius: "0.5vw",
        }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FFFFFF" }}>AÑO 1 TOTAL</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4F4F4" }}>3.600 cierre</div>
          <div />
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4F4F4" }}>~$76M</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#6EC49A" }}>~$9M</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>~$66M</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>~$10M</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#6EC49A" }}>+$9M neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ flexShrink: 0, fontSize: "0.88vw", color: "rgba(244,244,244,0.42)", lineHeight: 1.45 }}>
        Blend 35/65% (sin lifetime) · 300 nuevos suscriptores/mes · Marketing escalonado: el gasto fuerte parte en M9, cuando la operación ya es rentable ·
        Break-even operacional M6 · Recuperación de caja acumulada M11 · $76M suscripciones · $9M cursos · Total $85M · Costos $66M + Marketing $10M = $76M · Neto +$9M · Marketing M1–M3 financiado con la ronda ($1M + $1M + $0,5M, no aparece en la tabla) ·
        Vista conservadora: el plan anual (65%) se reconoce mes a mes; en caja real ese ingreso entra por adelantado.
      </div>
    </div>
  );
}
