function ScenarioCard({
  label,
  highlight,
  installs,
  subs,
  revenue,
}: {
  label: string;
  highlight?: boolean;
  installs: string;
  subs: string;
  revenue: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: highlight ? "#181C3E" : "transparent",
        border: highlight ? "1.5px solid rgba(255,255,255,0.7)" : "1.5px solid rgba(255,255,255,0.3)",
        borderRadius: "1vw",
        padding: "3.2vh 1.9vw",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: "1.7vw", fontWeight: 700, color: highlight ? "#FFFFFF" : "#F4F4F4", marginBottom: "2.4vh" }}>
        {label}
      </div>
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.50)", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>INSTALACIONES</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#F4F4F4", lineHeight: 1 }}>{installs}</div>
      </div>
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.50)", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>SUSCRIPTORES MES 12</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#F4F4F4", lineHeight: 1 }}>{subs}</div>
      </div>
      <div>
        <div style={{ fontSize: "1.2vw", color: "rgba(244,244,244,0.50)", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>INGRESO NETO AÑO 1</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>{revenue}</div>
      </div>
    </div>
  );
}

export default function SlideProyeccion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          PROYECCIÓN A 12 MESES
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Un primer año <span style={{ color: "#FFFFFF" }}>realista.</span>
        </div>
      </div>

      {/* Scenario cards */}
      <div style={{ display: "flex", gap: "2vw" }}>
        <ScenarioCard
          label="Base"
          highlight
          installs="36.000"
          subs="3.600"
          revenue="+$22M CLP"
        />
        <ScenarioCard
          label="Optimista"
          installs="45.000"
          subs="4.500"
          revenue="+$46M CLP"
        />
        <ScenarioCard
          label="Agresivo"
          installs="60.000"
          subs="6.000"
          revenue="+$86M CLP"
        />
      </div>

      {/* Assumptions */}
      <div>
        {/* Key figures row */}
        <div style={{ display: "flex", gap: "1.2vw", alignItems: "stretch", marginBottom: "1.4vh" }}>
          {[
            { label: "Lanzamiento M1",    value: "$5.990 / $39.990 / $99.990", note: "Mensual · Anual · Lifetime" },
            { label: "Normal M2+",        value: "$7.990 / $49.990 / $149.990", note: "Mensual · Anual · Lifetime" },
            { label: "Blend (35/60/5%)", value: "~$3.116/mes/sub", note: "ARPU rec. + $1.77M/mes lifetime boost" },
          ].map((k) => (
            <div
              key={k.label}
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.23)",
                border: "1px solid rgba(255,255,255,0.20)",
                borderRadius: "0.6vw",
                padding: "1.0vh 1.1vw",
                display: "flex",
                flexDirection: "column",
                gap: "0.3vh",
              }}
            >
              <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.40)", letterSpacing: "0.08em" }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.35)" }}>{k.note}</div>
            </div>
          ))}
        </div>
        {/* Short disclaimer */}
        <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.35)", lineHeight: 1.5 }}>
          Base: 300 suscriptores nuevos/mes · Break-even operacional M5 · Recuperación de caja acumulada M8. Escenarios ilustrativos, no garantizados.
        </div>
      </div>

    </div>
  );
}
