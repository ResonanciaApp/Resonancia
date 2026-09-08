import React from "react";

function DualCostRow({ label, val1, val2, isSubtotal = false }: { label: string; val1: string; val2: string; isSubtotal?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: isSubtotal ? "0.45vh 0" : "0.35vh 0", borderBottom: isSubtotal ? "none" : "1px solid rgba(255,255,255,0.05)", borderTop: isSubtotal ? "1px solid rgba(255,255,255,0.15)" : "none", marginTop: isSubtotal ? "0.2vh" : 0 }}>
      {!isSubtotal && <div style={{ width: "0.25vw", height: "0.25vw", backgroundColor: "rgba(255,255,255,0.3)", transform: "rotate(45deg)", flexShrink: 0, marginRight: "0.6vw" }} />}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: isSubtotal ? "0.85vw" : "0.92vw", fontWeight: isSubtotal ? 700 : 400, color: isSubtotal ? "#FFFFFF" : "rgba(244,244,244,0.8)" }}>{label}</span>
      </div>
      <div style={{ display: "flex", gap: "1.5vw", width: "13vw", flexShrink: 0 }}>
        <div style={{ flex: 1, fontSize: isSubtotal ? "0.95vw" : "0.92vw", fontWeight: isSubtotal ? 700 : 500, color: isSubtotal ? "#D6A45C" : "rgba(244,244,244,0.50)", textAlign: "right" }}>{val1}</div>
        <div style={{ flex: 1, fontSize: isSubtotal ? "0.95vw" : "0.92vw", fontWeight: isSubtotal ? 700 : 500, color: isSubtotal ? "#6EC49A" : "rgba(244,244,244,0.50)", textAlign: "right" }}>{val2}</div>
      </div>
    </div>
  );
}

