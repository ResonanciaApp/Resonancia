function Diamond() {
  return (
    <div style={{
      width: "0.6vw", height: "0.6vw",
      backgroundColor: "#BE9650",
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
        <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "#EDE1D3", lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: "0.85vw", color: "#3D4F62" }}>{sub}</div>}
      </div>
      <div style={{ fontSize: "1.15vw", fontWeight: 700, color: "#7A8FA8", textAlign: "right", minWidth: "7vw" }}>
        {value}
      </div>
    </div>
  );
}

export default function SlideFinanzas3() {
  // Fijos: $3.650.000 (gerente $2M + coordinador $700K + TI $200K + hosting $150K + admin $250K + otros $350K)
  // Contenido $3.000.000 desde M3
  const phases = [
    { fase: "Lanzamiento\nMes 1–2",  fijo: "$3.650.000", contenido: "$0",         mkt: "$0",         total: "$3.650.000",   note: "Mkt cubierto por\ninversión inicial" },
    { fase: "Tracción\nMes 3–6",     fijo: "$3.650.000", contenido: "$3.000.000", mkt: "$500.000",   total: "$7.150.000",   note: "Pauta social\nbásica + orgánico" },
    { fase: "Crecimiento\nMes 7–12", fijo: "$3.650.000", contenido: "$3.000.000", mkt: "$1,0M–$1,5M",total: "$7,7M–$8,2M", note: "Pauta + influencers\nnicho wellness" },
    { fase: "Escala\nMes 13–24",     fijo: "$3.650.000", contenido: "$3.000.000", mkt: "$2,0M–$2,5M",total: "$8,7M–$9,2M", note: "Retargeting +\ncampañas LATAM" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "4.5vh 6vw 4vh", boxSizing: "border-box", gap: "1.1vh" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "0.5vh" }}>
          ANEXO FINANCIERO · HOJA 3 DE 3
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Desglose de <span style={{ color: "#BE9650" }}>costos mensuales.</span>
        </div>
      </div>

      {/* IVA banner */}
      <div style={{
        backgroundColor: "rgba(190,150,80,0.08)",
        border: "1px solid rgba(190,150,80,0.35)",
        borderRadius: "0.6vw",
        padding: "0.8vh 1.4vw",
        display: "flex",
        alignItems: "center",
        gap: "1.5vw",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", flexShrink: 0 }}>IVA 19% (Chile)</div>
        <div style={{ fontSize: "1.0vw", color: "#7A8FA8", lineHeight: 1.3 }}>
          Precio usuario <strong style={{ color: "#EDE1D3" }}>incluye IVA</strong> (Ley 21.210, servicios digitales desde 2020).
          Apple/Google retienen y remiten al SII. Empresa recibe: <strong style={{ color: "#EDE1D3" }}>precio excl. IVA × 70%</strong> (comisión tienda 30%).
          <span style={{ color: "#BE9650", fontWeight: 700 }}> → $6.900 = $4.059/mes neto</span>
        </div>
      </div>

      {/* Plan mix → blended ARPU */}
      <div style={{
        backgroundColor: "#090E17",
        border: "1px solid rgba(190,150,80,0.18)",
        borderRadius: "0.6vw",
        padding: "0.85vh 1.4vw",
        display: "flex",
        alignItems: "center",
        gap: "1.8vw",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", flexShrink: 0 }}>MEZCLA DE PLANES</div>

        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <div style={{ fontSize: "0.82vw", color: "#7A8FA8" }}>Mensual · ~60% de usuarios</div>
          <div style={{ fontSize: "1.0vw", color: "#EDE1D3" }}>$6.900/mes → <strong style={{ color: "#EDE1D3" }}>$4.059</strong> neto/mes</div>
        </div>

        <div style={{ width: "1px", alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.08)" }} />

        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <div style={{ fontSize: "0.82vw", color: "#7A8FA8" }}>Anual · ~40% de usuarios</div>
          <div style={{ fontSize: "1.0vw", color: "#EDE1D3" }}>$43.900/año → <strong style={{ color: "#EDE1D3" }}>$2.152</strong> neto/mes equiv.</div>
        </div>

        <div style={{ fontSize: "1.6vw", color: "rgba(190,150,80,0.5)", margin: "0 0.3vw" }}>→</div>

        <div style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "baseline",
          gap: "0.7vw",
          backgroundColor: "rgba(190,150,80,0.1)",
          border: "1px solid rgba(190,150,80,0.3)",
          borderRadius: "0.5vw",
          padding: "0.6vh 1vw",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: "0.85vw", color: "#7A8FA8" }}>ARPU NETO BLENDED</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>$3.300/mes</div>
        </div>
      </div>

      {/* Main: two columns */}
      <div style={{ display: "flex", gap: "3.5vw", flex: 1, minHeight: 0 }}>

        {/* Left: fixed + content costs */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>COSTOS FIJOS / MES</div>
          <CostRow label="Gerente general" sub="Dirección estratégica y comercial" value="$2.000.000" />
          <CostRow label="Coordinador general" sub="Gestión operativa y de artistas" value="$700.000" />
          <CostRow label="Asesoría TI" sub="Soporte técnico y mantenimiento" value="$200.000" />
          <CostRow label="Hosting e infraestructura" sub="Servidores, storage, CDN" value="$150.000" />
          <CostRow label="Gastos admin / oficina" sub="Arriendo base, servicios" value="$250.000" />
          <CostRow label="Otros" sub="Imprevistos, contingencias, varios" value="$350.000" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6vh 0 0", borderTop: "1px solid rgba(190,150,80,0.3)", marginTop: "0.3vh" }}>
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#EDE1D3" }}>Total fijos</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#BE9650" }}>$3.650.000</div>
          </div>

          <div style={{ marginTop: "0.8vh" }}>
            <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>COSTOS CONTENIDO / MES</div>
            <div style={{
              backgroundColor: "rgba(190,150,80,0.06)",
              border: "1px solid rgba(190,150,80,0.2)",
              borderRadius: "0.5vw",
              padding: "0.7vh 1vw",
              marginBottom: "0.6vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#EDE1D3" }}>~43 sesiones / mes</div>
                <div style={{ fontSize: "0.85vw", color: "#7A8FA8" }}>$70.000 promedio/sesión</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.45vw", fontWeight: 700, color: "#BE9650" }}>$3.000.000</div>
                <div style={{ fontSize: "0.8vw", color: "#3D4F62" }}>$0 en Mes 1–2</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5vw", fontSize: "0.95vw", color: "#7A8FA8", paddingTop: "0.5vh" }}>
              <span>Artistas <strong style={{ color: "#EDE1D3" }}>$1,75M</strong></span>
              <span>Voces guía <strong style={{ color: "#EDE1D3" }}>$1,05M</strong></span>
              <span>Postprod. <strong style={{ color: "#EDE1D3" }}>$200K</strong></span>
            </div>
          </div>
        </div>

        {/* Right: marketing + phase totals */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>MARKETING: RAMP-UP MENSUAL</div>
          <div style={{ backgroundColor: "#090E17", border: "1px solid rgba(190,150,80,0.15)", borderRadius: "0.7vw", padding: "0.8vh 1.1vw", marginBottom: "1.2vh" }}>
            {[
              { rango: "Mes 1–2",   desc: "Cubierto por inversión inicial (US$5.000)",  valor: "$0" },
              { rango: "Mes 3–6",   desc: "Pauta social básica + contenido orgánico",    valor: "$500.000" },
              { rango: "Mes 7–12",  desc: "Pauta ampliada + influencers nicho wellness", valor: "$1,0M – $1,5M" },
              { rango: "Mes 13–18", desc: "Retargeting + campañas multiregión LATAM",    valor: "$2.000.000" },
              { rango: "Mes 19–24", desc: "Escala regional + partnerships",              valor: "$2.500.000" },
            ].map(m => (
              <div key={m.rango} style={{ display: "flex", gap: "0.8vw", marginBottom: "0.45vh", alignItems: "baseline" }}>
                <div style={{ fontSize: "0.92vw", fontWeight: 700, color: "#EDE1D3", minWidth: "5vw" }}>{m.rango}</div>
                <div style={{ flex: 1, fontSize: "0.88vw", color: "#7A8FA8" }}>{m.desc}</div>
                <div style={{ fontSize: "0.92vw", fontWeight: 700, color: "#6EC49A", minWidth: "6.5vw", textAlign: "right" }}>{m.valor}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>COSTO TOTAL MENSUAL POR FASE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.7vw", flex: 1 }}>
            {phases.map((p, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#090E17",
                  border: `1px solid ${i === 1 ? "rgba(190,150,80,0.35)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "0.6vw",
                  padding: "0.9vh 0.85vw",
                }}
              >
                <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#7A8FA8", whiteSpace: "pre-line", marginBottom: "0.6vh", lineHeight: 1.25 }}>{p.fase}</div>
                {(["Fijo", "Contenido", "Marketing"] as const).map((k, ki) => {
                  const v = [p.fijo, p.contenido, p.mkt][ki];
                  return (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25vh" }}>
                      <div style={{ fontSize: "0.8vw", color: "#3D4F62" }}>{k}</div>
                      <div style={{ fontSize: "0.8vw", color: "#EDE1D3", textAlign: "right" }}>{v}</div>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px solid rgba(190,150,80,0.2)", paddingTop: "0.4vh", marginTop: "0.3vh", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#EDE1D3" }}>Total</div>
                  <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#BE9650" }}>{p.total}</div>
                </div>
                <div style={{ fontSize: "0.75vw", color: "#3D4F62", marginTop: "0.3vh", whiteSpace: "pre-line", lineHeight: 1.2 }}>{p.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
