function Diamond() {
  return (
    <div style={{
      width: "0.7vw", height: "0.7vw",
      backgroundColor: "#BE9650",
      transform: "rotate(45deg)",
      flexShrink: 0, marginTop: "0.35vw",
    }} />
  );
}

function CostRow({ label, sub, value, gold }: { label: string; sub?: string; value: string; gold?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.8vw", padding: "0.9vh 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <Diamond />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "1.35vw", fontWeight: 600, color: "#EDE1D3" }}>{label}</div>
        {sub && <div style={{ fontSize: "1.05vw", color: "#3D4F62", marginTop: "0.2vh" }}>{sub}</div>}
      </div>
      <div style={{ fontSize: "1.45vw", fontWeight: 700, color: gold ? "#BE9650" : "#7A8FA8", textAlign: "right", minWidth: "8vw" }}>
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
      contenido: "$1.800.000",
      mkt: "$0",
      total: "$3.100.000",
      note: "Marketing cubierto\npor inversión inicial",
    },
    {
      fase: "Tracción\nMes 3–6",
      fijo: "$1.900.000",
      contenido: "$2.500.000",
      mkt: "$500.000",
      total: "$4.900.000",
      note: "Pauta social orgánica\n+ paid básico",
    },
    {
      fase: "Crecimiento\nMes 7–10",
      fijo: "$1.900.000",
      contenido: "$3.000.000",
      mkt: "$1.000.000",
      total: "$5.900.000",
      note: "Mayor pauta +\ninfluencers nicho",
    },
    {
      fase: "Escala\nMes 11–12",
      fijo: "$1.900.000",
      contenido: "$3.600.000",
      mkt: "$1.500.000",
      total: "$7.000.000",
      note: "Retargeting +\ncampañas regionales",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "7.5vh 6vw 6vh", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div style={{ marginBottom: "2.5vh" }}>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1vh" }}>
          ANEXO FINANCIERO · HOJA 3 DE 3
        </div>
        <div style={{ fontSize: "3.6vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Desglose de <span style={{ color: "#BE9650" }}>costos mensuales.</span>
        </div>
      </div>

      {/* Main: two columns */}
      <div style={{ display: "flex", gap: "4vw", flex: 1 }}>

        {/* Left: fixed costs */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "1.2vh" }}>
            COSTOS FIJOS / MES
          </div>
          <CostRow label="Coordinador general" sub="Gestión operativa y de artistas" value="$700.000" />
          <CostRow label="Marketing recurrente" sub="Pauta social · crece con ingresos (ver abajo)" value="$500K → $1,5M" gold />
          <CostRow label="Asesoría TI" sub="Soporte técnico y mantenimiento" value="$200.000" />
          <CostRow label="Hosting e infraestructura" sub="Servidores, storage, CDN" value="$150.000" />
          <CostRow label="Gastos admin / oficina" sub="Arriendo base, servicios, colchón" value="$250.000" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "1vh 0 0", borderTop: "1px solid rgba(190,150,80,0.3)", marginTop: "0.8vh" }}>
            <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#EDE1D3" }}>Total fijo (excl. mkt variable)</div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#BE9650" }}>$1.300.000 – $1.900.000</div>
          </div>
        </div>

        {/* Right: variable costs */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "1.2vh" }}>
            COSTOS VARIABLES / MES
          </div>
          <CostRow
            label="Artistas / productores"
            sub="US$80/sesión · 10–20 sesiones/mes"
            value="$720K – $1,44M"
          />
          <CostRow
            label="Voces guía"
            sub="US$50/sesión · 10–20 sesiones/mes"
            value="$450K – $900K"
          />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "1vh 0 0", borderTop: "1px solid rgba(190,150,80,0.3)", marginTop: "0.8vh" }}>
            <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#EDE1D3" }}>Total contenido</div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#BE9650" }}>$1,2M – $2,34M</div>
          </div>

          {/* Marketing detail */}
          <div style={{ marginTop: "2.5vh", backgroundColor: "#090E17", border: "1px solid rgba(190,150,80,0.2)", borderRadius: "0.8vw", padding: "1.5vh 1.2vw" }}>
            <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.08em", marginBottom: "1vh" }}>
              MARKETING: RAMP-UP MENSUAL
            </div>
            {[
              { rango: "Mes 1–2", desc: "Cubierto por inversión inicial ($5.000 USD)", valor: "$0 recurrente" },
              { rango: "Mes 3–6", desc: "Pauta social básica + contenido orgánico", valor: "$500.000" },
              { rango: "Mes 7–10", desc: "Pauta + influencers nicho meditación/wellness", valor: "$1.000.000" },
              { rango: "Mes 11–12", desc: "Retargeting + campañas regionales LATAM", valor: "$1.500.000" },
            ].map(m => (
              <div key={m.rango} style={{ display: "flex", gap: "1vw", marginBottom: "0.7vh", alignItems: "baseline" }}>
                <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#EDE1D3", minWidth: "5vw" }}>{m.rango}</div>
                <div style={{ flex: 1, fontSize: "1.0vw", color: "#7A8FA8" }}>{m.desc}</div>
                <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#6EC49A", minWidth: "6vw", textAlign: "right" }}>{m.valor}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phase totals */}
      <div style={{ marginTop: "2.5vh" }}>
        <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.1em", marginBottom: "1.2vh" }}>
          COSTO TOTAL MENSUAL ESTIMADO POR FASE
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.2vw" }}>
          {phases.map((p, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#090E17",
                border: `1px solid ${i === 1 ? "rgba(190,150,80,0.4)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: "0.7vw",
                padding: "1.3vh 1.1vw",
              }}
            >
              <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#7A8FA8", whiteSpace: "pre-line", marginBottom: "1vh", lineHeight: 1.3 }}>{p.fase}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35vh" }}>
                <div style={{ fontSize: "0.95vw", color: "#3D4F62" }}>Fijo</div>
                <div style={{ fontSize: "0.95vw", color: "#EDE1D3" }}>{p.fijo}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35vh" }}>
                <div style={{ fontSize: "0.95vw", color: "#3D4F62" }}>Contenido</div>
                <div style={{ fontSize: "0.95vw", color: "#EDE1D3" }}>{p.contenido}</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8vh" }}>
                <div style={{ fontSize: "0.95vw", color: "#3D4F62" }}>Marketing</div>
                <div style={{ fontSize: "0.95vw", color: "#6EC49A" }}>{p.mkt}</div>
              </div>
              <div style={{ borderTop: "1px solid rgba(190,150,80,0.2)", paddingTop: "0.6vh", display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#EDE1D3" }}>Total</div>
                <div style={{ fontSize: "1.15vw", fontWeight: 700, color: "#BE9650" }}>{p.total}</div>
              </div>
              <div style={{ fontSize: "0.9vw", color: "#3D4F62", marginTop: "0.5vh", whiteSpace: "pre-line", lineHeight: 1.3 }}>{p.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
