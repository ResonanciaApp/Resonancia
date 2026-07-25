export default function SlideFinanzas1() {
  // M1: 700 subs (lanzamiento) · M2+: +250/mes → 3.450 a M12
  // M1: ARPU rec $2.408 · lifetime boost $0.882M/mes
  // M2+: ARPU rec $3.116 · lifetime boost $1.323M/mes
  // Cursos M7+: $15.294/venta (post-tienda, post-tallerista/prod 35%)

  const rows = [
    { mes: "M1 Lanzamiento", subs: "700",   fase: "lanzamiento", ingTotal: "$2,6M",  upsell: "—",      costos: "$4,7M",  resultado: "–$2,1M", neg: true  },
    { mes: "Mes 3",          subs: "1.200", fase: "normal",      ingTotal: "$5,1M",  upsell: "—",      costos: "$6,4M",  resultado: "–$1,3M", neg: true  },
    { mes: "Mes 4",          subs: "1.450", fase: "normal",      ingTotal: "$5,8M",  upsell: "—",      costos: "$6,4M",  resultado: "–$0,6M", neg: true  },
    { mes: "Mes 5",          subs: "1.700", fase: "normal",      ingTotal: "$6,6M",  upsell: "—",      costos: "$6,4M",  resultado: "+$0,2M", neg: false },
    { mes: "Mes 9",          subs: "2.700", fase: "normal",      ingTotal: "$9,7M",  upsell: "+$1,5M", costos: "$7,45M", resultado: "+$3,8M", neg: false },
    { mes: "Mes 12",         subs: "3.450", fase: "normal",      ingTotal: "$12,1M", upsell: "+$2,0M", costos: "$7,7M",  resultado: "+$6,4M", neg: false },
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
          En millones de CLP · 700 suscriptores M1 · +250/mes desde M2 · Ingresos = recurrente + boost lifetime + up-sells
        </div>
      </div>

      {/* Phase legend */}
      <div style={{ display: "flex", gap: "1vw", flexShrink: 0 }}>
        <div style={{ flex: 1, backgroundColor: "rgba(190,150,80,0.09)", border: "1px solid rgba(190,150,80,0.30)", borderRadius: "0.5vw", padding: "0.55vh 1.1vw", display: "flex", alignItems: "baseline", gap: "0.8vw", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.09em", flexShrink: 0 }}>LANZAMIENTO M1</span>
          <span style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.50)" }}>ARPU rec. $2.408/sub · lifetime $0.882M/mes · precios $5.990 / $39.990 / $99.990</span>
        </div>
        <div style={{ flex: 1, backgroundColor: "rgba(110,196,154,0.06)", border: "1px solid rgba(110,196,154,0.25)", borderRadius: "0.5vw", padding: "0.55vh 1.1vw", display: "flex", alignItems: "baseline", gap: "0.8vw", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82vw", fontWeight: 700, color: "#6EC49A", letterSpacing: "0.09em", flexShrink: 0 }}>NORMAL M2+</span>
          <span style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.50)" }}>ARPU rec. $3.116/sub · lifetime $1.323M/mes · precios $7.990 / $49.990 / $149.990 · Cursos desde M7</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 0.75fr 0.45fr 0.85fr 0.7fr 0.8fr 0.85fr",
          padding: "0.7vh 0.9vw",
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          marginBottom: "0.3vh",
        }}>
          {["Período", "Suscriptores", "Fase", "Ing. totales", "Cursos", "Costos", "Resultado"].map((h) => (
            <div key={h} style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.05em" }}>{h}</div>
          ))}
        </div>

        {rows.map((r, i) => (
          <div key={r.mes} style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 0.75fr 0.45fr 0.85fr 0.7fr 0.8fr 0.85fr",
            padding: "0.95vh 0.9vw",
            backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
            borderRadius: "0.4vw",
            alignItems: "center",
            border: r.neg ? "1px solid rgba(224,112,112,0.10)" : "none",
          }}>
            <div style={{ fontSize: "1.15vw", fontWeight: 700, color: "#F4F4F4" }}>{r.mes}</div>
            <div style={{ fontSize: "1.15vw", color: "#F4F4F4" }}>{r.subs}</div>
            <div style={{ fontSize: "0.68vw", fontWeight: 700, color: r.fase === "lanzamiento" ? "#BE9650" : "#6EC49A", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {r.fase === "lanzamiento" ? "Lanz." : "Normal"}
            </div>
            <div style={{ fontSize: "1.15vw", color: "#F4F4F4" }}>{r.ingTotal}</div>
            <div style={{ fontSize: "1.05vw", color: r.upsell === "—" ? "rgba(244,244,244,0.28)" : "#6EC49A", fontWeight: r.upsell === "—" ? 400 : 700 }}>{r.upsell}</div>
            <div style={{ fontSize: "1.15vw", color: "rgba(244,244,244,0.50)" }}>{r.costos}</div>
            <div style={{ fontSize: "1.25vw", fontWeight: 700, color: r.neg ? "#F4F4F4" : "#6EC49A" }}>{r.resultado}</div>
          </div>
        ))}

        {/* Totales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 0.75fr 0.45fr 0.85fr 0.7fr 0.8fr 0.85fr",
          padding: "1.0vh 0.9vw",
          borderTop: "1px solid rgba(255,255,255,0.35)",
          marginTop: "0.5vh",
          backgroundColor: "rgba(0,0,0,0.14)",
          borderRadius: "0.5vw",
        }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FFFFFF" }}>AÑO 1 TOTAL</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4F4F4" }}>3.600 cierre</div>
          <div />
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4F4F4" }}>~$92M</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#6EC49A" }}>~$9M</div>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>~$80M</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#6EC49A" }}>+$22M neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ flexShrink: 0, fontSize: "0.88vw", color: "rgba(244,244,244,0.42)", lineHeight: 1.45 }}>
        Blend 35/60/5% · 300 nuevos suscriptores/mes · Break-even operacional M5 · Recuperación de caja acumulada M8 ·
        $92M subs+lifetime · $9M cursos · Total $101M · Costos $80M · Neto +$22M.
      </div>
    </div>
  );
}
