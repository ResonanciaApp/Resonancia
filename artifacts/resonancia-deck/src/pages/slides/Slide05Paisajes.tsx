export default function Slide05Paisajes() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative flex flex-col font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "8vh 8vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4.5vh" }}>
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>RESONANCIA</div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
        </div>
        <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
          Paisajes de <span style={{ fontWeight: 700, color: "#C69B4F" }}>sonido</span>
        </h2>
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: "1.7vw", color: "#7a6050", textAlign: "center", marginBottom: "4vh" }}>
        8 ambientes para personalizar cada sesión
      </div>

      {/* Grid 4 × 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: "1.8vw", flex: 1 }}>
        <div style={{ backgroundColor: "#24160F", borderRadius: "0.8vw", border: "1px solid rgba(198,155,79,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5vh" }}>
          <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#C69B4F" }} />
          <div style={{ fontSize: "2.1vw", fontWeight: 600, color: "#EDE1D3" }}>Universo</div>
        </div>
        <div style={{ backgroundColor: "#24160F", borderRadius: "0.8vw", border: "1px solid rgba(198,155,79,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5vh" }}>
          <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#C69B4F" }} />
          <div style={{ fontSize: "2.1vw", fontWeight: 600, color: "#EDE1D3" }}>Lluvia</div>
        </div>
        <div style={{ backgroundColor: "#24160F", borderRadius: "0.8vw", border: "1px solid rgba(198,155,79,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5vh" }}>
          <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#C69B4F" }} />
          <div style={{ fontSize: "2.1vw", fontWeight: 600, color: "#EDE1D3" }}>Mar</div>
        </div>
        <div style={{ backgroundColor: "#24160F", borderRadius: "0.8vw", border: "1px solid rgba(198,155,79,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5vh" }}>
          <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#C69B4F" }} />
          <div style={{ fontSize: "2.1vw", fontWeight: 600, color: "#EDE1D3" }}>Bosque</div>
        </div>
        <div style={{ backgroundColor: "#24160F", borderRadius: "0.8vw", border: "1px solid rgba(198,155,79,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5vh" }}>
          <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#C69B4F" }} />
          <div style={{ fontSize: "2.1vw", fontWeight: 600, color: "#EDE1D3" }}>Río</div>
        </div>
        <div style={{ backgroundColor: "#24160F", borderRadius: "0.8vw", border: "1px solid rgba(198,155,79,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5vh" }}>
          <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#C69B4F" }} />
          <div style={{ fontSize: "2.1vw", fontWeight: 600, color: "#EDE1D3" }}>Cuenco</div>
        </div>
        <div style={{ backgroundColor: "#24160F", borderRadius: "0.8vw", border: "1px solid rgba(198,155,79,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5vh" }}>
          <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#C69B4F" }} />
          <div style={{ fontSize: "2.1vw", fontWeight: 600, color: "#EDE1D3" }}>Viento</div>
        </div>
        <div style={{ backgroundColor: "#24160F", borderRadius: "0.8vw", border: "1px solid rgba(198,155,79,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5vh" }}>
          <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", backgroundColor: "#C69B4F" }} />
          <div style={{ fontSize: "2.1vw", fontWeight: 600, color: "#EDE1D3" }}>Silencio</div>
        </div>
      </div>

      {/* Tagline */}
      <div style={{ fontSize: "1.5vw", color: "#7a6050", textAlign: "center", paddingTop: "3vh" }}>
        Cada sesión se puede combinar con el ambiente que más resonás.
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>05</div>
      </div>
    </div>
  );
}
