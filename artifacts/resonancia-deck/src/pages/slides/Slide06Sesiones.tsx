const base = import.meta.env.BASE_URL;

export default function Slide06Sesiones() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative flex flex-col font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "8vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4.5vh" }}>
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>RESONANCIA</div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
        </div>
        <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
          Sesiones <span style={{ fontWeight: 700, color: "#C69B4F" }}>destacadas</span>
        </h2>
      </div>

      <div style={{ fontSize: "1.6vw", color: "#7a6050", marginBottom: "3.5vh" }}>
        Tres experiencias que la gente más elige.
      </div>

      {/* 3 cards */}
      <div style={{ display: "flex", flex: 1, gap: "2.2vw" }}>
        {/* Card 1 */}
        <div style={{ flex: 1, backgroundColor: "#24160F", borderRadius: "1vw", overflow: "hidden", border: "1px solid rgba(198,155,79,0.12)", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", height: "48%", flexShrink: 0 }}>
            <img
              src={`${base}session-1.jpg`}
              crossOrigin="anonymous"
              alt="Cuencos Tibetanos en Sol"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, #24160F 0%, rgba(36,22,15,0) 55%)" }} />
          </div>
          <div style={{ padding: "3vh 2.5vw", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "1.2vh" }}>Cuencos Tibetanos en Sol</div>
              <div style={{ fontSize: "1.45vw", color: "#7a6050" }}>45 min · Sonidos Ancestrales</div>
            </div>
            <div style={{ marginTop: "2vh", display: "inline-block", padding: "0.6vh 1.2vw", backgroundColor: "rgba(198,155,79,0.1)", borderRadius: "2vw", border: "1px solid rgba(198,155,79,0.22)" }}>
              <div style={{ fontSize: "1.3vw", color: "#C69B4F" }}>Ancestral</div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ flex: 1, backgroundColor: "#24160F", borderRadius: "1vw", overflow: "hidden", border: "1px solid rgba(198,155,79,0.12)", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", height: "48%", flexShrink: 0 }}>
            <img
              src={`${base}session-3.jpg`}
              crossOrigin="anonymous"
              alt="Lluvia Profunda"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, #24160F 0%, rgba(36,22,15,0) 55%)" }} />
          </div>
          <div style={{ padding: "3vh 2.5vw", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "1.2vh" }}>Lluvia Profunda</div>
              <div style={{ fontSize: "1.45vw", color: "#7a6050" }}>30 min · Música y Sonidos</div>
            </div>
            <div style={{ marginTop: "2vh", display: "inline-block", padding: "0.6vh 1.2vw", backgroundColor: "rgba(198,155,79,0.1)", borderRadius: "2vw", border: "1px solid rgba(198,155,79,0.22)" }}>
              <div style={{ fontSize: "1.3vw", color: "#C69B4F" }}>Sonidos</div>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ flex: 1, backgroundColor: "#24160F", borderRadius: "1vw", overflow: "hidden", border: "1px solid rgba(198,155,79,0.12)", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", height: "48%", flexShrink: 0 }}>
            <img
              src={`${base}session-6.jpg`}
              crossOrigin="anonymous"
              alt="Respiración Consciente"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, #24160F 0%, rgba(36,22,15,0) 55%)" }} />
          </div>
          <div style={{ padding: "3vh 2.5vw", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "1.2vh" }}>Respiración Consciente</div>
              <div style={{ fontSize: "1.45vw", color: "#7a6050" }}>20 min · Meditación Guiada</div>
            </div>
            <div style={{ marginTop: "2vh", display: "inline-block", padding: "0.6vh 1.2vw", backgroundColor: "rgba(198,155,79,0.1)", borderRadius: "2vw", border: "1px solid rgba(198,155,79,0.22)" }}>
              <div style={{ fontSize: "1.3vw", color: "#C69B4F" }}>Meditación</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>06</div>
      </div>
    </div>
  );
}
