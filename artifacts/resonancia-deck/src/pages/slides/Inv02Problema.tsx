const base = import.meta.env.BASE_URL;

export default function Inv02Problema() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}
    >
      {/* Background texture */}
      <img src={`${base}hero-atmosphere.png`} crossOrigin="anonymous" alt="" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.12, mixBlendMode: "luminosity" }} />

      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1B060F 40%, rgba(42,4,18,0.85) 100%)" }} />

      {/* Gold accent line left */}
      <div style={{ position: "absolute", top: 0, left: "5.5vw", width: "0.25vw", height: "100%", background: "linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.35) 30%, rgba(212,175,55,0.35) 70%, transparent 100%)" }} />

      <div className="relative" style={{ height: "100%", display: "flex", alignItems: "center", padding: "0 8vw 0 8.5vw", zIndex: 2 }}>

        {/* Left — statement */}
        <div style={{ width: "46vw", paddingRight: "5vw" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", textTransform: "uppercase", marginBottom: "3vh" }}>
            El Problema
          </div>
          <div style={{ fontSize: "4.2vw", fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "3vh", textWrap: "balance" }}>
            El bienestar digital llegó a todos — menos al mundo hispanohablante.
          </div>
          <div style={{ width: "4vw", height: "0.3vh", background: "linear-gradient(90deg, #D4AF37, transparent)", marginBottom: "3vh" }} />
          <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "rgba(242,231,228,0.55)", lineHeight: 1.6, textWrap: "pretty" }}>
            Millones de personas en Latinoamérica buscan bienestar cada día y no encuentran una plataforma que hable su idioma — cultural y literalmente.
          </div>
        </div>

        {/* Right — 4 problem cards */}
        <div style={{ width: "46vw", display: "flex", flexDirection: "column", gap: "1.8vh" }}>
          {[
            { n: "01", text: "Estrés y ansiedad en niveles históricos" },
            { n: "02", text: "Las apps de meditación son genéricas y en inglés" },
            { n: "03", text: "Sin contenido especializado en sonido terapéutico" },
            { n: "04", text: "Las experiencias presenciales son difíciles de escalar" },
          ].map(({ n, text }) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: "2.5vw", padding: "2.2vh 2.5vw", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: "0.8vw" }}>
              <div style={{ fontSize: "2.2vw", fontWeight: 700, color: "rgba(212,175,55,0.3)", lineHeight: 1, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                {n}
              </div>
              <div style={{ fontSize: "1.9vw", fontWeight: 500, color: "#F4DAD5", lineHeight: 1.3, textWrap: "pretty" }}>
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
