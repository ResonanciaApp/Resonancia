export default function P06Competencia() {
  const rows = [
    {
      app: "Calm",
      origin: "EE.UU.",
      valuation: "USD 2B+",
      users: "100M+",
      attrs: ["Inglés exclusivo", "Marketing masivo", "Contenido de terceros"],
    },
    {
      app: "Headspace",
      origin: "EE.UU.",
      valuation: "USD 300M",
      users: "70M+",
      attrs: ["Enfoque clínico/científico", "B2B corporativo", "Solo en inglés"],
    },
    {
      app: "Insight Timer",
      origin: "Australia",
      valuation: "~USD 100M",
      users: "26M",
      attrs: ["Crowdsourced sin curaduría", "Gratuito masivo", "Sin identidad cultural"],
    },
    {
      app: "Pura Mente",
      origin: "Argentina",
      valuation: "No pública",
      users: "~500k",
      attrs: ["Español (mercado AR)", "Meditación guiada", "Sin raíz ancestral"],
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "6vh 7vw 5vh", zIndex: 2 }}>

        {/* Label */}
        <div style={{ flexShrink: 0, marginBottom: "1.5vh" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", background: "linear-gradient(90deg, #D6AD5F, #B47344)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "1.5vh" }}>COMPETENCIA</div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5 }} />
        </div>

        {/* Title */}
        <div style={{ fontSize: "2.4vw", fontWeight: 700, letterSpacing: "-0.02em", color: "rgba(244,218,213,0.9)", flexShrink: 0, marginBottom: "1.8vh" }}>
          Gigantes de la <span style={{ display: "inline-block", background: "linear-gradient(90deg, #D6AD5F, #B47344)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>relajación.</span>
        </div>

        {/* Validation text */}
        <div style={{ fontSize: "1.2vw", fontWeight: 400, lineHeight: 1.65, color: "rgba(244,218,213,0.5)", flexShrink: 0, marginBottom: "3vh", maxWidth: "82vw" }}>
          Calm y Headspace validaron que los usuarios pagan por bienestar digital — juntos superan{" "}
          <span style={{ color: "rgba(244,218,213,0.82)", fontWeight: 600 }}>USD 2.3B en valuación y 170M de usuarios</span>.
          Ninguno habla español nativamente, ninguno tiene raíz cultural latina.{" "}
          <span style={{ display: "inline-block", fontWeight: 600, background: "linear-gradient(90deg, #D6AD5F, #B47344)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA entra donde los gigantes no llegan.</span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

          {/* Header row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr 1fr 3fr",
            gap: "0 1.5vw",
            paddingBottom: "1.2vh",
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
                padding: "1.8vh 0",
                borderBottom: "1px solid rgba(244,218,213,0.05)",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "1.35vw", fontWeight: 500, color: "rgba(244,218,213,0.85)" }}>{r.app}</div>
              <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(244,218,213,0.4)" }}>{r.origin}</div>
              <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(244,218,213,0.45)" }}>{r.valuation}</div>
              <div style={{ fontSize: "1.15vw", fontWeight: 400, color: "rgba(244,218,213,0.45)" }}>{r.users}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4vh 1.2vw", alignItems: "center" }}>
                {r.attrs.map((a) => (
                  <div key={a} style={{
                    fontSize: "0.95vw", fontWeight: 400,
                    color: "rgba(244,218,213,0.5)",
                    whiteSpace: "nowrap",
                  }}>{a}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Counter */}
        <div style={{ display: "flex", justifyContent: "flex-end", flexShrink: 0, paddingTop: "1.5vh" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>09 / 10</div>
        </div>
      </div>
    </div>
  );
}
