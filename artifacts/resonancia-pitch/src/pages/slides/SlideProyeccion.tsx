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
        backgroundColor: highlight ? "#24160F" : "transparent",
        border: highlight ? "1.5px solid #C69B4F" : "1.5px solid #3a2a1d",
        borderRadius: "1vw",
        padding: "3.2vh 1.9vw",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: "1.7vw", fontWeight: 700, color: highlight ? "#C69B4F" : "#EDE1D3", marginBottom: "2.4vh" }}>
        {label}
      </div>
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.2vw", color: "#7a6050", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>INSTALACIONES</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#EDE1D3", lineHeight: 1 }}>{installs}</div>
      </div>
      <div style={{ marginBottom: "2vh" }}>
        <div style={{ fontSize: "1.2vw", color: "#7a6050", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>SUSCRIPTORES DE PAGO</div>
        <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#EDE1D3", lineHeight: 1 }}>{subs}</div>
      </div>
      <div>
        <div style={{ fontSize: "1.2vw", color: "#7a6050", letterSpacing: "0.06em", marginBottom: "0.4vh" }}>INGRESO NETO AÑO 1</div>
        <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#C69B4F", lineHeight: 1 }}>{revenue}</div>
      </div>
    </div>
  );
}

export default function SlideProyeccion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7a6050", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          10 · PROYECCIÓN A 12 MESES
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Un primer año <span style={{ color: "#C69B4F" }}>realista.</span>
        </div>
      </div>

      {/* Scenario cards */}
      <div style={{ display: "flex", gap: "2vw" }}>
        <ScenarioCard label="Conservador" installs="80.000" subs="2.400" revenue="US$ 60.000" />
        <ScenarioCard label="Base" highlight installs="120.000" subs="6.000" revenue="US$ 150.000" />
        <ScenarioCard label="Optimista" installs="180.000" subs="12.600" revenue="US$ 315.000" />
      </div>

      {/* Assumptions */}
      <div style={{ fontSize: "1.4vw", fontWeight: 400, color: "#7a6050", lineHeight: 1.55, maxWidth: "84vw" }}>
        Supuestos: 8–18% de la comunidad instala la app en el año 1 · 3–7% de conversión a suscripción de pago ·
        ingreso neto ~US$ 25 por suscriptor/año (precios regionales, ya descontada la comisión de tienda).
        <span style={{ color: "#5a4632", fontSize: "1.3vw", display: "block", marginTop: "1vh" }}>
          Referencias de conversión freemium: Calm y Headspace (~3–5%). Escenarios ilustrativos, no garantizados.
        </span>
      </div>
    </div>
  );
}
