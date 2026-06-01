export default function Slide07PorQue() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7a6050", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          06 · POR QUÉ RESONANCIA
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          Nuestra ventaja <span style={{ color: "#C69B4F" }}>defendible.</span>
        </div>
      </div>

      {/* Two-column list */}
      <div style={{ display: "flex", gap: "5vw" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3vh" }}>
          <div>
            <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#C69B4F", marginBottom: "0.8vh" }}>Foco en el idioma</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "#cbb9a4", lineHeight: 1.4 }}>
              Español neutro nativo en cada detalle, no una traducción de una app en inglés.
            </div>
          </div>
          <div>
            <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#C69B4F", marginBottom: "0.8vh" }}>Contenido propio</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "#cbb9a4", lineHeight: 1.4 }}>
              Artistas y voces guía certificados crean material exclusivo para la plataforma.
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3vh" }}>
          <div>
            <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#C69B4F", marginBottom: "0.8vh" }}>Identidad cálida</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "#cbb9a4", lineHeight: 1.4 }}>
              Una estética y un tono que se sienten cercanos a la cultura hispanohablante.
            </div>
          </div>
          <div>
            <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#C69B4F", marginBottom: "0.8vh" }}>Producto listo</div>
            <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "#cbb9a4", lineHeight: 1.4 }}>
              La app ya está construida: la inversión acelera lanzamiento y crecimiento, no la base.
            </div>
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "#7a6050", lineHeight: 1.5, maxWidth: "76vw" }}>
        Ser primeros y mejores en español construye una marca difícil de copiar.
      </div>
    </div>
  );
}
