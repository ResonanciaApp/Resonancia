export default function SlideQuienesSomos() {
  const roles = [
    {
      titulo: "Voces guía",
      desc: "Graban las meditaciones y sesiones habladas de la app: voces entrenadas que acompañan al usuario a dormir, calmarse y meditar.",
      pos: { top: "18vh", left: "6vw" },
    },
    {
      titulo: "Productores",
      desc: "Producen y masterizan cada pieza de audio en nuestro estudio propio: calidad de sonido pareja en todo el catálogo.",
      pos: { top: "18vh", right: "6vw" },
    },
    {
      titulo: "Sonoterapeutas",
      desc: "Diseñan los baños de sonido y frecuencias terapéuticas — cuencos, gongs y binaurales — que son el sello de la app.",
      pos: { bottom: "9vh", left: "6vw" },
    },
    {
      titulo: "Músicos",
      desc: "Componen la música original de las sesiones y los paisajes sonoros: nada de bancos de audio genéricos.",
      pos: { bottom: "9vh", right: "6vw" },
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{
        background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)",
        color: "#F4F4F4",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ position: "absolute", top: "3.5vh", left: "5.5vw" }}>
        <div style={{ fontSize: "1.2vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.4vh" }}>
          QUIÉNES SOMOS
        </div>
        <div style={{ fontSize: "3.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Un equipo que ya <span style={{ color: "#BE9650" }}>vive del sonido.</span>
        </div>
      </div>

      {/* Connecting lines (subtle) */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {[
          [24, 34], [76, 34], [24, 74], [76, 74],
        ].map(([x, y], i) => (
          <line key={i} x1="50" y1="55" x2={x} y2={y} stroke="rgba(190,150,80,0.22)" strokeWidth="0.12" />
        ))}
      </svg>

      {/* Center: Casa del Cuenco */}
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "24vw",
          height: "24vw",
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 40%, rgba(190,150,80,0.16) 0%, rgba(190,150,80,0.05) 60%, rgba(190,150,80,0.02) 100%)",
          border: "1px solid rgba(190,150,80,0.45)",
          boxShadow: "0 0 6vw rgba(190,150,80,0.12)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2vw",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: "0.85vw", fontWeight: 700, color: "#BE9650", letterSpacing: "0.18em", marginBottom: "0.8vh" }}>
          RESPALDO REAL
        </div>
        <div style={{ fontSize: "1.9vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Casa del Cuenco
        </div>
        <div style={{ width: "3vw", height: "1px", backgroundColor: "rgba(190,150,80,0.5)", margin: "1.2vh 0" }} />
        <div style={{ fontSize: "1.05vw", color: "rgba(244,244,244,0.72)", lineHeight: 1.4 }}>
          <span style={{ color: "#BE9650", fontWeight: 700 }}>9 años</span> de experiencia en Sonoterapia y Meditaciones
        </div>
      </div>

      {/* Role cards */}
      {roles.map((r) => (
        <div
          key={r.titulo}
          style={{
            position: "absolute",
            ...r.pos,
            width: "24vw",
            backgroundColor: "rgba(190,150,80,0.05)",
            border: "1px solid rgba(190,150,80,0.28)",
            borderRadius: "0.7vw",
            padding: "1.6vh 1.3vw",
            boxSizing: "border-box",
          }}
        >
          <div style={{ fontSize: "1.25vw", fontWeight: 700, color: "#BE9650", marginBottom: "0.6vh" }}>
            {r.titulo}
          </div>
          <div style={{ fontSize: "0.95vw", color: "rgba(244,244,244,0.72)", lineHeight: 1.45 }}>
            {r.desc}
          </div>
        </div>
      ))}
    </div>
  );
}
