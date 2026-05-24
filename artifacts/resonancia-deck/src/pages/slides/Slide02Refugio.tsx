const base = import.meta.env.BASE_URL;

export default function Slide02Refugio() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative flex flex-col font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "8vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "7vh" }}>
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
      <div style={{ display: "flex", flex: 1, gap: "6vw" }}>
        {/* Left: features */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.6vw", color: "#7a6050", marginBottom: "5vh", lineHeight: 1.5 }}>
            Una experiencia diseñada para acompañarte.
          </div>

          {/* Feature 1 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw", marginBottom: "4vh" }}>
            <div style={{ width: "0.65vw", height: "0.65vw", borderRadius: "50%", backgroundColor: "#C69B4F", marginTop: "0.9vh", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.8vh" }}>Onboarding personalizado</div>
              <div style={{ fontSize: "1.5vw", color: "#7a6050", lineHeight: 1.5 }}>Por nombre y momento del día, desde el primer uso.</div>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw", marginBottom: "4vh" }}>
            <div style={{ width: "0.65vw", height: "0.65vw", borderRadius: "50%", backgroundColor: "#C69B4F", marginTop: "0.9vh", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.8vh" }}>Estética cálida y profunda</div>
              <div style={{ fontSize: "1.5vw", color: "#7a6050", lineHeight: 1.5 }}>Bronce, oscuridad y calma en cada pantalla.</div>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
            <div style={{ width: "0.65vw", height: "0.65vw", borderRadius: "50%", backgroundColor: "#C69B4F", marginTop: "0.9vh", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.8vh" }}>Diseñada para Latinoamérica</div>
              <div style={{ fontSize: "1.5vw", color: "#7a6050", lineHeight: 1.5 }}>Totalmente en español, con sensibilidad local.</div>
            </div>
          </div>
        </div>

        {/* Right: visual */}
        <div style={{ width: "34vw", position: "relative", borderRadius: "1vw", overflow: "hidden", backgroundColor: "#24160F", border: "1px solid rgba(198,155,79,0.12)" }}>
          <img
            src={`${base}cosmic-bg.png`}
            crossOrigin="anonymous"
            alt="Experiencia RESONANCIA"
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at center, rgba(24,17,12,0) 30%, rgba(24,17,12,0.85) 100%)"
          }} />
          <div style={{ position: "absolute", bottom: "5vh", left: "3vw" }}>
            <img
              src={`${base}logo-cuenco.png`}
              crossOrigin="anonymous"
              alt="Casa del Cuenco"
              style={{ width: "5vw", height: "5vw", objectFit: "contain" }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4vh" }}>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>02</div>
      </div>
    </div>
  );
}
