export default function SlideUpSells() {
  // Neto por curso:
  // $40.000 / 1.19 (IVA) × 0.70 (Apple 30%) = $23.529 neto post-tienda
  // $23.529 × (1 - 0.35) = $15.294 neto final (35% pago tallerista + producción video)
  const TICKET_BRUTO   = 40_000;
  const NETO_POST_TIENDA = Math.round((TICKET_BRUTO / 1.19) * 0.70); // $23.529
  const COSTO_TALLERISTA = Math.round(NETO_POST_TIENDA * 0.35);       // $8.235
  const NETO_POR_VENTA   = NETO_POST_TIENDA - COSTO_TALLERISTA;       // $15.294

  const curva = [
    { mes: "M7",  cursos: 60,  label: "Lanzamiento cursos" },
    { mes: "M8",  cursos: 80,  label: "" },
    { mes: "M9",  cursos: 100, label: "" },
    { mes: "M10", cursos: 110, label: "" },
    { mes: "M11", cursos: 120, label: "" },
    { mes: "M12", cursos: 130, label: "Full velocidad" },
  ];
  const totalCursos = curva.reduce((s, r) => s + r.cursos, 0);
  const totalNeto   = totalCursos * NETO_POR_VENTA;
  const maxCursos   = Math.max(...curva.map((r) => r.cursos));

  const formatM = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${Math.round(n / 1000)}k`;

  const desglose = [
    { label: "Precio usuario (IVA incl.)",  value: `$${TICKET_BRUTO.toLocaleString("es-CL")}`,         sub: "ticket promedio",       highlight: false },
    { label: "Desc. IVA 19%",               value: `$${Math.round(TICKET_BRUTO / 1.19).toLocaleString("es-CL")}`, sub: "precio sin impuesto",   highlight: false },
    { label: "Comisión Apple/Google 30%",   value: `$${NETO_POST_TIENDA.toLocaleString("es-CL")}`,      sub: "neto post-tienda",      highlight: false },
    { label: "Tallerista + prod. video 35%",value: `–$${COSTO_TALLERISTA.toLocaleString("es-CL")}`,    sub: "pago instructor + edición", cost: true },
    { label: "Neto recibido por venta",     value: `$${NETO_POR_VENTA.toLocaleString("es-CL")}`,       sub: "en caja empresa",       highlight: true  },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "5vh 6vw 4.5vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.7vh" }}>
          SEGUNDA FUENTE DE INGRESOS
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Cursos y talleres <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>dentro de la app.</span>
        </div>
        <div style={{ fontSize: "1.3vw", color: "rgba(244,244,244,0.50)", marginTop: "0.8vh" }}>
          Up-sell directo a la base premium · sin costo de adquisición adicional · pago único por contenido
        </div>
      </div>

      {/* Main: left breakdown + right chart */}
      <div style={{ display: "flex", gap: "3vw", flex: 1, minHeight: 0, marginTop: "2vh" }}>

        {/* Left: desglose precio + KPIs */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5vh" }}>

          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em" }}>DESGLOSE PRECIO POR VENTA</div>
          <div style={{
            backgroundColor: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "0.8vw", overflow: "hidden",
          }}>
            {desglose.map((d, i) => (
              <div
                key={d.label}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.95vh 1.2vw",
                  backgroundColor: d.highlight ? "rgba(110,196,154,0.08)" : d.cost ? "rgba(224,112,112,0.05)" : i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: "1.0vw", color: d.highlight ? "#6EC49A" : d.cost ? "rgba(224,112,112,0.80)" : "rgba(244,244,244,0.70)" }}>{d.label}</div>
                  <div style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.35)" }}>{d.sub}</div>
                </div>
                <div style={{
                  fontSize: d.highlight ? "1.6vw" : "1.1vw",
                  fontWeight: d.highlight ? 700 : 400,
                  color: d.highlight ? "#6EC49A" : d.cost ? "rgba(224,112,112,0.85)" : "#F4F4F4",
                }}>
                  {d.value}
                </div>
              </div>
            ))}
          </div>

          {/* KPIs */}
          <div style={{ display: "flex", gap: "1vw", marginTop: "auto" }}>
            {[
              { label: "Cursos · 6 meses",  value: "600",               unit: "ventas" },
              { label: "Total neto",          value: formatM(totalNeto),  unit: "CLP" },
              { label: "Promedio/mes",        value: formatM(Math.round(totalNeto / 6)), unit: "neto M7–M12" },
            ].map((k) => (
              <div key={k.label} style={{
                flex: 1, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "0.7vw", padding: "1.2vh 1vw", textAlign: "center",
              }}>
                <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.45)", marginBottom: "0.4vh" }}>{k.label}</div>
                <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>{k.value}</div>
                <div style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.35)", marginTop: "0.2vh" }}>{k.unit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: curva de ventas */}
        <div style={{ flex: 1.1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "1.2vh" }}>CURVA DE VENTAS · M7 → M12</div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.9vh" }}>
            {curva.map((r) => {
              const pct  = (r.cursos / maxCursos) * 100;
              const neto = r.cursos * NETO_POR_VENTA;
              return (
                <div key={r.mes} style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                  <div style={{ minWidth: "2.8vw", fontSize: "1.0vw", fontWeight: 700, color: "#F4F4F4" }}>{r.mes}</div>
                  <div style={{ flex: 1, position: "relative", height: "3.5vh", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "0.4vw", overflow: "hidden" }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: "linear-gradient(90deg, rgba(110,196,154,0.5) 0%, rgba(110,196,154,0.85) 100%)",
                      borderRadius: "0.4vw", display: "flex", alignItems: "center", paddingLeft: "0.6vw",
                    }}>
                      <span style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF" }}>{r.cursos}</span>
                    </div>
                  </div>
                  <div style={{ minWidth: "5vw", textAlign: "right" }}>
                    <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#F4F4F4" }}>{formatM(neto)}</div>
                    <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.40)" }}>neto</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total bar */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.20)", paddingTop: "1.2vh", marginTop: "1.2vh",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FFFFFF" }}>Total 6 meses</div>
              <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.45)" }}>600 cursos vendidos</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "2.0vw", fontWeight: 700, color: "#6EC49A" }}>{formatM(totalNeto)}</div>
              <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.40)" }}>neto CLP</div>
            </div>
          </div>

          {/* Nota impacto */}
          <div style={{
            marginTop: "1.2vh", backgroundColor: "rgba(110,196,154,0.07)", border: "1px solid rgba(110,196,154,0.25)",
            borderRadius: "0.6vw", padding: "1vh 1.2vw",
          }}>
            <div style={{ fontSize: "0.85vw", color: "#6EC49A", fontWeight: 700, marginBottom: "0.3vh" }}>IMPACTO EN FLUJO AÑO 1</div>
            <div style={{ fontSize: "0.90vw", color: "rgba(244,244,244,0.60)", lineHeight: 1.4 }}>
              Suscripciones <span style={{ color: "#F4F4F4", fontWeight: 700 }}>~$115M</span> +
              Cursos <span style={{ color: "#F4F4F4", fontWeight: 700 }}>~{formatM(totalNeto)}</span> =
              Total <span style={{ color: "#6EC49A", fontWeight: 700 }}>~$124M CLP</span> ·
              Neto estimado <span style={{ color: "#6EC49A", fontWeight: 700 }}>+$54M CLP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ fontSize: "0.88vw", color: "rgba(244,244,244,0.32)", lineHeight: 1.45, marginTop: "1.2vh" }}>
        Neto por venta = $40.000 ÷ 1,19 (IVA 19%) × 70% (comisión tienda 30%) = $23.529 → – 35% tallerista + prod. video = <strong style={{ color: "rgba(244,244,244,0.55)" }}>${NETO_POR_VENTA.toLocaleString("es-CL")} neto final</strong> ·
        600 ventas M7–M12 · Sin costo de adquisición adicional · Proyección ilustrativa, no garantizada.
      </div>
    </div>
  );
}
