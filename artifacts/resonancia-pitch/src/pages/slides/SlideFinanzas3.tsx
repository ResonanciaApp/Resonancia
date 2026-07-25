function CostRow({ label, sub, value }: { label: string; sub?: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5vw", padding: "0.28vh 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: "0.4vw", height: "0.4vw", backgroundColor: "#FFFFFF", transform: "rotate(45deg)", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: "1.0vw", fontWeight: 600, color: "#F4F4F4" }}>{label}</span>
        {sub && <span style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.40)", marginLeft: "0.4vw" }}>{sub}</span>}
      </div>
      <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", minWidth: "6.5vw", textAlign: "right" }}>{value}</div>
    </div>
  );
}

export default function SlideFinanzas3() {
  const mktRamp = [
    { rango: "Pre-lanzamiento", valor: "$1,5M", desc: "Pauta previa al lanzamiento (de la inversión inicial)" },
    { rango: "Mes 1",     valor: "$1M",        desc: "Campaña de lanzamiento (de la inversión inicial)" },
    { rango: "Mes 2",     valor: "$1M",        desc: "Campaña de lanzamiento (de la inversión inicial)" },
    { rango: "Mes 3–6",   valor: "$500.000",   desc: "Pauta social básica + orgánico" },
    { rango: "Mes 7–12",  valor: "$1M – $1,5M",desc: "Pauta + influencers nicho wellness" },
    { rango: "Mes 13–24", valor: "$2M – $2,5M",desc: "Retargeting + campañas LATAM" },
  ];

  const phases = [
    { fase: "M1–M2",    fijo: "$4,56M", cont: "$0",    mkt: "$1,0M*", total: "$5,56M" },
    { fase: "M3–M6",    fijo: "$4,56M", cont: "$1,2M", mkt: "$0,5M", total: "$6,26M" },
    { fase: "M7–M12",   fijo: "$4,56M", cont: "$1,5M", mkt: "$1,0M–$1,5M", total: "$7,06M–$7,56M" },
    { fase: "M13–M24",  fijo: "$4,56M", cont: "$1,5M", mkt: "$2,0M–$2,5M", total: "$8,06M–$8,56M" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "3vh 5vw 2.5vh", boxSizing: "border-box", gap: "0.9vh" }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.3vh" }}>
          ANEXO FINANCIERO · HOJA 3 DE 3
        </div>
        <div style={{ fontSize: "3.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Desglose de <span style={{ color: "#FFFFFF" }}>costos mensuales.</span>
        </div>
      </div>

      {/* Main columns */}
      <div style={{ display: "flex", gap: "3vw", flex: 1, minHeight: 0 }}>

        {/* Left: fixed costs */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", margin: "2.8vh 0 0.8vh" }}>COSTOS FIJOS / MES · RRHH</div>
          <CostRow label="Gerente general" value="$840.000" />
          <CostRow label="Ventas / Logística / Coordinación contenidos" value="$360.000" />
          <CostRow label="Super admin / Atención al cliente" value="$720.000" />
          <CostRow label="Desarrollo / Replit" value="$720.000" />
          <CostRow label="Diseñador" value="$570.000" />
          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", margin: "2.4vh 0 0.8vh" }}>OPERACIONALES</div>
          <CostRow label="Arriendo Casa" value="$500.000" />
          <CostRow label="Hosting e infraestructura" value="$250.000" />
          <CostRow label="Cuentas Básicas" value="$250.000" />
          <CostRow label="Otros" value="$350.000" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5vh 0 0", borderTop: "1px solid rgba(255,255,255,0.28)", marginTop: "0.2vh" }}>
            <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#F4F4F4" }}>Total fijos</div>
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#FFFFFF" }}>$4.560.000</div>
          </div>

          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", margin: "0.7vh 0 0.35vh" }}>CONTENIDO / MES</div>
          <div style={{
            backgroundColor: "rgba(0,0,0,0.20)", border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "0.4vw", padding: "0.6vh 0.9vw",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: "0.92vw", fontWeight: 700, color: "#F4F4F4" }}>~25 sesiones / mes · $60.000 prom.</div>
              <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.45)" }}>Sin costo en M1–M2 · Activo producido</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#FFFFFF" }}>$1.200.000</div>
              <div style={{ fontSize: "0.72vw", color: "rgba(244,244,244,0.40)" }}>M3–M6 · $1.500.000 desde M7</div>
            </div>
          </div>
        </div>

        {/* Right: marketing + phase totals */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.35vh" }}>MARKETING: RAMP-UP MENSUAL</div>
          <div style={{
            backgroundColor: "rgba(0,0,0,0.12)", border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: "0.5vw", padding: "0.6vh 0.9vw", marginBottom: "0.8vh",
          }}>
            {mktRamp.map(m => (
              <div key={m.rango} style={{ display: "flex", gap: "0.7vw", marginBottom: "0.3vh", alignItems: "baseline" }}>
                <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#F4F4F4", minWidth: "5vw", flexShrink: 0 }}>{m.rango}</div>
                <div style={{ flex: 1, fontSize: "0.80vw", color: "rgba(244,244,244,0.48)" }}>{m.desc}</div>
                <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#6EC49A", minWidth: "6vw", textAlign: "right" }}>{m.valor}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.35vh" }}>COSTO TOTAL MENSUAL POR FASE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.6vw", alignContent: "start" }}>
            {phases.map((p) => (
              <div key={p.fase} style={{
                backgroundColor: "rgba(0,0,0,0.14)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.5vw", padding: "0.7vh 0.75vw",
              }}>
                <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", marginBottom: "0.5vh" }}>{p.fase}</div>
                {[["Fijo", p.fijo], ["Contenido", p.cont], ["Marketing", p.mkt]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2vh" }}>
                    <span style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.40)" }}>{k}</span>
                    <span style={{ fontSize: "0.75vw", color: "#F4F4F4", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.18)", paddingTop: "0.3vh", marginTop: "0.25vh", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.80vw", fontWeight: 700, color: "#F4F4F4" }}>Total</span>
                  <span style={{ fontSize: "0.80vw", fontWeight: 700, color: "#FFFFFF" }}>{p.total}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "0.72vw", color: "rgba(244,244,244,0.38)", marginTop: "0.4vh", lineHeight: 1.3 }}>
            * Marketing M1–M2 financiado con la inversión inicial ($3,5M: $1,5M pre-lanzamiento + $1M mes 1 + $1M mes 2).
          </div>
        </div>
      </div>
    </div>
  );
}
