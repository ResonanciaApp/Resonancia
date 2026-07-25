export default function SlidePrecios() {
  // Blend 35/60/5
  const pricingRows = [
    { plan: "Mensual",  pct: "35%", launch: "$5.990",   launchNeto: "$3.517/mes",     normal: "$7.990",   normalNeto: "$4.700/mes" },
    { plan: "Anual",   pct: "60%", launch: "$39.990",  launchNeto: "$1.961/mes eq.", normal: "$49.990",  normalNeto: "$2.451/mes eq." },
    { plan: "Lifetime",pct: "5%",  launch: "$99.990",  launchNeto: "$58.817 único",   normal: "$149.990", normalNeto: "$88.229 único" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "7vh 6vw 5vh", boxSizing: "border-box", gap: "2.4vh" }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.6vh" }}>
          MODELO DE NEGOCIO
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Estrategia de <span style={{ color: "#FFFFFF" }}>precios.</span>
        </div>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.45)", marginTop: "0.6vh" }}>
          Precio de lanzamiento el primer mes, precio normal desde el mes 2 · mix estimado 35/60/5.
        </div>
      </div>

      {/* Pricing table */}
      <div style={{
        flexShrink: 0,
        backgroundColor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "0.6vw", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "0.9fr 0.45fr 1.05fr 1.0fr 1.05fr 1.0fr",
          backgroundColor: "rgba(255,255,255,0.06)", padding: "1.1vh 1.3vw",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          {["Plan", "Mix", "Lanzamiento (M1)", "Neto empresa", "Normal (M2+)", "Neto empresa"].map((h, i) => (
            <div key={i} style={{ fontSize: "0.95vw", fontWeight: 700, letterSpacing: "0.06em",
              color: i >= 2 && i <= 3 ? "#BE9650" : i >= 4 ? "#6EC49A" : "#FFFFFF" }}>{h}</div>
          ))}
        </div>
        {pricingRows.map((r, i) => (
          <div key={r.plan} style={{
            display: "grid", gridTemplateColumns: "0.9fr 0.45fr 1.05fr 1.0fr 1.05fr 1.0fr",
            padding: "1.5vh 1.3vw", alignItems: "center",
            backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
            borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div style={{ fontSize: "1.25vw", fontWeight: 700, color: "#F4F4F4" }}>{r.plan}</div>
            <div style={{ fontSize: "1.25vw", fontWeight: 700, color: "rgba(244,244,244,0.50)" }}>{r.pct}</div>
            <div style={{ fontSize: "1.25vw", color: "#F4F4F4" }}>{r.launch}</div>
            <div style={{ fontSize: "1.05vw", color: "#BE9650", fontWeight: 600 }}>{r.launchNeto}</div>
            <div style={{ fontSize: "1.25vw", color: "#F4F4F4" }}>{r.normal}</div>
            <div style={{ fontSize: "1.05vw", color: "#6EC49A", fontWeight: 600 }}>{r.normalNeto}</div>
          </div>
        ))}
        {/* ARPU row */}
        <div style={{
          display: "grid", gridTemplateColumns: "0.9fr 0.45fr 1.05fr 1.0fr 1.05fr 1.0fr",
          padding: "1.2vh 1.3vw", backgroundColor: "rgba(0,0,0,0.18)",
          borderTop: "1px solid rgba(255,255,255,0.14)", alignItems: "center",
        }}>
          <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", gridColumn: "1/3" }}>ARPU RECURRENTE BLENDED</div>
          <div style={{ gridColumn: "3/5", display: "flex", alignItems: "center", gap: "0.5vw" }}>
            <span style={{ fontSize: "1.35vw", fontWeight: 700, color: "#BE9650" }}>$2.408/mes/sub</span>
            <span style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.38)" }}>+ $1.18M boost lifetime/mes</span>
          </div>
          <div style={{ gridColumn: "5/7", display: "flex", alignItems: "center", gap: "0.5vw" }}>
            <span style={{ fontSize: "1.35vw", fontWeight: 700, color: "#6EC49A" }}>$3.116/mes/sub</span>
            <span style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.38)" }}>+ $1.77M boost lifetime/mes</span>
          </div>
        </div>
      </div>

      {/* IVA note */}
      <div style={{ flexShrink: 0, fontSize: "1.0vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.45 }}>
        Neto = precio ÷ 1,19 (IVA 19% Chile, Ley 21.210) × 70% (comisión Apple/Google 30%) · Mensual y anual = recurrente · Lifetime = pago único, no renueva.
      </div>
    </div>
  );
}
