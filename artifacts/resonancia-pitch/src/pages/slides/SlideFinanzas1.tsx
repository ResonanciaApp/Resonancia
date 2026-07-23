export default function SlideFinanzas1() {
  // Estrategia dos fases:
  // M1-M3 (lanzamiento): mensual $5.990 · anual $39.990 · lifetime $99.990
  //   ARPU recurrente: 30%×$3.517 + 60%×$1.961 = $2.232/sub/mes
  //   Lifetime new: 40 nuevos sub/mes × $58.817 neto = $2.353M/mes adicional
  // M4+ (normal): mensual $7.990 · anual $49.990 · lifetime $149.990
  //   ARPU recurrente: 30%×$4.700 + 60%×$2.451 = $2.881/sub/mes
  //   Lifetime new: 40 nuevos sub/mes × $88.229 neto = $3.529M/mes adicional
  // Up-sells (cursos): M7+ · neto $23.529/curso
  // Ingresos totales mes = subs × ARPU_rec + lifetime_boost + cursos

  const rows = [
    { mes: "M1 Lanzamiento", subs: "400",   fase: "lanzamiento", ingTotal: "$3,2M",  upsell: "—",      costos: "$3,9M", resultado: "–$0,7M", neg: true  },
    { mes: "Mes 2",          subs: "800",   fase: "lanzamiento", ingTotal: "$4,1M",  upsell: "—",      costos: "$3,9M", resultado: "+$0,2M", neg: false },
    { mes: "Mes 3",          subs: "1.200", fase: "lanzamiento", ingTotal: "$5,0M",  upsell: "—",      costos: "$5,6M", resultado: "–$0,6M", neg: true  },
    { mes: "Mes 4",          subs: "1.600", fase: "normal",      ingTotal: "$8,1M",  upsell: "—",      costos: "$5,6M", resultado: "+$2,5M", neg: false },
    { mes: "Mes 9",          subs: "3.600", fase: "normal",      ingTotal: "$13,9M", upsell: "+$2,4M", costos: "$6,65M", resultado: "+$9,7M", neg: false },
    { mes: "Mes 12",         subs: "5.000", fase: "normal",      ingTotal: "$17,9M", upsell: "+$3,1M", costos: "$6,9M", resultado: "+$14,1M", neg: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "7vh 6vw 6vh", boxSizing: "border-box" }}
    >
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 1 DE 3
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Flujo de caja <span style={{ color: "#FFFFFF" }}>post-lanzamiento.</span>
        </div>
        <div style={{ fontSize: "1.35vw", color: "rgba(244,244,244,0.50)", marginTop: "0.8vh" }}>
          En millones de CLP · M1 = día del lanzamiento · Ingresos = subs recurrente + boost lifetime + up-sells
        </div>
      </div>

      {/* Banner con legend de fases */}
      <div style={{
        display: "flex",
        gap: "1.2vw",
        flexShrink: 0,
      }}>
        <div style={{
          flex: 1,
          backgroundColor: "rgba(190,150,80,0.10)",
          border: "1px solid rgba(190,150,80,0.35)",
          borderRadius: "0.6vw",
          padding: "0.8vh 1.2vw",
        }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "0.3vh" }}>FASE LANZAMIENTO · M1–M3</div>
          <div style={{ fontSize: "0.88vw", color: "rgba(244,244,244,0.55)" }}>
            Mensual $5.990 · Anual $39.990 · Lifetime $99.990 · ARPU rec. $2.232/sub · Boost $2.4M/mes (lifetime) · Break-even: <strong style={{ color: "#F4F4F4" }}>Mes 2</strong>
          </div>
        </div>
        <div style={{
          flex: 1,
          backgroundColor: "rgba(110,196,154,0.07)",
          border: "1px solid rgba(110,196,154,0.30)",
          borderRadius: "0.6vw",
          padding: "0.8vh 1.2vw",
        }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#6EC49A", letterSpacing: "0.1em", marginBottom: "0.3vh" }}>FASE NORMAL · M4+</div>
          <div style={{ fontSize: "0.88vw", color: "rgba(244,244,244,0.55)" }}>
            Mensual $7.990 · Anual $49.990 · Lifetime $149.990 · ARPU rec. $2.881/sub · Boost $3.5M/mes · Cursos desde M7
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 0.8fr 0.5fr 0.9fr 0.8fr 0.85fr",
          padding: "1.0vh 1.0vw",
          borderBottom: "1px solid rgba(255,255,255,0.35)",
          marginBottom: "0.5vh",
        }}>
          {["Período", "Suscriptores", "Fase", "Ing. totales", "Cursos", "Costos", "Resultado"].map((h) => (
            <div key={h} style={{ fontSize: "1.0vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.05em" }}>{h}</div>
          ))}
        </div>

        {rows.map((r, i) => (
          <div
            key={r.mes}
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 0.8fr 0.5fr 0.9fr 0.8fr 0.85fr",
              padding: "1.2vh 1.0vw",
              backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              borderRadius: "0.4vw",
              alignItems: "center",
              border: r.neg ? "1px solid rgba(224,112,112,0.12)" : "none",
            }}
          >
            <div style={{ fontSize: "1.25vw", fontWeight: 700, color: "#F4F4F4" }}>{r.mes}</div>
            <div style={{ fontSize: "1.25vw", color: "#F4F4F4" }}>{r.subs}</div>
            <div style={{
              fontSize: "0.75vw",
              fontWeight: 700,
              color: r.fase === "lanzamiento" ? "#BE9650" : "#6EC49A",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>{r.fase === "lanzamiento" ? "Lanz." : "Normal"}</div>
            <div style={{ fontSize: "1.25vw", color: "#F4F4F4" }}>{r.ingTotal}</div>
            <div style={{ fontSize: "1.1vw", color: r.upsell === "—" ? "rgba(244,244,244,0.28)" : "#6EC49A", fontWeight: r.upsell === "—" ? 400 : 700 }}>{r.upsell}</div>
            <div style={{ fontSize: "1.25vw", color: "rgba(244,244,244,0.50)" }}>{r.costos}</div>
            <div style={{ fontSize: "1.35vw", fontWeight: 700, color: r.neg ? "#F4F4F4" : "#6EC49A" }}>{r.resultado}</div>
          </div>
        ))}

        {/* Totales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 0.8fr 0.5fr 0.9fr 0.8fr 0.85fr",
          padding: "1.4vh 1.0vw",
          borderTop: "1px solid rgba(255,255,255,0.35)",
          marginTop: "0.8vh",
          backgroundColor: "rgba(0,0,0,0.14)",
          borderRadius: "0.6vw",
        }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#FFFFFF" }}>AÑO 1 TOTAL</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#F4F4F4" }}>5.000 cierre</div>
          <div />
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#F4F4F4" }}>~$128M</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#6EC49A" }}>~$14M</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>~$70M</div>
          <div style={{ fontSize: "1.35vw", fontWeight: 700, color: "#6EC49A" }}>+$72M neto</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.45)", lineHeight: 1.5 }}>
        Ingresos totales = subs × ARPU recurrente (30% mensual + 60% anual) + 40 nuevos lifetime/mes × neto + cursos M7–M12 ·
        $128M subs+lifetime · $14M cursos · Total $142M · Costos $70M · Neto +$72M · Break-even op. M2 (dip M3 por mkt, recupera M4).
      </div>

    </div>
  );
}
