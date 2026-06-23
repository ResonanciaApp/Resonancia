import { GOLD_GRADIENT } from "@/utils/goldText";
export default function P07Negocio() {
  const tiers = [
    {
      name: "Free",
      bar: "rgba(244,218,213,0.2)",
      nameColor: "rgba(244,218,213,0.6)",
      monthly: "$0 / mes",
      annual: "$0 / año",
      tag: "Acceso gratuito sin tarjeta.",
    },
    {
      name: "Premium",
      bar: "#D4AF37",
      nameColor: "#D4AF37",
      monthly: "USD 7.5 / mes",
      annual: "USD 75 / año",
      tag: "Biblioteca completa ilimitada.",
    },
    {
      name: "Up Sell Hi-Fi",
      bar: "#F4DAD5",
      nameColor: "rgba(244,218,213,0.85)",
      monthly: "USD 15 – 100",
      annual: "Ticket único",
      tag: "Cursos y lives exclusivos.",
    },
  ];

  const scenarios = [
    {
      label: "Realista",
      highlight: true,
      installs: "400.000",
      subs: "10.000",
      revenue: "$241M CLP",
      revenueUSD: "≈ US$ 268.000",
    },
    {
      label: "Optimista",
      highlight: false,
      installs: "600.000",
      subs: "15.000",
      revenue: "$361M CLP",
      revenueUSD: "≈ US$ 401.000",
    },
    {
      label: "Agresivo",
      highlight: false,
      installs: "1.000.000",
      subs: "25.000",
      revenue: "$602M CLP",
      revenueUSD: "≈ US$ 669.000",
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left — tiers */}
        <div style={{ width: "52vw", padding: "7vh 4vw 6vh 7vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", ...GOLD_GRADIENT, marginBottom: "1.5vh" }}>EL NEGOCIO</div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5, marginBottom: "3.5vh" }} />
            <div style={{ fontSize: "3.8vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "3.5vh" }}>
              Freemium,<br />suscripción,<br /><span style={GOLD_GRADIENT}>ecosistema.</span>
            </div>

            {/* Tier cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.6vh" }}>
              {tiers.map((t) => (
                <div key={t.name} style={{ display: "flex", alignItems: "stretch", gap: "1.5vw" }}>
                  {/* Color bar */}
                  <div style={{ width: "0.4vw", backgroundColor: t.bar, borderRadius: "2px", flexShrink: 0, minHeight: "100%" }} />
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.5vh" }}>
                      <div style={{ fontSize: "1.35vw", fontWeight: 700, ...(t.nameColor === "#D4AF37" ? GOLD_GRADIENT : { color: t.nameColor }) }}>{t.name}</div>
                      <div style={{ textAlign: "right", display: "flex", gap: "1.2vw", alignItems: "baseline" }}>
                        <span style={{ fontSize: "1.3vw", fontWeight: 700, color: t.name === "Premium" ? "#F4DAD5" : "rgba(244,218,213,0.55)" }}>{t.monthly}</span>
                        <span style={{ fontSize: "1.05vw", fontWeight: 400, color: "rgba(244,218,213,0.3)" }}>{t.annual}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "1.05vw", fontWeight: 400, color: "rgba(244,218,213,0.35)", letterSpacing: "0.01em" }}>{t.tag}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>10 / 10</div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.12)", margin: "7vh 0" }} />

        {/* Right — projections */}
        <div style={{ flex: 1, padding: "7vh 5vw 6vh 3vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "rgba(244,218,213,0.3)", marginBottom: "1.5vh" }}>PROYECCIÓN AÑO 1</div>
            <div style={{ width: "3vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.4, marginBottom: "3vh" }} />
            <div style={{ fontSize: "2.6vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: "3vh" }}>
              Un primer año<br /><span style={GOLD_GRADIENT}>realista.</span>
            </div>

            {/* Scenario cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.4vh" }}>
              {scenarios.map((s) => (
                <div key={s.label} style={{
                  border: s.highlight ? "1.5px solid rgba(212,175,55,0.6)" : "1.5px solid rgba(244,218,213,0.08)",
                  borderRadius: "0.8vw",
                  padding: "1.4vh 1.5vw",
                  backgroundColor: s.highlight ? "rgba(212,175,55,0.05)" : "transparent",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1.4fr",
                  alignItems: "center",
                  gap: "0 1vw",
                }}>
                  <div style={{ fontSize: "1.25vw", fontWeight: 700, ...(s.highlight ? GOLD_GRADIENT : { color: "rgba(244,218,213,0.7)" }) }}>{s.label}</div>
                  <div>
                    <div style={{ fontSize: "0.85vw", color: "rgba(244,218,213,0.35)", letterSpacing: "0.08em", marginBottom: "0.2vh" }}>INSTALACIONES</div>
                    <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#F4DAD5" }}>{s.installs}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85vw", color: "rgba(244,218,213,0.35)", letterSpacing: "0.08em", marginBottom: "0.2vh" }}>SUBS MES 12</div>
                    <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#F4DAD5" }}>{s.subs}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85vw", color: "rgba(244,218,213,0.35)", letterSpacing: "0.08em", marginBottom: "0.2vh" }}>INGRESO NETO AÑO 1</div>
                    <div style={{ fontSize: "1.2vw", fontWeight: 700, ...GOLD_GRADIENT }}>{s.revenue}</div>
                    <div style={{ fontSize: "0.9vw", color: "rgba(244,218,213,0.35)" }}>{s.revenueUSD}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "1.0vw", fontWeight: 400, color: "rgba(244,218,213,0.3)", lineHeight: 1.6, borderTop: "1px solid rgba(212,175,55,0.1)", paddingTop: "1.8vh" }}>
            Ingreso neto = subs promedio anual × ARPU neto × 12 meses · Subs promedio ≈ 61% del total mes 12 (crecimiento lineal durante el año) · ARPU (ingreso promedio por usuario) neto ~$3.300/mes CLP (USD 7,5 → ~$6.750 CLP, descontado IVA + comisión tienda 30%) · Conversión free → premium ~2,5% · TC $900 CLP/USD · Escenarios ilustrativos.
          </div>
        </div>

      </div>
    </div>
  );
}
