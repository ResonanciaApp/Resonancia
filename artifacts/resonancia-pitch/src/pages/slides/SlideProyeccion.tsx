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
        backgroundColor: highlight ? "#170e21" : "transparent",
        border: highlight ? "1.5px solid #F7CB6B" : "1.5px solid #3D0E16",
        borderRadius: "1vw",
        padding: "3.2vh 1.9vw",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: "1.7vw", fontWeight: 700, color: highlight ? "#F7CB6B" : "#F4DAD5", marginBottom: "2.4vh" }}>
        {label}
      </div>
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.2vw", color: "rgba(242,231,228,0.50)", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>INSTALACIONES</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#F4DAD5", lineHeight: 1 }}>{installs}</div>
      </div>
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.2vw", color: "rgba(242,231,228,0.50)", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>SUSCRIPTORES MES 12</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#F4DAD5", lineHeight: 1 }}>{subs}</div>
      </div>
      <div>
        <div style={{ fontSize: "1.2vw", color: "rgba(242,231,228,0.50)", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>INGRESO NETO AÑO 1</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>{revenue}</div>
      </div>
    </div>
  );
}

export default function SlideProyeccion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #1f132c 0%, #170e21 100%)", color: "#F4DAD5", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          PROYECCIÓN A 12 MESES
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Un primer año <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>realista.</span>
        </div>
      </div>

      {/* Scenario cards */}
      <div style={{ display: "flex", gap: "2vw" }}>
        <ScenarioCard
          label="Base"
          highlight
          installs="200.000"
          subs="5.000"
          revenue="$136M CLP"
        />
        <ScenarioCard
          label="Optimista"
          installs="250.000"
          subs="7.000"
          revenue="$200M CLP"
        />
        <ScenarioCard
          label="Agresivo"
          installs="300.000"
          subs="10.000"
          revenue="$280M CLP"
        />
      </div>

      {/* Assumptions */}
      <div>
        {/* Key figures row */}
        <div style={{ display: "flex", gap: "1.2vw", alignItems: "stretch", marginBottom: "1.4vh" }}>
          {[
            { label: "Mensual", value: "$8.990", note: "IVA incl. 19%" },
            { label: "Anual",   value: "$59.990", note: "IVA incl. 19%" },
            { label: "ARPU neto blended", value: "~$4.350/mes", note: "desc. IVA + comisión 30%" },
            { label: "Comisión tienda",   value: "30%", note: "Apple / Google" },
            { label: "IVA",               value: "19%", note: "incluido en precio" },
          ].map((k) => (
            <div
              key={k.label}
              style={{
                flex: 1,
                backgroundColor: "rgba(26,8,16,0.70)",
                border: "1px solid rgba(247,203,107,0.20)",
                borderRadius: "0.6vw",
                padding: "1.0vh 1.1vw",
                display: "flex",
                flexDirection: "column",
                gap: "0.3vh",
              }}
            >
              <div style={{ fontSize: "0.85vw", color: "rgba(242,231,228,0.40)", letterSpacing: "0.08em" }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: "1.5vw", fontWeight: 700, background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: "0.85vw", color: "rgba(242,231,228,0.35)" }}>{k.note}</div>
            </div>
          ))}
        </div>
        {/* Short disclaimer */}
        <div style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.35)", lineHeight: 1.5 }}>
          Base: 1M seguidores · 20% instala · 2,5% convierte a premium. Recuperación estimada mes 7–8. Escenarios ilustrativos.
        </div>
      </div>
    </div>
  );
}
