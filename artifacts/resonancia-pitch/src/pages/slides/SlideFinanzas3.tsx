function Diamond() {
  return (
    <div style={{
      width: "0.65vw", height: "0.65vw",
      backgroundColor: "#BE9650",
      transform: "rotate(45deg)",
      flexShrink: 0, marginTop: "0.32vw",
    }} />
  );
}

function CostRow({ label, sub, value, gold }: { label: string; sub?: string; value: string; gold?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.8vw", padding: "0.85vh 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <Diamond />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "#EDE1D3" }}>{label}</div>
        {sub && <div style={{ fontSize: "1.0vw", color: "#3D4F62", marginTop: "0.15vh" }}>{sub}</div>}
      </div>
      <div style={{ fontSize: "1.35vw", fontWeight: 700, color: gold ? "#BE9650" : "#7A8FA8", textAlign: "right", minWidth: "7.5vw" }}>
        {value}
      </div>
    </div>
  );
}

export default function SlideFinanzas3() {
  const phases = [
    {
      fase: "Lanzamiento\nMes 1–2",
      fijo: "$1.300.000",
      contenido: "$0",
      mkt: "$0",
      total: "$1.300.000",
      note: "Contenido y mkt\ncubiertos por\ninversión inicial",
    },
    {
      fase: "Tracción\nMes 3–6",
      fijo: "$1.300.000",
      contenido: "$1.500.000",
      mkt: "$500.000",
      total: "$3.300.000",
      note: "Pauta social\nbásica + orgánico",
    },
    {
      fase: "Crecimiento\nMes 7–12",
      fijo: "$1.300.000",
      contenido: "$1.500.000",
      mkt: "$1.000.000–\n$1.500.000",
      total: "$3.800.000–\n$4.300.000",
      note: "Pauta + influencers\nnicho wellness",
    },
    {
      fase: "Escala\nMes 13–24",
      fijo: "$1.300.000",
      contenido: "$1.500.000",
      mkt: "$2.000.000–\n$2.500.000",
      total: "$4.800.000–\n$5.300.000",
      note: "Retargeting +\ncampañas LATAM",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "7vh 6vw 5.5vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1vh" }}>
          ANEXO FINANCIERO · HOJA 3 DE 3
        </div>
        <div style={{ fontSize: "3.6vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Desglose de <span style={{ color: "#BE9650" }}>costos mensuales.</span>
        </div>
      </div>

      {/* IVA banner */}
      <div style={{
        backgroundColor: "rgba(190,150,80,0.08)",
        border: "1px solid rgba(190,150,80,0.35)",
        borderRadius: "0.6vw",
        padding: "1.1vh 1.5vw",
        display: "flex",
        alignItems: "center",
        gap: "1.5vw",
        marginBottom: "2vh",
      }}>
        <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", flexShrink: 0 }}>IVA 19% (Chile)</div>
        <div style={{ fontSize: "1.1vw", color: "#7A8FA8", lineHeight: 1.4 }}>
          El precio al usuario <strong style={{ color: "#EDE1D3" }}>incluye IVA</strong> según Ley 21.210 (servicios digitales desde 2020).
          Apple/Google lo retienen y remiten al SII. La empresa recibe: <strong style={{ color: "#EDE1D3" }}>precio excl. IVA × 70%</strong> (descontada comisión tienda 30%).
          <span style={{ color: "#BE9650", fontWeight: 700 }}>  $6.900 → $4.059/mes neto</span>
        </div>
      </div>

      {/* Main: two columns */}
      <div style={{ display: "flex", gap: "4vw", flex: 1 }}>

        {/* Left: fixed costs */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "1vh" }}>
            COSTOS FIJOS / MES
          </div>
          <CostRow label="Coordinador general" sub="Gestión operativa y de artistas" value="$700.000" />
          <CostRow label="Asesoría TI" sub="Soporte técnico y mantenimiento" value="$200.000" />
          <CostRow label="Hosting e infraestructura" sub="Servidores, storage, CDN" value="$150.000" />
          <CostRow label="Gastos admin / oficina" sub="Arriendo base, servicios, colchón" value="$250.000" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.9vh 0 0", borderTop: "1px solid rgba(190,150,80,0.3)", marginTop: "0.6vh" }}>
            <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#EDE1D3" }}>Total fijos</div>
            <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#BE9650" }}>$1.300.000</div>
          </div>

          {/* Content */}
          <div style={{ marginTop: "2vh" }}>
            <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "1vh" }}>
              COSTOS CONTENIDO / MES
            </div>
            <CostRow label="Artistas / productores" sub="US$80/sesión · ~10 sesiones/mes" value="$720.000" />
            <CostRow label="Voces guía" sub="US$50/sesión · ~10 sesiones/mes" value="$450.000" />
            <CostRow label="Postproducción / edición" sub="Mezcla, masterización, assets" value="$330.000" />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.9vh 0 0", borderTop: "1px solid rgba(190,150,80,0.3)", marginTop: "0.6vh" }}>
              <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#EDE1D3" }}>Total contenido</div>
              <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#BE9650" }}>$1.500.000</div>
            </div>
            <div style={{ fontSize: "1.0vw", color: "#3D4F62", marginTop: "0.5vh" }}>
              $0 en Mes 1–2 (cubierto por inversión inicial)
            </div>
          </div>
        </div>

        {/* Right: marketing ramp-up + phase totals */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "1vh" }}>
            MARKETING: RAMP-UP MENSUAL
          </div>
          <div style={{ backgroundColor: "#090E17", border: "1px solid rgba(190,150,80,0.15)", borderRadius: "0.7vw", padding: "1.2vh 1.2vw", marginBottom: "2vh" }}>
            {[
              { rango: "Mes 1–2",  desc: "Cubierto por inversión inicial (US$5.000)",    valor: "$0" },
              { rango: "Mes 3–6",  desc: "Pauta social básica + contenido orgánico",      valor: "$500.000" },
              { rango: "Mes 7–12", desc: "Pauta ampliada + influencers nicho wellness",   valor: "$1.000.000 – $1.500.000" },
              { rango: "Mes 13–18",desc: "Retargeting + campañas multiregión LATAM",      valor: "$2.000.000" },
              { rango: "Mes 19–24",desc: "Escala regional + partnerships",                valor: "$2.500.000" },
            ].map(m => (
              <div key={m.rango} style={{ display: "flex", gap: "1vw", marginBottom: "0.7vh", alignItems: "baseline" }}>
                <div style={{ fontSize: "1.0vw", fontWeight: 700, color: "#EDE1D3", minWidth: "5vw" }}>{m.rango}</div>
                <div style={{ flex: 1, fontSize: "0.95vw", color: "#7A8FA8" }}>{m.desc}</div>
                <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#6EC49A", minWidth: "6.5vw", textAlign: "right" }}>{m.valor}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "1vh" }}>
            COSTO TOTAL MENSUAL POR FASE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.8vw" }}>
            {phases.map((p, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#090E17",
                  border: `1px solid ${i === 1 ? "rgba(190,150,80,0.35)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "0.6vw",
                  padding: "1.1vh 0.9vw",
                }}
              >
                <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#7A8FA8", whiteSpace: "pre-line", marginBottom: "0.8vh", lineHeight: 1.25 }}>{p.fase}</div>
                {[["Fijo", p.fijo], ["Contenido", p.contenido], ["Marketing", p.mkt]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3vh" }}>
                    <div style={{ fontSize: "0.85vw", color: "#3D4F62" }}>{k}</div>
                    <div style={{ fontSize: "0.85vw", color: "#EDE1D3", textAlign: "right", whiteSpace: "pre-line", lineHeight: 1.2 }}>{v}</div>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid rgba(190,150,80,0.2)", paddingTop: "0.5vh", marginTop: "0.4vh", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#EDE1D3" }}>Total</div>
                  <div style={{ fontSize: "0.95vw", fontWeight: 700, color: "#BE9650", textAlign: "right", whiteSpace: "pre-line", lineHeight: 1.2 }}>{p.total}</div>
                </div>
                <div style={{ fontSize: "0.78vw", color: "#3D4F62", marginTop: "0.4vh", whiteSpace: "pre-line", lineHeight: 1.25 }}>{p.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
