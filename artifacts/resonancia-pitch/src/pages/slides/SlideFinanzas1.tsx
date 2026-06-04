export default function SlideFinanzas1() {
  const rows = [
    { mes: "Mes 1–2",   subs: "—",        ingreso: "—",         costoFijo: "1,3M",  costoVar: "1,5M",  resultado: "–2,8M",   neg: true },
    { mes: "Mes 3",     subs: "800",       ingreso: "1,7M",      costoFijo: "1,9M",  costoVar: "2,0M",  resultado: "–2,2M",   neg: true },
    { mes: "Mes 6",     subs: "3.500",     ingreso: "7,4M",      costoFijo: "1,9M",  costoVar: "2,5M",  resultado: "+3,0M",   neg: false },
    { mes: "Mes 9",     subs: "7.000",     ingreso: "14,7M",     costoFijo: "1,9M",  costoVar: "3,0M",  resultado: "+9,8M",   neg: false },
    { mes: "Mes 12",    subs: "11.000",    ingreso: "23,1M",     costoFijo: "1,9M",  costoVar: "3,6M",  resultado: "+17,6M",  neg: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "8vh 6vw 7vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
          ANEXO FINANCIERO · HOJA 1 DE 2
        </div>
        <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Flujo de caja <span style={{ color: "#BE9650" }}>año 1.</span>
        </div>
        <div style={{ fontSize: "1.5vw", color: "#7A8FA8", marginTop: "1vh" }}>
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
          borderBottom: "1px solid rgba(190,150,80,0.35)",
          marginBottom: "0.5vh",
        }}>
          {["Período", "Suscriptores", "Ingresos netos", "Costos fijos", "Costos contenido", "Resultado mes"].map((h) => (
            <div key={h} style={{ fontSize: "1.15vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {rows.map((r, i) => (
          <div
            key={r.mes}
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
              padding: "1.5vh 1.2vw",
              backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
              borderRadius: "0.4vw",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#EDE1D3" }}>{r.mes}</div>
            <div style={{ fontSize: "1.45vw", color: r.subs === "—" ? "#3D4F62" : "#EDE1D3" }}>{r.subs}</div>
            <div style={{ fontSize: "1.45vw", color: r.ingreso === "—" ? "#3D4F62" : "#EDE1D3" }}>{r.ingreso}</div>
            <div style={{ fontSize: "1.45vw", color: "#7A8FA8" }}>{r.costoFijo}</div>
            <div style={{ fontSize: "1.45vw", color: "#7A8FA8" }}>{r.costoVar}</div>
            <div style={{
              fontSize: "1.6vw",
              fontWeight: 700,
              color: r.neg ? "#E07070" : "#6EC49A",
            }}>{r.resultado}</div>
          </div>
        ))}

        {/* Totales */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 1fr 1fr 1fr",
          padding: "1.8vh 1.2vw",
          borderTop: "1px solid rgba(190,150,80,0.35)",
          marginTop: "0.8vh",
          backgroundColor: "#090E17",
          borderRadius: "0.6vw",
        }}>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#BE9650" }}>AÑO 1 TOTAL</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#EDE1D3" }}>11.000 al cierre</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#EDE1D3" }}>~$120M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#7A8FA8" }}>~$20M</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#7A8FA8" }}>~$30M</div>
          <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#6EC49A" }}>+$47M acum.</div>
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.2vw", color: "#3D4F62", lineHeight: 1.5 }}>
        Ingresos netos = ingreso bruto × 0,70 (comisión Apple/Google 30%) · Costos fijos: coordinador $700K + hosting $150K + asesoría TI $200K + admin/oficina $250K + marketing $600K ·
        Costos contenido: $80 USD/artista-sesión + $50 USD/voz-sesión · Inversión inicial US$25.000 ($22,5M CLP) no incluida en esta tabla.
      </div>
    </div>
  );
}
