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
        backgroundColor: highlight ? "#1A0810" : "transparent",
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
      style={{ background: "linear-gradient(160deg, #2E0D16 0%, #1A0810 100%)", color: "#F4DAD5", padding: "9vh 6vw", boxSizing: "border-box" }}
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
      <div style={{ fontSize: "1.4vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.55, maxWidth: "84vw" }}>
        Supuestos: 1.000.000+ seguidores → 20% instala (200.000 usuarios free) → en año 1 convierte ~2,5% a premium (5.000); a madurez ~5% (techo 10.000) ·
        precio $8.990/mes (IVA incl. 19%), $59.990/año · ARPU neto blended ~$4.350/mes (descontado IVA + comisión tienda 30%) · mix 60% mensual / 40% anual.
        <span style={{ color: "rgba(242,231,228,0.50)", fontSize: "1.3vw", display: "block", marginTop: "1vh" }}>
          Núcleo orgánico = costo de adquisición casi nulo; la pauta paga es crecimiento incremental. Recuperación de la inversión ($27M CLP) estimada en mes 7–8. Escenarios ilustrativos, no garantizados.
        </span>
      </div>
    </div>
  );
}
