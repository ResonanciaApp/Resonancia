export default function SlideContingencia() {
  const cols = [
    {
      t: "CAJA REAL · MES 1",
      tint: "#6EC49A",
      d: (
        <>
          El 65% de las altas elige el plan anual y lo paga <span style={{ color: "#FFFFFF", fontWeight: 700 }}>completo por adelantado</span>:
          ~195 anuales × $23.500 netos ≈ <span style={{ color: "#FFFFFF", fontWeight: 700 }}>$4,6M</span> + ~$0,4M de mensuales
          = <span style={{ color: "#FFFFFF", fontWeight: 700 }}>~$5,0M de ingreso real</span> contra $4,3M de costos.
          El mes 1 prácticamente se paga solo, con $2,5M de marketing reservados de la ronda como respaldo.
        </>
      ),
    },
    {
      t: "EL RIESGO",
      tint: "rgba(224,112,112,0.9)",
      d: (
        <>
          Que el mix anual tarde: en una app nueva es común probar primero el plan mensual.
          Si el anual queda <span style={{ color: "#FFFFFF", fontWeight: 700 }}>bajo el 50%</span> de las altas,
          la caja real se acerca a la vista conservadora de las hojas 1–2
          (valle de hasta <span style={{ color: "#FFFFFF", fontWeight: 700 }}>≈ −$8,8M</span> entre M4 y M5).
        </>
      ),
    },
    {
      t: "LA CONTINGENCIA",
      tint: "#BE9650",
      d: (
        <>
          Línea comprometida de los socios por <span style={{ color: "#FFFFFF", fontWeight: 700 }}>~$6,3M</span> ($8,8M de valle − $2,5M ya reservados).
          Solo se gira si el mix anual no alcanza el 50% en los primeros 3 meses.
          <span style={{ color: "#FFFFFF", fontWeight: 700 }}> No es parte de la ronda ni diluye</span>: es un puente que la propia operación devuelve hacia M10–M11.
        </>
      ),
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{
        background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)",
        color: "#F4F4F4",
        padding: "7vh 6vw",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
        ANEXO FINANCIERO · PLAN DE CONTINGENCIA
      </div>
      <div style={{ fontSize: "3.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: "66vw" }}>
        Sin préstamos: la operación se financia con <span style={{ color: "#FFFFFF" }}>prepagos anuales.</span>
      </div>

      <div style={{ display: "flex", gap: "1.6vw", marginTop: "4.2vh" }}>
        {cols.map((c) => (
          <div
            key={c.t}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.14)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderTop: `3px solid ${c.tint}`,
              borderRadius: "0.7vw",
              padding: "2.4vh 1.5vw",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: "0.95vw", fontWeight: 700, color: c.tint, letterSpacing: "0.10em", marginBottom: "1.2vh" }}>{c.t}</div>
            <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.60)", lineHeight: 1.6 }}>{c.d}</div>
          </div>
        ))}
      </div>

      {/* Trigger / monitoreo */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "3vh" }}>
        <div style={{ flex: 1, backgroundColor: "rgba(190,150,80,0.07)", border: "1px solid rgba(190,150,80,0.35)", borderRadius: "0.7vw", padding: "2.2vh 1.6vw" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.10em", marginBottom: "0.9vh" }}>GATILLO Y MONITOREO</div>
          <div style={{ fontSize: "1.1vw", color: "rgba(244,244,244,0.65)", lineHeight: 1.6 }}>
            Indicador único: <span style={{ color: "#FFFFFF", fontWeight: 700 }}>% de suscripciones anuales sobre altas nuevas</span>, revisado mes a mes en M1–M3.
            Si el mix es ≥ 50%, la línea no se usa y la operación se autofinancia de principio a fin.
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", fontSize: "0.85vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.45 }}>
        Neto anual por adelantado = $39.990 ÷ 1,19 × 70% ≈ $23.500 (lanzamiento) · Vista conservadora en hojas 1–2 (anual reconocido mes a mes) ·
        La línea de contingencia es un compromiso de los socios fundadores, externo a la ronda. Cifras en CLP.
      </div>
    </div>
  );
}
