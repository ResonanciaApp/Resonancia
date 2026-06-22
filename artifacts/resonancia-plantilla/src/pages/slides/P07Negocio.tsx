export default function P07Negocio() {
  const metrics = [
    { label: "LTV estimado Premium", value: "USD 180", sub: "24 meses de retención media × USD 7.5/mes" },
    { label: "CAC objetivo", value: "< USD 12", sub: "Canal orgánico + comunidad existente como motor" },
    { label: "Payback period", value: "< 2 meses", sub: "LTV:CAC ratio objetivo ≥ 15:1" },
    { label: "Gross margin SaaS", value: "~78%", sub: "Plataforma de contenido digital, sin COGS físico" },
  ];

  const tiers = [
    { name: "Free", color: "rgba(237,225,211,0.15)", users: "Adquisición masiva", mrr: "—" },
    { name: "Premium", color: "#BE9650", users: "Conversión target 8–12%", mrr: "USD 7.5/mes" },
    { name: "Premium Plus", color: "#EDE1D3", users: "Upsell Hi-Fi + cursos", mrr: "USD 18/mes" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}>

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left */}
        <div style={{ width: "50vw", padding: "8vh 4vw 8vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#BE9650", marginBottom: "1.5vh" }}>EL NEGOCIO</div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#BE9650", opacity: 0.5, marginBottom: "4vh" }} />
            <div style={{ fontSize: "5vw", fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "5vh" }}>
              Freemium →<br />suscripción →<br /><span style={{ color: "#BE9650" }}>ecosistema.</span>
            </div>

            {/* Tier bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.8vh" }}>
              {tiers.map((t) => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "2vw" }}>
                  <div style={{ width: "0.6vw", height: "4.5vh", backgroundColor: t.color, borderRadius: "2px", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontSize: "1.5vw", fontWeight: 600, color: t.name === "Premium" ? "#BE9650" : "rgba(237,225,211,0.7)" }}>{t.name}</div>
                      <div style={{ fontSize: "1.5vw", fontWeight: 700, color: t.name === "Premium" ? "#EDE1D3" : "rgba(237,225,211,0.45)" }}>{t.mrr}</div>
                    </div>
                    <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(237,225,211,0.35)" }}>{t.users}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(237,225,211,0.25)" }}>07 / 08</div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(190,150,80,0.12)", margin: "8vh 0" }} />

        {/* Right — metrics */}
        <div style={{ flex: 1, padding: "8vh 8vw 8vh 4vw", display: "flex", flexDirection: "column", justifyContent: "center", gap: "4.5vh" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(237,225,211,0.3)", marginBottom: "1vh" }}>ECONOMÍA UNITARIA</div>
          {metrics.map((m) => (
            <div key={m.label} style={{ paddingBottom: "3.5vh", borderBottom: "1px solid rgba(237,225,211,0.07)" }}>
              <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "rgba(237,225,211,0.45)", marginBottom: "0.7vh" }}>{m.label}</div>
              <div style={{ fontSize: "3.5vw", fontWeight: 700, letterSpacing: "-0.03em", color: "#BE9650", marginBottom: "0.5vh" }}>{m.value}</div>
              <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(237,225,211,0.3)" }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
