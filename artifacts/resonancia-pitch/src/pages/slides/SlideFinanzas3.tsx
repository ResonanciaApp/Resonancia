function Diamond() {
  return (
    <div style={{
      width: "0.6vw", height: "0.6vw",
      backgroundColor: "#BE9650",
      transform: "rotate(45deg)",
      flexShrink: 0, marginTop: "0.28vw",
    }} />
  );
}

function CostRow({ label, sub, value }: { label: string; sub?: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7vw", padding: "0.55vh 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <Diamond />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "1.2vw", fontWeight: 600, color: "#EDE1D3", lineHeight: 1.2 }}>{label}</div>
        {sub && <div style={{ fontSize: "0.9vw", color: "#3D4F62" }}>{sub}</div>}
      </div>
      <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#7A8FA8", textAlign: "right", minWidth: "7vw" }}>
        {value}
      </div>
    </div>
  );
}

export default function SlideFinanzas3() {
  const phases = [
    { fase: "Lanzamiento\nMes 1–2",  fijo: "$1.300.000", contenido: "$0",         mkt: "$0",                       total: "$1.300.000",            note: "Mkt cubierto por\ninversión inicial" },
    { fase: "Tracción\nMes 3–6",     fijo: "$1.300.000", contenido: "$1.500.000", mkt: "$500.000",                 total: "$3.300.000",            note: "Pauta social\nbásica + orgánico" },
    { fase: "Crecimiento\nMes 7–12", fijo: "$1.300.000", contenido: "$1.500.000", mkt: "$1,0M – $1,5M",           total: "$3,8M – $4,3M",         note: "Pauta + influencers\nnicho wellness" },
    { fase: "Escala\nMes 13–24",     fijo: "$1.300.000", contenido: "$1.500.000", mkt: "$2,0M – $2,5M",           total: "$4,8M – $5,3M",         note: "Retargeting +\ncampañas LATAM" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "5vh 6vw 4.5vh", boxSizing: "border-box", gap: "1.6vh" }}
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
        padding: "0.9vh 1.4vw",
        display: "flex",
        alignItems: "center",
        gap: "1.5vw",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", flexShrink: 0 }}>IVA 19% (Chile)</div>
        <div style={{ fontSize: "1.05vw", color: "#7A8FA8", lineHeight: 1.35 }}>
          Precio usuario <strong style={{ color: "#EDE1D3" }}>incluye IVA</strong> (Ley 21.210, servicios digitales desde 2020).
          Apple/Google retienen y remiten al SII. Empresa recibe: <strong style={{ color: "#EDE1D3" }}>precio excl. IVA × 70%</strong> (comisión tienda 30%).
          <span style={{ color: "#BE9650", fontWeight: 700 }}> → $6.900 = $4.059/mes neto</span>
        </div>
      </div>

      {/* Main: two columns */}
      <div style={{ display: "flex", gap: "3.5vw", flex: 1, minHeight: 0 }}>

        {/* Left: fixed + content costs */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "0.7vh" }}>COSTOS FIJOS / MES</div>
          <CostRow label="Coordinador general" sub="Gestión operativa y de artistas" value="$700.000" />
          <CostRow label="Asesoría TI" sub="Soporte técnico y mantenimiento" value="$200.000" />
          <CostRow label="Hosting e infraestructura" sub="Servidores, storage, CDN" value="$150.000" />
          <CostRow label="Gastos admin / oficina" sub="Arriendo base, servicios, colchón" value="$250.000" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.7vh 0 0", borderTop: "1px solid rgba(190,150,80,0.3)", marginTop: "0.4vh" }}>
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#EDE1D3" }}>Total fijos</div>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#BE9650" }}>$1.300.000</div>
          </div>

          <div style={{ marginTop: "1.6vh" }}>
            <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "0.7vh" }}>COSTOS CONTENIDO / MES</div>
            <CostRow label="Artistas / productores" sub="US$80/sesión · ~10 sesiones/mes" value="$720.000" />
            <CostRow label="Voces guía" sub="US$50/sesión · ~10 sesiones/mes" value="$450.000" />
            <CostRow label="Postproducción / edición" sub="Mezcla, masterización, assets" value="$330.000" />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.7vh 0 0", borderTop: "1px solid rgba(190,150,80,0.3)", marginTop: "0.4vh" }}>
              <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#EDE1D3" }}>Total contenido</div>
              <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#BE9650" }}>$1.500.000</div>
            </div>
            <div style={{ fontSize: "0.9vw", color: "#3D4F62", marginTop: "0.4vh" }}>$0 en Mes 1–2 (cubierto por inversión inicial)</div>
          </div>
        </div>

        {/* Right: marketing + phase totals */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "0.7vh" }}>MARKETING: RAMP-UP MENSUAL</div>
          <div style={{ backgroundColor: "#090E17", border: "1px solid rgba(190,150,80,0.15)", borderRadius: "0.7vw", padding: "0.9vh 1.1vw", marginBottom: "1.6vh" }}>
            {[
              { rango: "Mes 1–2",   desc: "Cubierto por inversión inicial (US$5.000)",  valor: "$0" },
              { rango: "Mes 3–6",   desc: "Pauta social básica + contenido orgánico",    valor: "$500.000" },
              { rango: "Mes 7–12",  desc: "Pauta ampliada + influencers nicho wellness", valor: "$1,0M – $1,5M" },
              { rango: "Mes 13–18", desc: "Retargeting + campañas multiregión LATAM",    valor: "$2.000.000" },
              { rango: "Mes 19–24", desc: "Escala regional + partnerships",              valor: "$2.500.000" },
            ].map(m => (
              <div key={m.rango} style={{ display: "flex", gap: "0.8vw", marginBottom: "0.5vh", alignItems: "baseline" }}>
                <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#EDE1D3", minWidth: "5vw" }}>{m.rango}</div>
                <div style={{ flex: 1, fontSize: "0.9vw", color: "#7A8FA8" }}>{m.desc}</div>
                <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#6EC49A", minWidth: "6.5vw", textAlign: "right" }}>{m.valor}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "0.7vh" }}>COSTO TOTAL MENSUAL POR FASE</div>
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