export default function SlideFinanzas3() {
  const mktRamp = [
    { rango: "Pre-lanz.",   valor: "$1,0M",        desc: "Pauta previa al lanzamiento (de la ronda)" },
    { rango: "Mes 1",       valor: "$1,0M",        desc: "Campaña de lanzamiento (de la ronda)" },
    { rango: "Mes 2",       valor: "$1,0M",        desc: "Campaña de lanzamiento (de la ronda)" },
    { rango: "Mes 3–6",     valor: "$0",           desc: "Orgánico + comunidad (sin pauta paga)" },
    { rango: "Mes 7–8",     valor: "$1,0M",        desc: "Pauta + influencers nicho wellness" },
    { rango: "Mes 9–10",    valor: "$1,8M",        desc: "Escala fuerte con caja mensual positiva" },
    { rango: "Mes 11–12",   valor: "$2,0M",        desc: "Retargeting + expansión del alcance" },
    { rango: "Mes 13–24",   valor: "$2,0M–$2,5M",  desc: "Retargeting + campañas LATAM" },
  ];

  const phases = [
    { fase: "M1–M2",   base: "$3,03M", mkt: "$1,0M*", total: "$4,03M*", highlight: false },
    { fase: "M3–M4",   base: "$3,03M", mkt: "$0",     total: "$3,03M", highlight: false },
    { fase: "M5–M6",   base: "$4,60M", mkt: "$0",     total: "$4,60M", highlight: true },
    { fase: "M7–M8",   base: "$4,60M", mkt: "$1,0M",  total: "$5,60M", highlight: false },
    { fase: "M9–M10",  base: "$4,60M", mkt: "$1,8M",  total: "$6,40M", highlight: false },
    { fase: "M11–M12", base: "$4,60M", mkt: "$2,0M",  total: "$6,60M", highlight: false },
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
          Desglose de <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>costos mensuales.</span>
        </div>
      </div>

      {/* Main columns */}
      <div style={{ display: "flex", gap: "3vw", flex: 1, minHeight: 0, marginTop: "1vh" }}>

        {/* Left: fixed costs comparison */}
        <div style={{ flex: 1.1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-end", marginBottom: "1.2vh", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "0.6vh" }}>
            <div style={{ flex: 1, fontSize: "0.85vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em" }}>ESTRUCTURA DE COSTOS</div>
            <div style={{ display: "flex", gap: "1.5vw", width: "13vw", flexShrink: 0 }}>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#D6A45C", letterSpacing: "0.05em" }}>M1–M4</div>
                <div style={{ fontSize: "0.65vw", color: "rgba(214,164,92,0.7)", fontWeight: 500, marginTop: "0.15vh" }}>Reducida</div>
              </div>
              <div style={{ flex: 1, textAlign: "right" }}>
                <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#6EC49A", letterSpacing: "0.05em" }}>M5+</div>
                <div style={{ fontSize: "0.65vw", color: "rgba(110,196,154,0.7)", fontWeight: 500, marginTop: "0.15vh" }}>Expansión</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.75vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", margin: "0.5vh 0 0.4vh" }}>RRHH</div>
          <DualCostRow label="Gerente general" val1="$380.000" val2="$1.300.000" />
          <DualCostRow label="Super admin / Atención al cliente" val1="$450.000" val2="$700.000" />
          <DualCostRow label="Desarrollo / Replit" val1="$300.000" val2="$350.000" />
          <DualCostRow label="Diseñador" val1="$300.000" val2="$400.000" />
          <DualCostRow label="Subtotal RRHH" val1="$1,43M" val2="$2,75M" isSubtotal />

          <div style={{ fontSize: "0.75vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", margin: "1.5vh 0 0.4vh" }}>OPERACIONALES</div>
          <DualCostRow label="Arriendo Casa" val1="$350.000" val2="$500.000" />
          <DualCostRow label="Hosting e infraestructura" val1="$250.000" val2="$350.000" />
          <DualCostRow label="Cuentas básicas" val1="$200.000" val2="$200.000" />
          <DualCostRow label="Otros" val1="$350.000" val2="$350.000" />
          <DualCostRow label="Subtotal Operacionales" val1="$1,15M" val2="$1,40M" isSubtotal />

          <div style={{ fontSize: "0.75vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", margin: "1.5vh 0 0.4vh" }}>CONTENIDO</div>
          <DualCostRow label="Producción continua" val1="$450.000" val2="$450.000" />

          <div style={{ marginTop: "auto", paddingTop: "1vh" }}>
            <div style={{
              backgroundColor: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "0.4vw", padding: "1.2vh 1.2vw",
              display: "flex", alignItems: "center"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#F4F4F4" }}>Base mensual</div>
                <div style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.5)", fontWeight: 400, marginTop: "0.2vh" }}>Fijos + Contenido (antes de marketing)</div>
              </div>
              <div style={{ display: "flex", gap: "1.5vw", width: "13vw", flexShrink: 0 }}>
                <div style={{ flex: 1, fontSize: "1.2vw", fontWeight: 700, color: "#D6A45C", textAlign: "right" }}>$3,03M</div>
                <div style={{ flex: 1, fontSize: "1.2vw", fontWeight: 700, color: "#6EC49A", textAlign: "right" }}>$4,60M</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: marketing + phase totals */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.4vh" }}>MARKETING: RAMP-UP MENSUAL</div>
          <div style={{
            backgroundColor: "rgba(0,0,0,0.12)", border: "1px solid rgba(255,255,255,0.13)",
            borderRadius: "0.5vw", padding: "0.8vh 0.9vw", marginBottom: "1vh",
          }}>
            {mktRamp.map(m => (
              <div key={m.rango} style={{ display: "flex", gap: "0.7vw", marginBottom: "0.35vh", alignItems: "baseline" }}>
                <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#F4F4F4", minWidth: "5.5vw", flexShrink: 0 }}>{m.rango}</div>
                <div style={{ flex: 1, fontSize: "0.78vw", color: "rgba(244,244,244,0.48)" }}>{m.desc}</div>
                <div style={{ fontSize: "0.82vw", fontWeight: 700, color: m.valor === "$0" ? "rgba(244,244,244,0.3)" : "#6EC49A", minWidth: "5vw", textAlign: "right" }}>{m.valor}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "0.82vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.5vh", marginTop: "1vh" }}>COSTO TOTAL MENSUAL POR FASE · INCLUYE MARKETING</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.6vw", alignContent: "start" }}>
            {phases.map((p) => (
              <div key={p.fase} style={{
                backgroundColor: p.highlight ? "rgba(110,196,154,0.12)" : "rgba(0,0,0,0.14)",
                border: p.highlight ? "1px solid rgba(110,196,154,0.3)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.5vw", padding: "0.8vh 0.8vw",
                position: "relative",
              }}>
                {p.highlight && (
                  <div style={{ position: "absolute", top: "-0.6vh", right: "0.8vw", backgroundColor: "#6EC49A", color: "#19233F", fontSize: "0.55vw", fontWeight: 800, padding: "0.15vh 0.4vw", borderRadius: "0.2vw", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Expansión
                  </div>
                )}
                <div style={{ fontSize: "0.82vw", fontWeight: 700, color: p.highlight ? "#6EC49A" : "rgba(244,244,244,0.50)", marginBottom: "0.6vh" }}>{p.fase}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25vh" }}>
                  <span style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.45)" }}>Fijo + Cont.</span>
                  <span style={{ fontSize: "0.75vw", color: "#F4F4F4", textAlign: "right" }}>{p.base}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25vh" }}>
                  <span style={{ fontSize: "0.75vw", color: "rgba(244,244,244,0.45)" }}>Marketing</span>
                  <span style={{ fontSize: "0.75vw", color: p.mkt === "$0" ? "rgba(244,244,244,0.3)" : "#F4F4F4", textAlign: "right" }}>{p.mkt}</span>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.18)", paddingTop: "0.35vh", marginTop: "0.35vh", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.80vw", fontWeight: 700, color: p.highlight ? "#6EC49A" : "#F4F4F4" }}>Total</span>
                  <span style={{ fontSize: "0.85vw", fontWeight: 700, color: "#FFFFFF" }}>{p.total}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "0.72vw", color: "rgba(244,244,244,0.38)", marginTop: "auto", lineHeight: 1.3 }}>
             * Marketing total de la ronda: $3,0M ($1M pre-lanzamiento + $1M M1 + $1M M2; M3 $0). Los $2,0M incurridos en M1–M2 están incluidos en el P&amp;L y la caja de las hojas 1–2. Desde M7 el marketing operativo sigue formando parte del costo.
          </div>
        </div>
      </div>
    </div>
  );
}
