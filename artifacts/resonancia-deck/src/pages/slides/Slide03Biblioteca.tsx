const base = import.meta.env.BASE_URL;

export default function Slide03Biblioteca() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left content column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "58vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>
              RESONANCIA
            </div>
            <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
          </div>
          <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
            Biblioteca de <span style={{ fontWeight: 700, color: "#C69B4F" }}>sesiones</span>
          </h2>
        </div>

        {/* Stat */}
        <div>
          <div style={{ fontSize: "8vw", fontWeight: 700, color: "#C69B4F", lineHeight: 1, letterSpacing: "-0.04em" }}>30+</div>
          <div style={{ fontSize: "1.8vw", color: "#7a6050", marginTop: "1vh" }}>sesiones en 5 categorías</div>
        </div>

        {/* Category list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0vh" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", paddingBottom: "2.2vh", borderBottom: "1px solid rgba(198,155,79,0.1)", marginBottom: "2.2vh" }}>
            <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", backgroundColor: "#C69B4F", flexShrink: 0 }} />
            <div style={{ fontSize: "1.75vw", fontWeight: 600, color: "#EDE1D3", flex: 1 }}>Sonidos Ancestrales</div>
            <div style={{ fontSize: "1.3vw", color: "#7a6050" }}>cuencos tibetanos, gongs, cantos</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", paddingBottom: "2.2vh", borderBottom: "1px solid rgba(198,155,79,0.1)", marginBottom: "2.2vh" }}>
            <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", backgroundColor: "#C69B4F", flexShrink: 0 }} />
            <div style={{ fontSize: "1.75vw", fontWeight: 600, color: "#EDE1D3", flex: 1 }}>Música y Sonidos</div>
            <div style={{ fontSize: "1.3vw", color: "#7a6050" }}>piezas para dormir y meditar</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", paddingBottom: "2.2vh", borderBottom: "1px solid rgba(198,155,79,0.1)", marginBottom: "2.2vh" }}>
            <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", backgroundColor: "#C69B4F", flexShrink: 0 }} />
            <div style={{ fontSize: "1.75vw", fontWeight: 600, color: "#EDE1D3", flex: 1 }}>Meditaciones Guiadas</div>
            <div style={{ fontSize: "1.3vw", color: "#7a6050" }}>voz + música de fondo</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5vw", paddingBottom: "2.2vh", borderBottom: "1px solid rgba(198,155,79,0.1)", marginBottom: "2.2vh" }}>
            <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", backgroundColor: "#C69B4F", flexShrink: 0 }} />
            <div style={{ fontSize: "1.75vw", fontWeight: 600, color: "#EDE1D3", flex: 1 }}>ASMR</div>
            <div style={{ fontSize: "1.3vw", color: "#7a6050" }}>susurros y texturas</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5vw" }}>
            <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", backgroundColor: "#C69B4F", flexShrink: 0 }} />
            <div style={{ fontSize: "1.75vw", fontWeight: 600, color: "#EDE1D3", flex: 1 }}>Historias y Podcast</div>
            <div style={{ fontSize: "1.3vw", color: "#7a6050" }}>narrativa para el descanso</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>03</div>
        </div>
      </div>

      {/* Right image */}
      <div style={{ width: "42vw", height: "100vh", position: "relative" }}>
        <img
          src={`${base}session-1.jpg`}
          crossOrigin="anonymous"
          alt="Sesiones RESONANCIA"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, #18110C 0%, rgba(24,17,12,0.2) 30%, rgba(24,17,12,0) 55%)"
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(0deg, #18110C 0%, rgba(24,17,12,0) 25%)"
        }} />
      </div>
    </div>
  );
}
