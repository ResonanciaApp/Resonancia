export default function SlideCAC() {
  const drivers = [
    {
      t: "Comunidad propia",
      d: "+1.000.000 de seguidores activos en redes: distribución orgánica con costo de adquisición casi nulo",
    },
    {
      t: "Nicho de alta intención",
      d: "Pauta segmentada a audiencia wellness/meditación en Chile: menos competencia y mejor conversión que categorías masivas",
    },
    {
      t: "Contenido que se comparte",
      d: "Sesiones, encuentros en vivo y artistas (Resonadores) generan alcance orgánico que baja el CAC blended mes a mes",
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
      {/* Header */}
      <div style={{ fontSize: "1.3vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.2vh" }}>
        ANEXO FINANCIERO · COSTO POR ADQUISICIÓN
      </div>
      <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
        Cada suscriptor se paga <span style={{ color: "#FFFFFF" }}>en ~1,1 meses.</span>
      </div>

      {/* KPI row */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "4.5vh" }}>
        {[
          { k: "CAC BLENDED AÑO 1", v: "≈ $3.600", s: "por suscriptor (rango $3.100–$4.000)" },
          { k: "INVERSIÓN EN MARKETING AÑO 1", v: "≈ $13M", s: "pre-lanzamiento + ramp-up M1–M12" },
          { k: "SUSCRIPTORES AÑO 1", v: "3.600", s: "300 nuevos subs/mes (caso base)" },
          { k: "PAYBACK DEL CAC", v: "1,1 meses", s: "CAC ÷ ARPU recurrente $3.238/mes" },
        ].map((c) => (
          <div
            key={c.k}
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.14)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "0.7vw",
              padding: "2.6vh 1.4vw",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "rgba(244,244,244,0.50)", letterSpacing: "0.10em", marginBottom: "1.2vh" }}>{c.k}</div>
            <div style={{ fontSize: "2.4vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>{c.v}</div>
            <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.48)", marginTop: "1vh", lineHeight: 1.4 }}>{c.s}</div>
          </div>
        ))}
      </div>

      {/* Why CAC stays low */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "3.5vh" }}>
        {drivers.map((d) => (
          <div key={d.t} style={{ flex: 1 }}>
            <div style={{ fontSize: "1.35vw", fontWeight: 700, color: "#F4F4F4", marginBottom: "0.8vh" }}>{d.t}</div>
            <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.55 }}>{d.d}</div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div style={{ marginTop: "auto", fontSize: "0.85vw", color: "rgba(244,244,244,0.38)", lineHeight: 1.45 }}>
        CAC blended = marketing total año 1 (pre-lanzamiento $1,5M · M1–M2 $2M · M3–M6 $2M · M7–M12 $6M–$9M) ÷ 3.600 suscriptores del caso base.
        Payback sobre ARPU recurrente blended $3.238 (neto de IVA y comisión de tienda). Cifras en CLP, consistentes con el anexo de flujo de caja.
      </div>
    </div>
  );
}
