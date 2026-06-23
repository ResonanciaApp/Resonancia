export default function P07Negocio() {
  const tiers = [
    {
      name: "Free",
      bar: "rgba(244,218,213,0.2)",
      nameColor: "rgba(244,218,213,0.6)",
      monthly: "$0",
      annual: "Gratis",
      annualSub: "sin tarjeta",
      desc: "Acceso a sesiones seleccionadas, mezclador básico y comunidad.",
      items: ["Sesiones de muestra", "Mezclador básico", "Comunidad abierta"],
    },
    {
      name: "Premium",
      bar: "#D4AF37",
      nameColor: "#D4AF37",
      monthly: "USD 7.5 / mes",
      annual: "≈ USD 90 / año",
      annualSub: "facturación anual",
      desc: "Biblioteca completa, mezclador ilimitado, Geometrix y sesiones en vivo.",
      items: ["Todo el catálogo", "Geometrix completo", "Sesiones en vivo", "Descarga offline"],
    },
    {
      name: "Up Sell Hi-Fi",
      bar: "#F4DAD5",
      nameColor: "rgba(244,218,213,0.85)",
      monthly: "USD 15 – 100",
      annual: "Ticket único",
      annualSub: "por evento o curso",
      desc: "Cursos especializados y Livestreams con maestros. Pago puntual, sin suscripción adicional.",
      items: ["Cursos certificados", "Livestreams premium", "Masterclasses"],
    },
  ];

  const steps = [
    { n: "01", title: "Cobros", desc: "Activar suscripciones con RevenueCat y precios por región." },
    { n: "02", title: "Publicación", desc: "Builds con EAS, aprobación en App Store y Google Play." },
    { n: "03", title: "Lanzamiento", desc: "Salida en LatAm y España con prueba gratis de 7 días." },
    { n: "04", title: "Crecimiento", desc: "Marketing, alianzas con artistas y expansión del catálogo." },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left — tiers */}
        <div style={{ width: "52vw", padding: "7vh 4vw 6vh 7vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", marginBottom: "1.5vh" }}>EL NEGOCIO</div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5, marginBottom: "3.5vh" }} />
            <div style={{ fontSize: "3.8vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "3.5vh" }}>
              Freemium →<br />suscripción →<br /><span style={{ color: "#D4AF37" }}>ecosistema.</span>
            </div>

            {/* Tier cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.6vh" }}>
              {tiers.map((t) => (
                <div key={t.name} style={{ display: "flex", alignItems: "stretch", gap: "1.5vw" }}>
                  {/* Color bar */}
                  <div style={{ width: "0.4vw", backgroundColor: t.bar, borderRadius: "2px", flexShrink: 0, minHeight: "100%" }} />
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.3vh" }}>
                      <div style={{ fontSize: "1.35vw", fontWeight: 700, color: t.nameColor }}>{t.name}</div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "1.3vw", fontWeight: 700, color: t.name === "Premium" ? "#F4DAD5" : "rgba(244,218,213,0.55)" }}>{t.monthly}</span>
                        <span style={{ fontSize: "0.95vw", fontWeight: 400, color: "rgba(244,218,213,0.3)", marginLeft: "0.6vw" }}>{t.annual} · {t.annualSub}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "1.05vw", fontWeight: 400, color: "rgba(244,218,213,0.38)", lineHeight: 1.5 }}>{t.desc}</div>
                    <div style={{ display: "flex", gap: "0.8vw", marginTop: "0.5vh", flexWrap: "wrap" }}>
                      {t.items.map((item) => (
                        <span key={item} style={{ fontSize: "0.9vw", color: "rgba(244,218,213,0.3)", borderLeft: "1px solid rgba(212,175,55,0.2)", paddingLeft: "0.5vw" }}>{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>09 / 09</div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.12)", margin: "7vh 0" }} />

        {/* Right — roadmap */}
        <div style={{ flex: 1, padding: "7vh 6vw 6vh 4vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "rgba(244,218,213,0.3)", marginBottom: "1.5vh" }}>HOJA DE RUTA</div>
            <div style={{ width: "3vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.4, marginBottom: "3.5vh" }} />
            <div style={{ fontSize: "2.8vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: "3.5vh" }}>
              El camino a<br /><span style={{ color: "#D4AF37" }}>las tiendas.</span>
            </div>

            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2.2vh" }}>
              {steps.map((s) => (
                <div key={s.n} style={{ display: "flex", gap: "1.5vw", alignItems: "flex-start", paddingBottom: "2.2vh", borderBottom: "1px solid rgba(244,218,213,0.06)" }}>
                  <div style={{ fontSize: "2vw", fontWeight: 800, color: "rgba(212,175,55,0.4)", flexShrink: 0, lineHeight: 1 }}>{s.n}</div>
                  <div>
                    <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#F4DAD5", marginBottom: "0.4vh" }}>{s.title}</div>
                    <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(244,218,213,0.45)", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "rgba(244,218,213,0.4)", lineHeight: 1.6, borderTop: "1px solid rgba(212,175,55,0.1)", paddingTop: "2vh" }}>
            El equipo tiene el producto listo para ejecutar. La inversión activa el go-to-market.
          </div>
        </div>

      </div>
    </div>
  );
}
