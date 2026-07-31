export default function SlideConclusionFinanciera() {
  const fases = [
    {
      t: "MESES 1–5 · EL VALLE",
      d: "Pocos suscriptores y marketing contenido: la caja acumulada llega a ≈ −$8,8M entre M4 y M5. Ese hoyo es lo que financia la ronda ($10M lo cubre con holgura).",
      tint: "rgba(224,112,112,0.9)",
    },
    {
      t: "MESES 6–10 · EL CRUCE",
      d: "Desde M6 los meses cierran en positivo y desde M7 entran los cursos: la caja acumulada empieza a recuperarse.",
      tint: "#BE9650",
    },
    {
      t: "MESES 11–12 · OPERACIÓN RENTABLE",
      d: "La caja acumulada se vuelve positiva en M11 y el mes 12 cierra con ~$13,6M de ingreso contra $7,7M de costos.",
      tint: "#6EC49A",
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
        ANEXO FINANCIERO · CONCLUSIÓN
      </div>
      <div style={{ fontSize: "3.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: "62vw" }}>
        La inversión no cubre pérdidas: <span style={{ color: "#FFFFFF" }}>cubre el arranque.</span>
      </div>

      {/* Fases */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "4.2vh" }}>
        {fases.map((f) => (
          <div
            key={f.t}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.14)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderTop: `3px solid ${f.tint}`,
              borderRadius: "0.7vw",
              padding: "2.4vh 1.5vw",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: "0.95vw", fontWeight: 700, color: f.tint, letterSpacing: "0.10em", marginBottom: "1.2vh" }}>{f.t}</div>
            <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.60)", lineHeight: 1.6 }}>{f.d}</div>
          </div>
        ))}
      </div>

      {/* Lectura de los dos escenarios */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "3vh" }}>
        <div style={{ flex: 1, backgroundColor: "rgba(110,196,154,0.07)", border: "1px solid rgba(110,196,154,0.30)", borderRadius: "0.7vw", padding: "2.2vh 1.6vw" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "#6EC49A", letterSpacing: "0.10em", marginBottom: "0.9vh" }}>CASO BASE (SIN CHURN)</div>
          <div style={{ fontSize: "1.1vw", color: "rgba(244,244,244,0.65)", lineHeight: 1.6 }}>
            El año 1 cierra con <span style={{ color: "#FFFFFF", fontWeight: 700 }}>+$9M netos</span>: el valle inicial se recupera dentro del mismo año (caja acumulada positiva desde M11).
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.14)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: "0.7vw", padding: "2.2vh 1.6vw" }}>
          <div style={{ fontSize: "0.9vw", fontWeight: 700, color: "rgba(244,244,244,0.55)", letterSpacing: "0.10em", marginBottom: "0.9vh" }}>ESCENARIO CHURN 15%</div>
          <div style={{ fontSize: "1.1vw", color: "rgba(244,244,244,0.65)", lineHeight: 1.6 }}>
            El año acumula <span style={{ color: "#FFFFFF", fontWeight: 700 }}>−$20M</span>: es el costo de arranque, no una pérdida permanente. Al mes 12 la operación llega <span style={{ color: "#6EC49A", fontWeight: 700 }}>al equilibrio mes a mes</span> (~$7,5M vs $7,7M) y el crecimiento posterior la vuelve rentable.
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", fontSize: "0.85vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.45 }}>
        Lectura de los anexos anteriores: caja acumulada (hoja 2), CAC ≈ $3.600 con payback de 1,1 meses y sensibilidad de churn.
        El rol de la ronda es financiar el valle de los primeros meses hasta que la base de suscriptores sostiene la operación. Cifras en CLP.
      </div>
    </div>
  );
}
