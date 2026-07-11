export default function SlideAudiencia() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #2d1c52 0%, #24245d 33%, #1f2a62 66%, #2d4081 100%)", color: "#F4F4F4", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          09 · NUESTRA AUDIENCIA
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          No partimos de cero: ya tenemos <span style={{ color: "#FFFFFF" }}>una comunidad.</span>
        </div>
      </div>

      {/* Hero number */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
        <div style={{ fontSize: "10vw", fontWeight: 700, color: "#FFFFFF", lineHeight: 0.9, letterSpacing: "-0.04em" }}>
          +1.000.000
        </div>
        <div style={{ fontSize: "2vw", fontWeight: 400, color: "rgba(244,244,244,0.50)", lineHeight: 1.3, maxWidth: "26vw" }}>
          de seguidores en redes sociales, listos desde el día uno.
        </div>
      </div>

      {/* Three advantage cards */}
      <div style={{ display: "flex", gap: "2.5vw" }}>
        <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.14)", borderRadius: "1vw", padding: "3vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.2vh" }}>Canal propio</div>
          <div style={{ fontSize: "1.5vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.5 }}>
            Un canal de lanzamiento propio: llegamos a cientos de miles de personas sin depender de la publicidad pagada.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.14)", borderRadius: "1vw", padding: "3vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.2vh" }}>Costo de adquisición bajo</div>
          <div style={{ fontSize: "1.5vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.5 }}>
            La audiencia ya existe y confía en la marca: cada nueva descarga cuesta una fracción de lo que paga la competencia.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.14)", borderRadius: "1vw", padding: "3vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1.2vh" }}>Marca validada</div>
          <div style={{ fontSize: "1.5vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.5 }}>
            Una comunidad fiel que valida la propuesta de bienestar y nos da retroalimentación real antes de escalar.
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "rgba(244,244,244,0.50)", lineHeight: 1.5, maxWidth: "82vw" }}>
        La distribución es el activo más escaso en consumo: empezamos con ella ya resuelta.
      </div>
    </div>
  );
}
