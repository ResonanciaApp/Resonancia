const base = import.meta.env.BASE_URL;

export default function Slide01Portada() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "52vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box" }}
      >
        {/* Brand mark */}
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
        </div>

        {/* Hero title */}
        <div>
          <div style={{ fontSize: "6.8vw", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#EDE1D3", marginBottom: "0.5vh" }}>
            Tu refugio
          </div>
          <div style={{ fontSize: "6.8vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.04em", color: "#C69B4F", marginBottom: "4vh" }}>
            de sonido.
          </div>
          <div style={{ fontSize: "1.8vw", fontWeight: 400, color: "#7a6050", maxWidth: "38vw", lineHeight: 1.65, marginBottom: "0.2vh" }}>
            Un espacio de silencio y presencia,
          </div>
          <div style={{ fontSize: "1.8vw", fontWeight: 400, color: "#7a6050", maxWidth: "38vw", lineHeight: 1.65 }}>
            disponible cuando más lo necesitás.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.08em" }}>
            CASA DEL CUENCO · 2026
          </div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>
            iOS · Android
          </div>
        </div>
      </div>

      {/* Right column — hero image */}
      <div style={{ width: "48vw", height: "100vh", position: "relative" }}>
        <img
          src={`${base}hero-atmosphere.png`}
          crossOrigin="anonymous"
          alt="Cuenco tibetano en luz dorada"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          background: "linear-gradient(90deg, #18110C 0%, rgba(24,17,12,0.15) 35%, rgba(24,17,12,0) 60%)"
        }} />
        {/* Subtle vignette bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, width: "100%", height: "30%",
          background: "linear-gradient(0deg, #18110C 0%, rgba(24,17,12,0) 100%)"
        }} />
      </div>
    </div>
  );
}
