export default function PCategorias() {
  const categories = [
    {
      name: "Meditaciones",
      color: "#A78BCA",
      desc: "Guiadas por maestros para mente, cuerpo y espíritu",
      img: "/resonancia-plantilla/screenshots/meditaciones.png",
    },
    {
      name: "Música",
      color: "#7BB8C4",
      desc: "Ambiente sonoro inmersivo para cada estado de ánimo",
      img: "/resonancia-plantilla/screenshots/musica.png",
    },
    {
      name: "Ancestrales",
      color: "#D4AF37",
      desc: "Instrumentos sagrados de la tradición del sonido",
      img: "/resonancia-plantilla/screenshots/ancestrales.png",
    },
    {
      name: "Reflexiones",
      color: "#C4916B",
      desc: "Historias, voz interior y contenido narrativo",
      img: "/resonancia-plantilla/screenshots/reflexiones.png",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 55%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "5vh 7vw 5vh", zIndex: 2 }}>

        {/* Header */}
        <div style={{ marginBottom: "4vh", flexShrink: 0 }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", color: "#D4AF37", marginBottom: "1.5vh" }}>
            CATÁLOGO DE CONTENIDO
          </div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45 }} />
        </div>

        {/* Columns */}
        <div style={{ display: "flex", gap: "0", flex: 1, minHeight: 0 }}>
          {categories.map((cat, i) => (
            <div
              key={cat.name}
              style={{
                flex: 1,
                paddingRight: i < 3 ? "2vw" : 0,
                paddingLeft: i > 0 ? "2vw" : 0,
                borderRight: i < 3 ? "1px solid rgba(244,218,213,0.07)" : "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Screenshot — phone frame */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  width: "100%",
                  maxWidth: "14vw",
                  marginBottom: "3vh",
                  borderRadius: "1.4vw",
                  overflow: "hidden",
                  border: `1px solid ${cat.color}35`,
                  boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.3)`,
                  backgroundColor: "#0D020A",
                  position: "relative",
                }}
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                {/* Placeholder while no image */}
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  flexDirection: "column", gap: "1vh", opacity: 0.25
                }}>
                  <div style={{ fontSize: "3vw", color: cat.color, fontWeight: 800 }}>
                    {cat.name.charAt(0)}
                  </div>
                  <div style={{ fontSize: "0.85vw", color: cat.color, letterSpacing: "0.1em", textAlign: "center", lineHeight: 1.3 }}>
                    pantallazo<br />aquí
                  </div>
                </div>
              </div>

              {/* Color bar */}
              <div style={{ width: "2vw", height: "2px", backgroundColor: cat.color, marginBottom: "1.5vh", borderRadius: "2px", flexShrink: 0 }} />

              {/* Category name */}
              <div style={{ fontSize: "2.4vw", fontWeight: 800, color: "#F4DAD5", lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "1vh", textAlign: "center", flexShrink: 0 }}>
                {cat.name}
              </div>

              {/* Description */}
              <div style={{ fontSize: "1.05vw", fontWeight: 400, lineHeight: 1.55, color: "rgba(244,218,213,0.4)", textAlign: "center", flexShrink: 0 }}>
                {cat.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "3vh", flexShrink: 0 }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>05 / 12</div>
        </div>
      </div>
    </div>
  );
}
