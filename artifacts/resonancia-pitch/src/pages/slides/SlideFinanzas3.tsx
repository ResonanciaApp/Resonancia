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
  // Fijos: $3.250.000 (RRHH $2.800.000 + hosting $250K + otros $200K)
  // Contenido $1.500.000 desde M3 (25 sesiones × $60.000)
  const phases = [
    { fase: "Lanzamiento\nMes 1–2",  fijo: "$3.250.000", contenido: "$0",         mkt: "$0",         total: "$3.250.000",   note: "Mkt cubierto por\ninversión inicial" },
    { fase: "Tracción\nMes 3–6",     fijo: "$3.250.000", contenido: "$1.500.000", mkt: "$500.000",   total: "$5.250.000",   note: "Pauta social\nbásica + orgánico" },
    { fase: "Crecimiento\nMes 7–12", fijo: "$3.250.000", contenido: "$1.500.000", mkt: "$1,0M–$1,5M",total: "$5,75M–$6,25M", note: "Pauta + influencers\nnicho wellness" },
    { fase: "Escala\nMes 13–24",     fijo: "$3.250.000", contenido: "$1.500.000", mkt: "$2,0M–$2,5M",total: "$6,75M–$7,25M", note: "Retargeting +\ncampañas LATAM" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ background: "linear-gradient(160deg, #2d1c52 0%, #24245d 33%, #1f2a62 66%, #2d4081 100%)", color: "#F4F4F4", padding: "4.5vh 6vw 4vh", boxSizing: "border-box", gap: "1.1vh" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.5vh" }}>
          ANEXO FINANCIERO · HOJA 3 DE 3
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Desglose de <span style={{ color: "#FFFFFF" }}>costos mensuales.</span>
        </div>
      </div>

      {/* IVA banner */}
      <div style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: "0.6vw",
        padding: "0.8vh 1.4vw",
        display: "flex",
        alignItems: "center",
        gap: "1.5vw",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", flexShrink: 0 }}>IVA 19% (Chile)</div>
        <div style={{ fontSize: "1.0vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.3 }}>
          Precio usuario <strong style={{ color: "#F4F4F4" }}>incluye IVA</strong> (Ley 21.210, servicios digitales desde 2020).
          Apple/Google retienen y remiten al SII. Empresa recibe: <strong style={{ color: "#F4F4F4" }}>precio excl. IVA × 70%</strong> (comisión tienda 30%).
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}> → $8.990 = $5.288/mes neto</span>
        </div>
      </div>

      {/* Plan mix → blended ARPU */}
      <div style={{
        backgroundColor: "rgba(0,0,0,0.14)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "0.6vw",
        padding: "0.85vh 1.4vw",
        display: "flex",
        alignItems: "center",
        gap: "1.8vw",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", flexShrink: 0 }}>MEZCLA DE PLANES</div>

        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <div style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.50)" }}>Mensual · ~60% de usuarios</div>
          <div style={{ fontSize: "1.0vw", color: "#F4F4F4" }}>$8.990/mes → <strong style={{ color: "#F4F4F4" }}>$5.288</strong> neto/mes</div>
        </div>

        <div style={{ width: "1px", alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.08)" }} />

        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <div style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.50)" }}>Anual · ~40% de usuarios</div>
          <div style={{ fontSize: "1.0vw", color: "#F4F4F4" }}>$59.990/año → <strong style={{ color: "#F4F4F4" }}>$2.941</strong> neto/mes equiv.</div>
        </div>

        <div style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.5)", margin: "0 0.3vw" }}>→</div>

        <div style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "baseline",
          gap: "0.7vw",
          backgroundColor: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "0.5vw",
          padding: "0.6vh 1vw",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.50)" }}>ARPU NETO BLENDED</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>$4.350/mes</div>
        </div>
      </div>

      {/* Main: two columns */}
      <div style={{ display: "flex", gap: "3.5vw", flex: 1, minHeight: 0 }}>

        {/* Left: fixed + content costs */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>COSTOS FIJOS / MES</div>
          <CostRow label="Gerente general" sub="Dirección estratégica y comercial" value="$600.000" />
          <CostRow label="Programador Chief" sub="Desarrollo y mantención técnica" value="$700.000" />
          <CostRow label="Coordinador/Contenidos" sub="Gestión operativa y de artistas" value="$500.000" />
          <CostRow label="Ventas / Logística" sub="Crecimiento y operaciones" value="$500.000" />
          <CostRow label="Super admin / Atención al cliente" sub="Soporte y comunidad" value="$500.000" />
          <CostRow label="Hosting e infraestructura" sub="Replit + Postgres + Bunny.net CDN" value="$250.000" />
          <CostRow label="Otros" sub="Admin, oficina, contingencias" value="$200.000" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6vh 0 0", borderTop: "1px solid rgba(255,255,255,0.3)", marginTop: "0.3vh" }}>
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4F4F4" }}>Total fijos</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#FFFFFF" }}>$3.250.000</div>
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
                <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "#FFFFFF" }}>$1.500.000</div>
                <div style={{ fontSize: "0.8vw", color: "rgba(244,244,244,0.45)" }}>$0 en Mes 1–2</div>
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

      {/* Pulso 4 · logo esquina */}
      <div style={{ position: "absolute", top: "3.5vh", right: "3vw", zIndex: 200, pointerEvents: "none" }}>
        <img src={`${import.meta.env.BASE_URL}logo-pulso4.png`} alt="Pulso 4" style={{ height: "3.2vh", opacity: 0.45, display: "block" }} />
      </div>
    </div>
  );
}
