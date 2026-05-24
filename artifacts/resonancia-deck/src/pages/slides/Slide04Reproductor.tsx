const base = import.meta.env.BASE_URL;

export default function Slide04Reproductor() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "50vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>RESONANCIA</div>
            <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
          </div>
          <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
            El <span style={{ fontWeight: 700, color: "#C69B4F" }}>reproductor</span>
          </h2>
        </div>

        {/* Features */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "1.6vw", color: "#7a6050", marginBottom: "5vh" }}>
            Escucha inmersiva en cada sesión.
          </div>

          <div style={{ marginBottom: "4vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "0.8vh" }}>
              <div style={{ width: "3vw", height: "0.35vh", backgroundColor: "#C69B4F" }} />
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3" }}>Arte circular luminoso</div>
            </div>
            <div style={{ fontSize: "1.5vw", color: "#7a6050", paddingLeft: "4.2vw" }}>Anillos pulsantes que acompañan el ritmo.</div>
          </div>

          <div style={{ marginBottom: "4vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "0.8vh" }}>
              <div style={{ width: "3vw", height: "0.35vh", backgroundColor: "#C69B4F" }} />
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3" }}>Control de voz independiente</div>
            </div>
            <div style={{ fontSize: "1.5vw", color: "#7a6050", paddingLeft: "4.2vw" }}>Ajuste separado del volumen de ambiente.</div>
          </div>

          <div style={{ marginBottom: "4vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "0.8vh" }}>
              <div style={{ width: "3vw", height: "0.35vh", backgroundColor: "#C69B4F" }} />
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3" }}>Timer personalizable</div>
            </div>
            <div style={{ fontSize: "1.5vw", color: "#7a6050", paddingLeft: "4.2vw" }}>De 5 a 60 minutos, con fade de cierre.</div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "0.8vh" }}>
              <div style={{ width: "3vw", height: "0.35vh", backgroundColor: "#C69B4F" }} />
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3" }}>Fondo dinámico</div>
            </div>
            <div style={{ fontSize: "1.5vw", color: "#7a6050", paddingLeft: "4.2vw" }}>Refleja la imagen de la sesión activa.</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>04</div>
        </div>
      </div>

      {/* Right column — circular player visualization */}
      <div style={{ width: "50vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: "34vw", height: "34vw" }}>
          {/* Outermost ring */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "1px solid rgba(198,155,79,0.08)"
          }} />
          {/* Middle ring */}
          <div style={{
            position: "absolute", inset: "2.5vw", borderRadius: "50%",
            border: "1px solid rgba(198,155,79,0.18)"
          }} />
          {/* Inner ring */}
          <div style={{
            position: "absolute", inset: "5vw", borderRadius: "50%",
            border: "1.5px solid rgba(198,155,79,0.38)"
          }} />
          {/* Center art circle */}
          <div style={{
            position: "absolute", inset: "7.5vw", borderRadius: "50%",
            overflow: "hidden",
            border: "1.5px solid rgba(198,155,79,0.5)"
          }}>
            <img
              src={`${base}session-1.jpg`}
              crossOrigin="anonymous"
              alt="Sesión activa"
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.82 }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "radial-gradient(circle, rgba(24,17,12,0) 35%, rgba(24,17,12,0.65) 100%)"
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
