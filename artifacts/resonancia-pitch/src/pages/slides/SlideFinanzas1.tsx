export default function SlideFinanzas1() {
  // Escenario base, hitos clave 24 meses
  // ARPU neto: $3.300/mes · Costos: $0 contenido M1-2; $1,5M/mes desde M3
  // Costos fijos (excl. mkt): $1.300K/mes · Marketing: $0→$0.5M→$1,0M→$1,5M→$2,0M→$2,5M
  const rows = [
    { mes: "Mes 1",  año: 1, subs: "0",       ingreso: "—",       costo: "$1,3M",   resultado: "–$1,3M",  neg: true  },
    { mes: "Mes 3",  año: 1, subs: "1.500",   ingreso: "$5,0M",   costo: "$3,3M",   resultado: "+$1,7M",  neg: false },
    { mes: "Mes 6",  año: 1, subs: "7.500",   ingreso: "$24,8M",  costo: "$3,3M",   resultado: "+$21,4M", neg: false },
    { mes: "Mes 9",  año: 1, subs: "13.000",  ingreso: "$42,9M",  costo: "$3,8M",   resultado: "+$39,1M", neg: false },
    { mes: "Mes 12", año: 1, subs: "15.000",  ingreso: "$49,5M",  costo: "$4,3M",   resultado: "+$45,2M", neg: false },
    { mes: "Mes 15", año: 2, subs: "21.000",  ingreso: "$69,3M",  costo: "$4,8M",   resultado: "+$64,5M", neg: false },
    { mes: "Mes 18", año: 2, subs: "30.000",  ingreso: "$99,0M",  costo: "$4,8M",   resultado: "+$94,2M", neg: false },
    { mes: "Mes 21", año: 2, subs: "39.000",  ingreso: "$128,7M", costo: "$5,3M",   resultado: "+$123,4M",neg: false },
    { mes: "Mes 24", año: 2, subs: "44.000",  ingreso: "$145,2M", costo: "$5,3M",   resultado: "+$139,9M",neg: false },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "7vh 6vw 5.5vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1vh" }}>
          ANEXO FINANCIERO · HOJA 1 DE 3
        </div>
        <div style={{ fontSize: "3.6vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Flujo de caja <span style={{ color: "#BE9650" }}>24 meses.</span>
        </div>
        <div style={{ fontSize: "1.35vw", color: "#7A8FA8", marginTop: "0.7vh" }}>
          En millones de pesos chilenos · TC $900/USD · escenario base · hitos clave
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0 }}>
        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 0.6fr 1fr 1fr 1fr",
          padding: "1.1vh 1.2vw",
          borderBottom: "1px solid rgba(190,150,80,0.35)",
          marginBottom: "0.3vh",
        }}>
          {["Período", "Año", "Suscriptores", "Ingresos netos", "Costos totales"].concat(["Resultado mes"]).map((h) => (
            <div key={h} style={{ fontSize: "1.05vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.06em" }}>{h}</div>
          ))}
        </div>

        {rows.map((r, i) => {
          const isY2Start = r.año === 2 && (i === 0 || rows[i - 1]?.año === 1);
          return (
            <div key={r.mes}>
              {isY2Start && (
                <div style={{
                  borderTop: "1px dashed rgba(190,150,80,0.25)",
                  margin: "0.4vh 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "1vw",
                  paddingLeft: "1.2vw",
                }}>
                  <div style={{ fontSize: "0.95vw", color: "rgba(190,150,80,0.5)", letterSpacing: "0.1em" }}>AÑO 2 →</div>
                </div>
              )}
              <div style={{
                display: "grid",
                gridTemplateColumns: "0.9fr 0.6fr 1fr 1fr 1fr",
                padding: "1.1vh 1.2vw",
                backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                borderRadius: "0.3vw",
                alignItems: "center",
              }}>
                <div style={{ fontSize: "1.35vw", fontWeight: 700, color: "#EDE1D3" }}>{r.mes}</div>
                <div style={{
                  fontSize: "0.95vw", fontWeight: 600,
                  color: r.año === 1 ? "#7A8FA8" : "#BE9650",
                  letterSpacing: "0.05em",
                }}>AÑO {r.año}</div>
                <div style={{ fontSize: "1.35vw", color: r.subs === "0" ? "#3D4F62" : "#EDE1D3" }}>{r.subs}</div>
                <div style={{ fontSize: "1.35vw", color: r.ingreso === "—" ? "#3D4F62" : "#EDE1D3" }}>{r.ingreso}</div>
                <div style={{ fontSize: "1.35vw", color: "#7A8FA8" }}>{r.costo}</div>
                <div style={{ fontSize: "1.45vw", fontWeight: 700, color: r.neg ? "#E07070" : "#6EC49A" }}>{r.resultado}</div>
              </div>
            </div>
          );
        })}

        {/* Year totals */}
        <div style={{ display: "flex", gap: "1.2vw", marginTop: "1.2vh" }}>
          {[
            { label: "AÑO 1 TOTAL", subs: "15.000 al cierre", ing: "$314M CLP", costo: "$40M", neto: "+$274M neto", subUSD: "≈ US$ 304K" },
            { label: "AÑO 2 TOTAL", subs: "44.000 al cierre", ing: "$1.229M CLP", costo: "$61M", neto: "+$1.168M neto", subUSD: "≈ US$ 1,3M" },
          ].map((t) => (
            <div key={t.label} style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              padding: "1.3vh 1.2vw",
              backgroundColor: "#090E17",
              border: "1px solid rgba(190,150,80,0.3)",
              borderRadius: "0.6vw",
              alignItems: "center",
              gap: "0.5vw",
            }}>
              <div>
                <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#BE9650" }}>{t.label}</div>
                <div style={{ fontSize: "0.95vw", color: "#7A8FA8", marginTop: "0.3vh" }}>{t.subs}</div>
              </div>
              <div>
                <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#EDE1D3" }}>{t.ing}</div>
                <div style={{ fontSize: "0.9vw", color: "#3D4F62" }}>{t.subUSD}</div>
              </div>
              <div style={{ fontSize: "1.1vw", color: "#7A8FA8" }}>{t.costo} costos</div>
              <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#6EC49A" }}>{t.neto}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footnote */}
      <div style={{ fontSize: "1.1vw", color: "#3D4F62", lineHeight: 1.5 }}>
        Ingresos netos = precio bruto (excl. IVA 19%) × 70% (comisión Apple/Google 30%) · ARPU neto blended ~$3.300/mes · Contenido $0 en M1-2, $1,5M/mes desde M3 ·
        Costos fijos $1,3M/mes · Marketing $0→$0,5M→$1,0M→$1,5M→$2,0M→$2,5M según fase · Inversión inicial US$25.000 ($22,5M CLP) no incluida.
      </div>
    </div>
  );
}
