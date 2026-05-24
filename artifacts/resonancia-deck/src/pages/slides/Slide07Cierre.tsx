const base = import.meta.env.BASE_URL;

export default function Slide07Cierre() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left panel — gold */}
      <div
        style={{
          width: "42vw",
          height: "100vh",
          backgroundColor: "#C69B4F",
          padding: "0 7vw",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}
      >
        <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#18110C", marginBottom: "1.5vh" }}>
          RESONANCIA
        </div>
        <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#18110C", marginBottom: "6vh" }} />
        <div style={{ fontSize: "5.5vw", fontWeight: 700, color: "#18110C", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "0.3vh" }}>
          Casa del
        </div>
        <div style={{ fontSize: "5.5vw", fontWeight: 300, color: "#18110C", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "4vh" }}>
          Cuenco.
        </div>
        <div style={{ fontSize: "1.5vw", color: "rgba(24,17,12,0.55)", maxWidth: "27vw", lineHeight: 1.55 }}>
          Un espacio de sonido,
        </div>
        <div style={{ fontSize: "1.5vw", color: "rgba(24,17,12,0.55)", maxWidth: "27vw", lineHeight: 1.55 }}>
          silencio y presencia.
        </div>
      </div>

      {/* Right panel — dark */}
      <div
        style={{
          width: "58vw",
          height: "100vh",
          padding: "0 8vw",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative"
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: "7vh" }}>
          <img
            src={`${base}logo-resonancia-gold.png`}
            crossOrigin="anonymous"
            alt="RESONANCIA"
            style={{ height: "6vh", objectFit: "contain" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5.5vh" }}>
          <div>
            <div style={{ fontSize: "1vw", color: "#3d2a18", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "1.5vh" }}>Plataformas</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 300, color: "#EDE1D3" }}>iOS · Android</div>
          </div>
          <div>
            <div style={{ fontSize: "1vw", color: "#3d2a18", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "1.5vh" }}>Idioma</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 300, color: "#EDE1D3" }}>Español</div>
          </div>
          <div>
            <div style={{ fontSize: "1vw", color: "#3d2a18", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "1.5vh" }}>Año</div>
            <div style={{ fontSize: "2.8vw", fontWeight: 300, color: "#EDE1D3" }}>2026</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: "8vh", left: "8vw", right: "6vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>07</div>
        </div>
      </div>
    </div>
  );
}
