export default function P05Mercado() {
  const tiers = [
    { label: "TAM", sub: "Mercado global de bienestar digital", value: "USD 62 B", bar: "100%", note: "Meditación, sueño, mindfulness — todos los idiomas" },
    { label: "SAM", sub: "Wellness digital en español (LatAm + España + EE.UU. hispano)", value: "USD 8 B", bar: "46%", note: "Crecimiento 18% CAGR estimado 2024–2028" },
    { label: "SOM", sub: "Captura realista a 3 años con 0.3% del SAM", value: "USD 24 M", bar: "18%", note: "~130.000 suscriptores activos a USD 7–15/mes" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left */}
        <div style={{ width: "42vw", padding: "8vh 4vw 8vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", marginBottom: "1.5vh" }}>EL MERCADO</div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5, marginBottom: "4vh" }} />
            <div style={{ fontSize: "5vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "3vh" }}>
              Grande,<br />creciendo<br />y <span style={{ color: "#D4AF37" }}>vacío.</span>
            </div>
            <div style={{ fontSize: "1.5vw", fontWeight: 400, lineHeight: 1.7, color: "rgba(244,218,213,0.5)", maxWidth: "30vw" }}>
              El bienestar digital en español crece a doble dígito anual. Ningún actor relevante está posicionado para liderarlo.
            </div>
          </div>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>06 / 08</div>
        </div>

        {/* Right — TAM/SAM/SOM bars */}
        <div style={{ flex: 1, padding: "8vh 8vw 8vh 3vw", display: "flex", flexDirection: "column", justifyContent: "center", gap: "5vh" }}>
          {tiers.map((t) => (
            <div key={t.label}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw", marginBottom: "1.2vh" }}>
                <div style={{ fontSize: "1.6vw", fontWeight: 800, color: "#D4AF37", width: "3.5vw" }}>{t.label}</div>
                <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "rgba(244,218,213,0.45)" }}>{t.sub}</div>
                <div style={{ marginLeft: "auto", fontSize: "2.2vw", fontWeight: 700, color: "#F4DAD5" }}>{t.value}</div>
              </div>
              {/* Bar */}
              <div style={{ width: "100%", height: "0.5vh", backgroundColor: "rgba(244,218,213,0.07)", borderRadius: "2px", marginBottom: "1vh" }}>
                <div style={{ width: t.bar, height: "100%", backgroundColor: "#D4AF37", borderRadius: "2px", opacity: t.label === "TAM" ? 0.35 : t.label === "SAM" ? 0.6 : 1 }} />
              </div>
              <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(244,218,213,0.35)", letterSpacing: "0.03em" }}>{t.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
