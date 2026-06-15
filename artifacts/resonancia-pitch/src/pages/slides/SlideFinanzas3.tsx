function Diamond() {
  return (
    <div style={{
      width: "0.6vw", height: "0.6vw",
      backgroundColor: "#D4AF37",
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
        <div style={{ fontSize: "1.15vw", fontWeight: 600, color: "#F4DAD5", lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: "0.85vw", color: "#3D4F62" }}>{sub}</div>}
      </div>
      <div style={{ fontSize: "1.15vw", fontWeight: 700, color: "rgba(242,231,228,0.50)", textAlign: "right", minWidth: "7vw" }}>
        {value}
      </div>
    </div>
  );
}

export default function SlideFinanzas3() {
  // Fijos: $3.050.000 (gerente $1,3M + coordinador $700K + TI $200K + hosting $250K + admin $250K + otros $350K)
  // Contenido $2.000.000 desde M3
  const phases = [
    { fase: "Lanzamiento\nMes 1–2",  fijo: "$3.050.000", contenido: "$0",         mkt: "$0",         total: "$3.050.000",   note: "Mkt cubierto por\ninversión inicial" },
    { fase: "Tracción\nMes 3–6",     fijo: "$3.050.000", contenido: "$2.000.000", mkt: "$500.000",   total: "$5.550.000",   note: "Pauta social\nbásica + orgánico" },
    { fase: "Crecimiento\nMes 7–12", fijo: "$3.050.000", contenido: "$2.000.000", mkt: "$1,0M–$1,5M",total: "$6,1M–$6,6M", note: "Pauta + influencers\nnicho wellness" },
    { fase: "Escala\nMes 13–24",     fijo: "$3.050.000", contenido: "$2.000.000", mkt: "$2,0M–$2,5M",total: "$7,1M–$7,6M", note: "Retargeting +\ncampañas LATAM" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5", padding: "4.5vh 6vw 4vh", boxSizing: "border-box", gap: "1.1vh" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "0.5vh" }}>
          ANEXO FINANCIERO · HOJA 3 DE 3
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Desglose de <span style={{ background: "linear-gradient(90deg, #FF6B3D, #FF9E4D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>costos mensuales.</span>
        </div>
      </div>

      {/* IVA banner */}
      <div style={{
        backgroundColor: "rgba(212,175,55,0.08)",
        border: "1px solid rgba(212,175,55,0.35)",
        borderRadius: "0.6vw",
        padding: "0.8vh 1.4vw",
        display: "flex",
        alignItems: "center",
        gap: "1.5vw",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "1.0vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.1em", flexShrink: 0 }}>IVA 19% (Chile)</div>
        <div style={{ fontSize: "1.0vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.3 }}>
          Precio usuario <strong style={{ color: "#F4DAD5" }}>incluye IVA</strong> (Ley 21.210, servicios digitales desde 2020).
          Apple/Google retienen y remiten al SII. Empresa recibe: <strong style={{ color: "#F4DAD5" }}>precio excl. IVA × 70%</strong> (comisión tienda 30%).
          <span style={{ background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}> → $6.900 = $4.059/mes neto</span>
        </div>
      </div>

      {/* Plan mix → blended ARPU */}
      <div style={{
        backgroundColor: "#27070E",
        border: "1px solid rgba(212,175,55,0.18)",
        borderRadius: "0.6vw",
        padding: "0.85vh 1.4vw",
        display: "flex",
        alignItems: "center",
        gap: "1.8vw",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "0.95vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.1em", flexShrink: 0 }}>MEZCLA DE PLANES</div>

        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <div style={{ fontSize: "0.82vw", color: "rgba(242,231,228,0.50)" }}>Mensual · ~60% de usuarios</div>
          <div style={{ fontSize: "1.0vw", color: "#F4DAD5" }}>$6.900/mes → <strong style={{ color: "#F4DAD5" }}>$4.059</strong> neto/mes</div>
        </div>

        <div style={{ width: "1px", alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.08)" }} />

        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <div style={{ fontSize: "0.82vw", color: "rgba(242,231,228,0.50)" }}>Anual · ~40% de usuarios</div>
          <div style={{ fontSize: "1.0vw", color: "#F4DAD5" }}>$43.900/año → <strong style={{ color: "#F4DAD5" }}>$2.152</strong> neto/mes equiv.</div>
        </div>

        <div style={{ fontSize: "1.6vw", color: "rgba(212,175,55,0.5)", margin: "0 0.3vw" }}>→</div>

        <div style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "baseline",
          gap: "0.7vw",
          backgroundColor: "rgba(212,175,55,0.1)",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: "0.5vw",
          padding: "0.6vh 1vw",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: "0.85vw", color: "rgba(242,231,228,0.50)" }}>ARPU NETO BLENDED</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>$3.300/mes</div>
        </div>
      </div>

      {/* Main: two columns */}
      <div style={{ display: "flex", gap: "3.5vw", flex: 1, minHeight: 0 }}>

        {/* Left: fixed + content costs */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>COSTOS FIJOS / MES</div>
          <CostRow label="Gerente general" sub="Dirección estratégica y comercial" value="$1.300.000" />
          <CostRow label="Coordinador general" sub="Gestión operativa y de artistas" value="$700.000" />
          <CostRow label="Asesoría TI" sub="Soporte técnico y mantenimiento" value="$200.000" />
          <CostRow label="Hosting e infraestructura" sub="Replit + Postgres + Bunny.net CDN" value="$250.000" />
          <CostRow label="Gastos admin / oficina" sub="Arriendo base, servicios" value="$250.000" />
          <CostRow label="Otros" sub="Imprevistos, contingencias, varios" value="$350.000" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6vh 0 0", borderTop: "1px solid rgba(212,175,55,0.3)", marginTop: "0.3vh" }}>
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#F4DAD5" }}>Total fijos</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>$3.050.000</div>
          </div>

          <div style={{ marginTop: "0.8vh" }}>
            <div style={{ fontSize: "0.9vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>COSTOS CONTENIDO / MES</div>
            <div style={{
              backgroundColor: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "0.5vw",
              padding: "0.7vh 1vw",
              marginBottom: "0.6vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#F4DAD5" }}>~28 sesiones / mes</div>
                <div style={{ fontSize: "0.85vw", color: "rgba(242,231,228,0.50)" }}>$70.000 promedio/sesión</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.45vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>$2.000.000</div>
                <div style={{ fontSize: "0.8vw", color: "#3D4F62" }}>$0 en Mes 1–2</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5vw", fontSize: "0.95vw", color: "rgba(242,231,228,0.50)", paddingTop: "0.5vh" }}>
              <span>Artistas <strong style={{ color: "#F4DAD5" }}>$1,15M</strong></span>
              <span>Voces guía <strong style={{ color: "#F4DAD5" }}>$0,70M</strong></span>
              <span>Postprod. <strong style={{ color: "#F4DAD5" }}>$150K</strong></span>
            </div>
          </div>
        </div>

        {/* Right: marketing + phase totals */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>MARKETING: RAMP-UP MENSUAL</div>
          <div style={{ backgroundColor: "#27070E", border: "1px solid rgba(212,175,55,0.15)", borderRadius: "0.7vw", padding: "0.8vh 1.1vw", marginBottom: "1.2vh" }}>
            {[
              { rango: "Mes 1–2",   desc: "Cubierto por campaña de lanzamiento (US$4.440 upfront)",  valor: "$0" },
              { rango: "Mes 3–6",   desc: "Pauta social básica + contenido orgánico",    valor: "$500.000" },
              { rango: "Mes 7–12",  desc: "Pauta ampliada + influencers nicho wellness", valor: "$1,0M – $1,5M" },
              { rango: "Mes 13–18", desc: "Retargeting + campañas multiregión LATAM",    valor: "$2.000.000" },
              { rango: "Mes 19–24", desc: "Escala regional + partnerships",              valor: "$2.500.000" },
            ].map(m => (
              <div key={m.rango} style={{ display: "flex", gap: "0.8vw", marginBottom: "0.45vh", alignItems: "baseline" }}>
                <div style={{ fontSize: "0.92vw", fontWeight: 700, color: "#F4DAD5", minWidth: "5vw" }}>{m.rango}</div>
                <div style={{ flex: 1, fontSize: "0.88vw", color: "rgba(242,231,228,0.50)" }}>{m.desc}</div>
                <div style={{ fontSize: "0.92vw", fontWeight: 700, color: "#6EC49A", minWidth: "6.5vw", textAlign: "right" }}>{m.valor}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "0.9vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.1em", marginBottom: "0.5vh" }}>COSTO TOTAL MENSUAL POR FASE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.7vw", flex: 1 }}>
            {phases.map((p, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#27070E",
                  border: `1px solid ${i === 1 ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "0.6vw",
                  padding: "0.9vh 0.85vw",
                }}
              >
                <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "rgba(242,231,228,0.50)", whiteSpace: "pre-line", marginBottom: "0.6vh", lineHeight: 1.25 }}>{p.fase}</div>
                {(["Fijo", "Contenido", "Marketing"] as const).map((k, ki) => {
                  const v = [p.fijo, p.contenido, p.mkt][ki];
                  return (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25vh" }}>
                      <div style={{ fontSize: "0.8vw", color: "#3D4F62" }}>{k}</div>
                      <div style={{ fontSize: "0.8vw", color: "#F4DAD5", textAlign: "right" }}>{v}</div>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px solid rgba(212,175,55,0.2)", paddingTop: "0.4vh", marginTop: "0.3vh", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#F4DAD5" }}>Total</div>
                  <div style={{ fontSize: "0.85vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{p.total}</div>
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
