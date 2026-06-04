function ScenarioCard({
  label,
  highlight,
  installs,
  subs,
  revenue,
  revenueUSD,
}: {
  label: string;
  highlight?: boolean;
  installs: string;
  subs: string;
  revenue: string;
  revenueUSD: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: highlight ? "#090E17" : "transparent",
        border: highlight ? "1.5px solid #BE9650" : "1.5px solid #3a2a1d",
        borderRadius: "1vw",
        padding: "3.2vh 1.9vw",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: "1.7vw", fontWeight: 700, color: highlight ? "#BE9650" : "#EDE1D3", marginBottom: "2.4vh" }}>
        {label}
      </div>
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.2vw", color: "#7A8FA8", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>INSTALACIONES</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#EDE1D3", lineHeight: 1 }}>{installs}</div>
      </div>
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.2vw", color: "#7A8FA8", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>SUSCRIPTORES MES 12</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#EDE1D3", lineHeight: 1 }}>{subs}</div>
      </div>
      <div>
        <div style={{ fontSize: "1.2vw", color: "#7A8FA8", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>INGRESO NETO AÑO 1</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>{revenue}</div>
        <div style={{ fontSize: "1.25vw", color: "#7A8FA8", marginTop: "0.4vh" }}>{revenueUSD}</div>
      </div>
    </div>
  );
}

export default function SlideProyeccion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          10 · PROYECCIÓN A 12 MESES
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Un primer año <span style={{ color: "#BE9650" }}>realista.</span>
        </div>
      </div>

      {/* Scenario cards */}
      <div style={{ display: "flex", gap: "2vw" }}>
        <ScenarioCard
          label="Conservador"
          installs="200.000"
          subs="10.000"
          revenue="$121M CLP"
          revenueUSD="≈ US$ 134.000"
        />
        <ScenarioCard
          label="Base"
          highlight
          installs="300.000"
          subs="15.000"
          revenue="$314M CLP"
          revenueUSD="≈ US$ 349.000"
        />
        <ScenarioCard
          label="Optimista"
          installs="500.000"
          subs="25.000"
          revenue="$475M CLP"
          revenueUSD="≈ US$ 528.000"
        />
      </div>

      {/* Assumptions */}
      <div style={{ fontSize: "1.4vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.55, maxWidth: "84vw" }}>
        Supuestos: crecimiento orgánico desde la comunidad de +1.000.000 de seguidores · precio $6.900/mes (IVA incl. 19%) · $43.900/año ·
        ARPU neto ~$3.300/mes (descontado IVA + comisión tienda 30%) · 3–6% de conversión a suscripción de pago · TC $900 CLP/USD.
        <span style={{ color: "#7A8FA8", fontSize: "1.3vw", display: "block", marginTop: "1vh" }}>
          Canal propio = costo de adquisición casi nulo. Recuperación de inversión inicial (US$30.000) estimada en mes 6–7. Escenarios ilustrativos, no garantizados.
        </span>
      </div>
    </div>
  );
}
