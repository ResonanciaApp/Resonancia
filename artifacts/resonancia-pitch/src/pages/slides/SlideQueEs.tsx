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
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{
        background: "linear-gradient(160deg, #2d1c52 0%, #24245d 33%, #1f2a62 66%, #2d4081 100%)",
        color: "#F4F4F4",
        padding: "9vh 8vw 7vh",
        boxSizing: "border-box",
        justifyContent: "center",
        gap: "5vh",
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "rgba(244,244,244,0.45)", letterSpacing: "0.14em", marginBottom: "1vh" }}>
          ¿QUÉ ES?
        </div>
        <div style={{ fontSize: "2.6vw", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3, maxWidth: "72vw" }}>
          RESONANCIA es una app de meditación y sueño en español:{" "}
          <span style={{ color: "#FFFFFF" }}>
            sonoterapia con cuencos, meditaciones guiadas, música ambient y sonidos de la naturaleza
          </span>
          , en una sola experiencia inmersiva.
        </div>
      </div>

      {/* Pilares */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.6vw" }}>
        {pilares.map((p) => (
          <div
            key={p.titulo}
            style={{
              backgroundColor: "rgba(0,0,0,0.16)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "0.9vw",
              padding: "3.4vh 1.8vw",
            }}
          >
            <div style={{ fontSize: "1.7vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.2vh" }}>
              {p.titulo}
            </div>
            <div style={{ fontSize: "1.15vw", color: "rgba(244,244,244,0.60)", lineHeight: 1.55 }}>
              {p.texto}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
