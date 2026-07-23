function Diamond() {
  return (
    <div style={{
      width: "0.6vw", height: "0.6vw",
      backgroundColor: "#FFFFFF",
      transform: "rotate(45deg)",
      flexShrink: 0, marginTop: "0.26vw",
    }} />
  );
}

function CostRow({ label, sub, value }: { label: string; sub?: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7vw", padding: "0.32vh 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <Diamond />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "#F4F4F4", lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.45)" }}>{sub}</div>}
      </div>
      <div style={{ fontSize: "1.15vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", textAlign: "right", minWidth: "7vw" }}>
        {value}
      </div>
    </div>
  );
}

export default function SlideFinanzas3() {
  // Fijos: $3.900.000 (RRHH $2.300.000 + operacionales $1.600.000)
  // Contenido $1.200.000 en M3-6, $1.500.000 desde M7
  const phases = [
    { fase: "Lanzamiento\nMes 1–2",  fijo: "$3.900.000", contenido: "$0",         mkt: "$0",         total: "$3.900.000",   note: "Mkt cubierto por\ninversión inicial" },
    { fase: "Tracción\nMes 3–6",     fijo: "$3.900.000", contenido: "$1.200.000", mkt: "$500.000",   total: "$5.600.000",   note: "Pauta social\nbásica + orgánico" },
    { fase: "Crecimiento\nMes 7–12", fijo: "$3.900.000", contenido: "$1.500.000", mkt: "$1,0M–$1,5M",total: "$6,4M–$6,9M", note: "Pauta + influencers\nnicho wellness" },
    { fase: "Escala\nMes 13–24",     fijo: "$3.900.000", contenido: "$1.500.000", mkt: "$2,0M–$2,5M",total: "$7,4M–$7,9M", note: "Retargeting +\ncampañas LATAM" },
  ];

  // Pricing data
  const pricingRows = [
    { plan: "Mensual",  pct: "30%", launch: "$5.990", launchNeto: "$3.517/mes",  normal: "$7.990", normalNeto: "$4.700/mes" },
    { plan: "Anual",    pct: "60%", launch: "$39.990", launchNeto: "$1.961/mes eq.", normal: "$49.990", normalNeto: "$2.451/mes eq." },
    { plan: "Lifetime", pct: "10%", launch: "$99.990", launchNeto: "$58.817 único",  normal: "$149.990", normalNeto: "$88.229 único" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "4.5vh 6vw 4vh", boxSizing: "border-box", gap: "1.1vh" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.5vh" }}>
          ANEXO FINANCIERO · HOJA 3 DE 3
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Estrategia de precios + <span style={{ color: "#FFFFFF" }}>costos mensuales.</span>
        </div>
      </div>

      {/* Two-phase pricing table */}
      <div style={{
        backgroundColor: "rgba(0,0,0,0.18)",
        border: "1px solid rgba(255,255,255,0.20)",
        borderRadius: "0.7vw",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 0.5fr 1.1fr 1.1fr 1.1fr 1.1fr",
          backgroundColor: "rgba(255,255,255,0.07)",
          padding: "0.7vh 1.2vw",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          {["Plan", "Mix", "Precio lanzamiento (M1–M3)", "Neto empresa", "Precio normal (M4+)", "Neto empresa"].map((h, i) => (
            <div key={i} style={{
              fontSize: "0.82vw", fontWeight: 700, color: i >= 2 && i <= 3 ? "#BE9650" : i >= 4 ? "#6EC49A" : "#FFFFFF",
              letterSpacing: "0.06em"
            }}>{h}</div>
          ))}
        </div>

        {pricingRows.map((r, i) => (
          <div
            key={r.plan}
            style={{
              display: "grid",
              gridTemplateColumns: "0.9fr 0.5fr 1.1fr 1.1fr 1.1fr 1.1fr",
              padding: "0.75vh 1.2vw",
              backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#F4F4F4" }}>{r.plan}</div>
            <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "rgba(244,244,244,0.55)" }}>{r.pct}</div>
            <div style={{ fontSize: "1.05vw", color: "#F4F4F4" }}>{r.launch}</div>
            <div style={{ fontSize: "0.95vw", color: "#BE9650", fontWeight: 600 }}>{r.launchNeto}</div>
            <div style={{ fontSize: "1.05vw", color: "#F4F4F4" }}>{r.normal}</div>
            <div style={{ fontSize: "0.95vw", color: "#6EC49A", fontWeight: 600 }}>{r.normalNeto}</div>
          </div>
        ))}

        {/* Blended ARPU footer */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "0.9fr 0.5fr 1.1fr 1.1fr 1.1fr 1.1fr",
          padding: "0.75vh 1.2vw",
          backgroundColor: "rgba(0,0,0,0.20)",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          alignItems: "center",
        }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "rgba(244,244,244,0.55)", gridColumn: "1/3" }}>ARPU RECURRENTE BLENDED</div>
          <div style={{ gridColumn: "3/5", display: "flex", alignItems: "center", gap: "0.6vw" }}>
            <div style={{ fontSize: "1.25vw", fontWeight: 700, color: "#BE9650" }}>~$2.232/mes/sub</div>
            <div style={{ fontSize: "0.8vw", color: "rgba(244,244,244,0.40)" }}>+ $2.4M boost lifetime/mes</div>
          </div>
          <div style={{ gridColumn: "5/7", display: "flex", alignItems: "center", gap: "0.6vw" }}>
            <div style={{ fontSize: "1.25vw", fontWeight: 700, color: "#6EC49A" }}>~$2.881/mes/sub</div>
            <div style={{ fontSize: "0.8vw", color: "rgba(244,244,244,0.40)" }}>+ $3.5M boost lifetime/mes</div>
          </div>
        </div>
      </div>

      {/* Note IVA */}
      <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.40)", lineHeight: 1.3 }}>
        Neto = precio ÷ 1,19 (IVA 19% Chile, Ley 21.210) × 70% (comisión Apple/Google 30%) · Mensual y anual = recurrente · Lifetime = pago único, no renueva.
      </div>

      {/* Main: two columns */}
      <div style={{ display: "flex", gap: "3.5vw", flex: 1, minHeight: 0 }}>

        {/* Left: fixed + content costs */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>COSTOS FIJOS / MES · RRHH</div>
          <CostRow label="Gerente general" sub="Dirección estratégica y comercial" value="$700.000" />
          <CostRow label="Ventas / Logística" sub="Crecimiento y operaciones" value="$300.000" />
          <CostRow label="Super admin / Atención al cliente" sub="Soporte y comunidad" value="$600.000" />
          <CostRow label="Desarrollo / TI" value="$700.000" />
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", margin: "0.8vh 0 0.5vh" }}>OPERACIONALES</div>
          <CostRow label="Arriendo Casa" sub="Espacio de operación y grabación" value="$500.000" />
          <CostRow label="Hosting e infraestructura" sub="Replit + Postgres + Bunny.net CDN" value="$250.000" />
          <CostRow label="Cuentas básicas" sub="Servicios y suministros" value="$350.000" />
          <CostRow label="Otros" value="$500.000" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6vh 0 0", borderTop: "1px solid rgba(255,255,255,0.3)", marginTop: "0.3vh" }}>
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4F4F4" }}>Total fijos</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#FFFFFF" }}>$3.900.000</div>
          </div>

          <div style={{ marginTop: "0.8vh" }}>
            <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>COSTOS CONTENIDO / MES</div>
            <div style={{
              backgroundColor: "rgba(0,0,0,0.27)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "0.5vw",
              padding: "0.7vh 1vw",
              marginBottom: "0.6vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#F4F4F4" }}>~25 sesiones / mes</div>
                <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.50)" }}>$60.000 promedio/sesión</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "#FFFFFF" }}>$1.200.000</div>
                <div style={{ fontSize: "0.8vw", color: "rgba(244,244,244,0.45)" }}>M3–6 · $0 en M1–2</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: marketing + phase totals */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>MARKETING: RAMP-UP MENSUAL</div>
          <div style={{ backgroundColor: "rgba(0,0,0,0.14)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.7vw", padding: "0.8vh 1.1vw", marginBottom: "1.2vh" }}>
            {[
              { rango: "Mes 1–2",   desc: "Cubierto por campaña de lanzamiento ($3M upfront)",   valor: "$0" },
              { rango: "Mes 3–6",   desc: "Pauta social básica + contenido orgánico",             valor: "$500.000" },
              { rango: "Mes 7–12",  desc: "Pauta ampliada + influencers nicho wellness",          valor: "$1,0M – $1,5M" },
              { rango: "Mes 13–18", desc: "Retargeting + campañas multiregión LATAM",             valor: "$2.000.000" },
              { rango: "Mes 19–24", desc: "Escala regional + partnerships",                       valor: "$2.500.000" },
            ].map(m => (
              <div key={m.rango} style={{ display: "flex", gap: "0.8vw", marginBottom: "0.45vh", alignItems: "baseline" }}>
                <div style={{ fontSize: "0.92vw", fontWeight: 700, color: "#F4F4F4", minWidth: "5vw" }}>{m.rango}</div>
                <div style={{ flex: 1, fontSize: "0.88vw", color: "rgba(244,244,244,0.50)" }}>{m.desc}</div>
                <div style={{ fontSize: "0.92vw", fontWeight: 700, color: "#6EC49A", minWidth: "6.5vw", textAlign: "right" }}>{m.valor}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>COSTO TOTAL MENSUAL POR FASE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.7vw", flex: 1 }}>
            {phases.map((p, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "rgba(0,0,0,0.14)",
                  border: `1px solid ${i === 1 ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "0.6vw",
                  padding: "0.9vh 0.85vw",
                }}
              >
                <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", whiteSpace: "pre-line", marginBottom: "0.6vh", lineHeight: 1.25 }}>{p.fase}</div>
                {(["Fijo", "Contenido", "Marketing"] as const).map((k, ki) => {
                  const v = [p.fijo, p.contenido, p.mkt][ki];
                  return (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25vh" }}>
                      <div style={{ fontSize: "0.8vw", color: "rgba(244,244,244,0.45)" }}>{k}</div>
                      <div style={{ fontSize: "0.8vw", color: "#F4F4F4", textAlign: "right" }}>{v}</div>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "0.4vh", marginTop: "0.3vh", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#F4F4F4" }}>Total</div>
                  <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#FFFFFF" }}>{p.total}</div>
                </div>
                <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.45)", marginTop: "0.3vh", whiteSpace: "pre-line", lineHeight: 1.2 }}>{p.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
