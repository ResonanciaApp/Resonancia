export default function P06Competencia() {
  const rows = [
    {
      app: "Calm",
      origin: "EE.UU.",
      valuation: "USD 2B+",
      users: "100M+",
      attrs: ["Inglés exclusivo", "Marketing masivo", "Contenido de terceros"],
      isUs: false,
    },
    {
      app: "Headspace",
      origin: "EE.UU.",
      valuation: "USD 300M",
      users: "70M+",
      attrs: ["Enfoque clínico/científico", "B2B corporativo", "Solo en inglés"],
      isUs: false,
    },
    {
      app: "Insight Timer",
      origin: "Australia",
      valuation: "~USD 100M",
      users: "26M",
      attrs: ["Crowdsourced sin curaduría", "Gratuito masivo", "Sin identidad cultural"],
      isUs: false,
    },
    {
      app: "Pura Mente",
      origin: "Argentina",
      valuation: "No pública",
      users: "~500k",
      attrs: ["Español (mercado AR)", "Meditación guiada", "Sin raíz ancestral"],
      isUs: false,
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "6vh 7vw 5vh", zIndex: 2 }}>

        {/* Header */}
        <div style={{ marginBottom: "3.5vh", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "3vw" }}>
            <div>
              <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", marginBottom: "1.5vh" }}>COMPETENCIA</div>
              <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: "2.2vw", fontWeight: 700, letterSpacing: "-0.02em", color: "rgba(244,218,213,0.9)" }}>
              El campo hispanohablante está <span style={{ color: "#D4AF37" }}>abierto.</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

          {/* Header row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr 1fr 3fr",
            gap: "0 1.5vw",
            paddingBottom: "1.5vh",
            borderBottom: "1px solid rgba(212,175,55,0.25)",
          }}>
            {["APP", "ORIGEN", "VALORACIÓN", "USUARIOS", "DIFERENCIADORES"].map((c) => (
              <div key={c} style={{ fontSize: "0.9vw", fontWeight: 600, letterSpacing: "0.15em", color: "rgba(244,218,213,0.3)" }}>{c}</div>
            ))}
          </div>

          {/* Data rows */}
          {rows.map((r) => (
            <div
              key={r.app}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr 1fr 1fr 3fr",
                gap: "0 1.5vw",
                padding: "1.6vh 0",
                borderBottom: `1px solid ${r.isUs ? "rgba(212,175,55,0.25)" : "rgba(244,218,213,0.05)"}`,
                backgroundColor: r.isUs ? "rgba(212,175,55,0.04)" : "transparent",
                alignItems: "center",
              }}
            >
              {/* App name */}
              <div style={{ fontSize: r.isUs ? "1.5vw" : "1.35vw", fontWeight: r.isUs ? 800 : 500, color: r.isUs ? "#D4AF37" : "rgba(244,218,213,0.85)" }}>
                {r.app}
              </div>

              {/* Origin */}
              <div style={{ fontSize: "1.1vw", fontWeight: 400, color: r.isUs ? "rgba(244,218,213,0.7)" : "rgba(244,218,213,0.4)" }}>
                {r.origin}
              </div>

              {/* Valuation */}
              <div style={{ fontSize: "1.1vw", fontWeight: r.isUs ? 600 : 400, color: r.isUs ? "rgba(244,218,213,0.7)" : "rgba(244,218,213,0.45)" }}>
                {r.valuation}
              </div>

              {/* Users */}
              <div style={{ fontSize: "1.15vw", fontWeight: r.isUs ? 700 : 400, color: r.isUs ? "#E9C46A" : "rgba(244,218,213,0.45)" }}>
                {r.users}
              </div>

              {/* Attributes */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4vh 0.4vw", alignItems: "center" }}>
                {r.attrs.map((a) => (
                  <div
                    key={a}
                    style={{
                      fontSize: "0.95vw",
                      fontWeight: r.isUs ? 600 : 400,
                      color: r.isUs ? "#F4DAD5" : "rgba(244,218,213,0.5)",
                      backgroundColor: r.isUs ? "rgba(212,175,55,0.1)" : "rgba(244,218,213,0.04)",
                      border: `1px solid ${r.isUs ? "rgba(212,175,55,0.3)" : "rgba(244,218,213,0.08)"}`,
                      borderRadius: "999px",
                      padding: "0.3vh 0.7vw",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "2.5vh", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>09 / 10</div>
        </div>
      </div>
    </div>
  );
}
