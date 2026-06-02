const base = import.meta.env.BASE_URL;

export default function Slide02Refugio() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left column */}
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
            Tu refugio <span style={{ fontWeight: 700, color: "#C69B4F" }}>personal</span>
          </h2>
        </div>

        {/* Body */}
        <div>
          <div style={{ fontSize: "1.6vw", color: "#7a6050", marginBottom: "5vh", lineHeight: 1.5 }}>
            Una experiencia diseñada para acompañarte.
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw", marginBottom: "4vh" }}>
            <div style={{ width: "0.65vw", height: "0.65vw", borderRadius: "50%", backgroundColor: "#C69B4F", marginTop: "0.9vh", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.8vh" }}>Onboarding personalizado</div>
              <div style={{ fontSize: "1.5vw", color: "#7a6050", lineHeight: 1.5 }}>Por nombre y momento del día, desde el primer uso.</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw", marginBottom: "4vh" }}>
            <div style={{ width: "0.65vw", height: "0.65vw", borderRadius: "50%", backgroundColor: "#C69B4F", marginTop: "0.9vh", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.8vh" }}>Estética cálida y profunda</div>
              <div style={{ fontSize: "1.5vw", color: "#7a6050", lineHeight: 1.5 }}>Bronce, oscuridad y calma en cada pantalla.</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
            <div style={{ width: "0.65vw", height: "0.65vw", borderRadius: "50%", backgroundColor: "#C69B4F", marginTop: "0.9vh", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.8vh" }}>Diseñada para Latinoamérica</div>
              <div style={{ fontSize: "1.5vw", color: "#7a6050", lineHeight: 1.5 }}>Totalmente en español, con sensibilidad local.</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>02</div>
        </div>
      </div>

      {/* Right — iPhone mockup */}
      <div style={{ width: "42vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(198,155,79,0.05) 0%, rgba(24,17,12,0) 65%)" }} />
        <div style={{
          width: "13vw", height: "28.2vw",
          backgroundColor: "#1C1C1E",
          borderRadius: "2.4vw",
          padding: "0.46vw",
          boxShadow: "0 1.5vw 6vw rgba(0,0,0,0.9), 0 0 0 0.12vw rgba(255,255,255,0.07)",
          position: "relative", zIndex: 1
        }}>
          <div style={{ position: "absolute", top: "1.25vw", left: "50%", transform: "translateX(-50%)", width: "3.2vw", height: "0.72vw", backgroundColor: "#000", borderRadius: "0.48vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "2.0vw", overflow: "hidden", backgroundColor: "#18110C" }}>
            <img src={`${base}mockup-biblioteca.jpg`} crossOrigin="anonymous" alt="Biblioteca" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
