const base = import.meta.env.BASE_URL;

export default function Slide06Mockups() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "6vh 8vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4vh" }}>
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
        </div>
        <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
          La app <span style={{ fontWeight: 700, color: "#C69B4F" }}>en acción</span>
        </h2>
      </div>

      {/* 3 phones */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5vw" }}>

        {/* Phone 1 — Inicio */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2.5vh" }}>
          <div style={{
            width: "12vw", height: "26vw",
            backgroundColor: "#1C1C1E",
            borderRadius: "2.2vw",
            padding: "0.42vw",
            boxShadow: "0 1vw 4vw rgba(0,0,0,0.8), 0 0 0 0.1vw rgba(255,255,255,0.06)",
            position: "relative"
          }}>
            <div style={{ position: "absolute", top: "1.1vw", left: "50%", transform: "translateX(-50%)", width: "3vw", height: "0.65vw", backgroundColor: "#000", borderRadius: "0.42vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "1.85vw", overflow: "hidden", backgroundColor: "#18110C" }}>
              <img src={`${base}mockup-home.jpg`} crossOrigin="anonymous" alt="Inicio" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.4vh" }}>Inicio</div>
            <div style={{ fontSize: "1.2vw", color: "#7a6050" }}>Intención del día · Sesiones</div>
          </div>
        </div>

        {/* Phone 2 — Sonidos Ancestrales */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2.5vh" }}>
          <div style={{
            width: "12vw", height: "26vw",
            backgroundColor: "#1C1C1E",
            borderRadius: "2.2vw",
            padding: "0.42vw",
            boxShadow: "0 1.5vw 6vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(198,155,79,0.18)",
            position: "relative"
          }}>
            <div style={{ position: "absolute", top: "1.1vw", left: "50%", transform: "translateX(-50%)", width: "3vw", height: "0.65vw", backgroundColor: "#000", borderRadius: "0.42vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "1.85vw", overflow: "hidden", backgroundColor: "#18110C" }}>
              <img src={`${base}mockup-sonidos.jpg`} crossOrigin="anonymous" alt="Sonidos Ancestrales" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#C69B4F", marginBottom: "0.4vh" }}>Sonidos Ancestrales</div>
            <div style={{ fontSize: "1.2vw", color: "#7a6050" }}>Cuencos · Gongs · Mix</div>
          </div>
        </div>

        {/* Phone 3 — Mi Música */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2.5vh" }}>
          <div style={{
            width: "12vw", height: "26vw",
            backgroundColor: "#1C1C1E",
            borderRadius: "2.2vw",
            padding: "0.42vw",
            boxShadow: "0 1vw 4vw rgba(0,0,0,0.8), 0 0 0 0.1vw rgba(255,255,255,0.06)",
            position: "relative"
          }}>
            <div style={{ position: "absolute", top: "1.1vw", left: "50%", transform: "translateX(-50%)", width: "3vw", height: "0.65vw", backgroundColor: "#000", borderRadius: "0.42vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "1.85vw", overflow: "hidden", backgroundColor: "#18110C" }}>
              <img src={`${base}mockup-musica.jpg`} crossOrigin="anonymous" alt="Mi Música" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.4vh" }}>Mi Música</div>
            <div style={{ fontSize: "1.2vw", color: "#7a6050" }}>36 sonidos para mezclar</div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2.5vh" }}>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>06</div>
      </div>
    </div>
  );
}
