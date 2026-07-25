export default function SlideQueEs() {
  const pilares = [
    {
      titulo: "Escucha",
      texto: "Catálogo curado de sesiones de sonoterapia, meditación y descanso, producido en estudio propio.",
    },
    {
      titulo: "Crea",
      texto: "Mezclador de sonidos y experiencias interactivas para armar tu propio espacio de calma.",
    },
    {
      titulo: "Conecta",
      texto: "Sesiones en vivo con guiadores y una comunidad hispanohablante en torno al bienestar.",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex"
      style={{
        background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)",
        color: "#F4F4F4",
        padding: "8vh 6vw 8vh 8vw",
        boxSizing: "border-box",
        gap: "4vw",
        alignItems: "center",
      }}
    >
      {/* Columna izquierda: texto + pilares */}
      <div style={{ flex: 1.4, display: "flex", flexDirection: "column", justifyContent: "center", gap: "4vh", minWidth: 0 }}>
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(244,244,244,0.45)", letterSpacing: "0.14em", marginBottom: "1vh" }}>
            ¿QUÉ ES?
          </div>
          <div style={{ fontSize: "2.2vw", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
            RESONANCIA es una app de meditación y sueño en español:{" "}
            <span style={{ color: "#FFFFFF" }}>
              sonoterapia con cuencos, meditaciones guiadas, música ambient y sonidos de la naturaleza
            </span>
            , en una sola experiencia inmersiva.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.6vh" }}>
          {pilares.map((p) => (
            <div
              key={p.titulo}
              style={{
                backgroundColor: "rgba(0,0,0,0.16)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "0.9vw",
                padding: "2.0vh 1.8vw",
                display: "flex",
                alignItems: "baseline",
                gap: "1.4vw",
              }}
            >
              <div style={{ fontSize: "1.5vw", fontWeight: 700, color: "#FFFFFF", minWidth: "8vw" }}>
                {p.titulo}
              </div>
              <div style={{ fontSize: "1.1vw", color: "rgba(244,244,244,0.60)", lineHeight: 1.5 }}>
                {p.texto}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Columna derecha: mockup de celular */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            height: "82vh",
            aspectRatio: "402 / 874",
            borderRadius: "3.2vh",
            border: "2px solid rgba(255,255,255,0.18)",
            boxShadow: "0 2.5vh 6vh rgba(0,0,0,0.55), 0 0 0 0.8vh rgba(0,0,0,0.35)",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#000",
            flexShrink: 0,
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}mockup-home.jpg`}
            alt="Pantalla de inicio de RESONANCIA"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          {/* Notch */}
          <div
            style={{
              position: "absolute",
              top: "1.2vh",
              left: "50%",
              transform: "translateX(-50%)",
              width: "28%",
              height: "1.6vh",
              borderRadius: "9999px",
              backgroundColor: "rgba(0,0,0,0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
