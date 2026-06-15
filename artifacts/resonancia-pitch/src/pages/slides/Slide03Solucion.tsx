export default function Slide03Solucion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          02 · LA SOLUCIÓN
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Un refugio de sonido, <span style={{ color: "#D4AF37" }}>nativo en español.</span>
        </div>
      </div>

      {/* Three columns */}
      <div style={{ display: "flex", gap: "2.5vw" }}>
        <div style={{ flex: 1, backgroundColor: "#27070E", borderRadius: "1vw", padding: "3.5vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#D4AF37", marginBottom: "1.5vh" }}>Voz propia</div>
          <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.5 }}>
            Meditaciones, historias y voces guía creadas en español neutro, no traducidas.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#27070E", borderRadius: "1vw", padding: "3.5vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#D4AF37", marginBottom: "1.5vh" }}>Sonido ancestral</div>
          <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.5 }}>
            Cuencos, frecuencias binaurales y música ambiente curada por artistas certificados.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#27070E", borderRadius: "1vw", padding: "3.5vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#D4AF37", marginBottom: "1.5vh" }}>Comunidad</div>
          <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.5 }}>
            Diario, intención del día y un espacio para acompañarse entre personas.
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.5, maxWidth: "72vw" }}>
        Meditación, sueño, sonido y comunidad en una sola app cálida, pensada para descansar.
      </div>
    </div>
  );
}
