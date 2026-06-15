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
        backgroundColor: highlight ? "#27070E" : "transparent",
        border: highlight ? "1.5px solid #D4AF37" : "1.5px solid #3a2a1d",
        borderRadius: "1vw",
        padding: "3.2vh 1.9vw",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: "1.7vw", fontWeight: 700, color: highlight ? "#D4AF37" : "#F4DAD5", marginBottom: "2.4vh" }}>
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
        <div style={{ fontSize: "2.4vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>{revenue}</div>
        <div style={{ fontSize: "1.25vw", color: "rgba(242,231,228,0.50)", marginTop: "0.4vh" }}>{revenueUSD}</div>
      </div>
    </div>
  );
}

export default function SlideProyeccion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          10 · PROYECCIÓN A 12 MESES
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Un primer año <span style={{ background: "linear-gradient(90deg, #FF6B3D, #FF9E4D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>realista.</span>
        </div>
      </div>

      {/* Scenario cards */}
      <div style={{ display: "flex", gap: "2vw" }}>
        <ScenarioCard
          label="Base"
          highlight
          installs="200.000"
          subs="5.000"
          revenue="$121M CLP"
          revenueUSD="≈ US$ 134.000"
        />
        <ScenarioCard
          label="Optimista"
          installs="250.000"
          subs="8.000"
          revenue="$193M CLP"
          revenueUSD="≈ US$ 214.000"
        />
        <ScenarioCard
          label="Agresivo"
          installs="300.000"
          subs="10.000"
          revenue="$241M CLP"
          revenueUSD="≈ US$ 268.000"
        />
      </div>

      {/* Assumptions */}
      <div style={{ fontSize: "1.4vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.55, maxWidth: "84vw" }}>
        Supuestos: 1.000.000+ seguidores → 20% instala (200.000 usuarios free) → en año 1 convierte ~2,5% a premium (5.000); a madurez ~5% (techo 10.000) ·
        precio $6.900/mes (IVA incl. 19%), $43.900/año · ARPU neto ~$3.300/mes (descontado IVA + comisión tienda 30%) · TC $900 CLP/USD.
        <span style={{ color: "rgba(242,231,228,0.50)", fontSize: "1.3vw", display: "block", marginTop: "1vh" }}>
          Núcleo orgánico = costo de adquisición casi nulo; la pauta paga es crecimiento incremental. Recuperación de la inversión (US$30.000) estimada en mes 9–10. Escenarios ilustrativos, no garantizados.
        </span>
      </div>
    </div>
  );
}
