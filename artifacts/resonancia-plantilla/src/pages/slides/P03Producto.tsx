const base = import.meta.env.BASE_URL;

export default function P03Producto() {
  const features = [
    { n: "01", name: "Sonidos Ancestrales", desc: "Cuencos, gongs y terapia de sonido — catálogo propio, sin dependencia de terceros" },
    { n: "02", name: "Geometrix", desc: "Meditación activa guiada por geometría sagrada interactiva — único en su categoría" },
    { n: "03", name: "Mi Música", desc: "Mezclador de capas de sonido ambiente — experiencia personalizable en tiempo real" },
    { n: "04", name: "Sesiones en Vivo", desc: "Conexión directa con guías certificados vía streaming — comunidad en tiempo real" },
    { n: "05", name: "Diario + Progreso", desc: "Herramientas de introspección y seguimiento de práctica personal" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left — Feature list */}
        <div style={{ width: "55vw", padding: "8vh 4vw 8vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", marginBottom: "1.5vh" }}>EL PRODUCTO</div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5, marginBottom: "4vh" }} />
            <div style={{ fontSize: "4.5vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "5vh" }}>
              5 diferenciadores<br />que no tienen copia.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2.8vh" }}>
              {features.map((f) => (
                <div key={f.n} style={{ display: "flex", alignItems: "flex-start", gap: "2.5vw" }}>
                  <div style={{ fontSize: "1.15vw", fontWeight: 800, color: "#D4AF37", opacity: 0.7, width: "2.5vw", flexShrink: 0, marginTop: "0.15vh" }}>{f.n}</div>
                  <div>
                    <div style={{ fontSize: "1.45vw", fontWeight: 600, color: "#F4DAD5", marginBottom: "0.3vh" }}>{f.name}</div>
                    <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "rgba(244,218,213,0.5)", lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>06 / 11</div>
        </div>

        {/* Right — Phone mockup */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 65%)" }} />
          <div style={{
            width: "18vw", height: "39vw", backgroundColor: "#1C1C1E", borderRadius: "3vw", padding: "0.55vw",
            boxShadow: "0 2vw 8vw rgba(0,0,0,0.9), 0 0 0 0.12vw rgba(255,255,255,0.06)", position: "relative", zIndex: 2
          }}>
            <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4vw", height: "0.85vw", backgroundColor: "#000", borderRadius: "0.58vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2.55vw", overflow: "hidden", background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)" }}>
              <img src={`${base}mockup-home.jpg`} crossOrigin="anonymous" alt="App" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
