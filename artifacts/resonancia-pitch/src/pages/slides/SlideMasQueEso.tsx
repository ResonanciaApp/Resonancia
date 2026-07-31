export default function SlideMasQueEso() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)",
        color: "#F4F4F4",
        padding: "10vh 14vw",
        boxSizing: "border-box",
        textAlign: "center",
        gap: "5vh",
      }}
    >
      {/* Glow decorativo */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "48vw",
          height: "48vw",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(190,150,80,0.08) 0%, rgba(190,150,80,0.02) 55%, transparent 75%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", fontSize: "3.2vw", fontWeight: 700, letterSpacing: "-0.02em", color: "#BE9650" }}>
        Pero somos más que eso...
      </div>

      <div style={{ position: "relative", width: "4vw", height: "1px", backgroundColor: "rgba(190,150,80,0.5)" }} />

      <div style={{ position: "relative", fontSize: "1.75vw", fontWeight: 500, lineHeight: 1.65, color: "rgba(244,244,244,0.88)" }}>
        Somos una herramienta de <span style={{ color: "#FFFFFF", fontWeight: 700 }}>expansión y autoconocimiento</span> que
        nutre a nuestros usuarios con experiencias y contenido diseñados para fomentar la calma, la consciencia, el
        bienestar y el desarrollo personal, acompañándolos en un camino de{" "}
        <span style={{ color: "#BE9650", fontWeight: 700 }}>transformación interior</span>.
      </div>
    </div>
  );
}
