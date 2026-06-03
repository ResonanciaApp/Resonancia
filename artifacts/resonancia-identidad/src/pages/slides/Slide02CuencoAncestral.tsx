const base = import.meta.env.BASE_URL;

export default function Slide02CuencoAncestral() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}
    >
      {/* Left column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "52vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box" }}
      >
        {/* Header */}
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#BE9650", marginBottom: "1vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#BE9650" }} />
        </div>

        {/* Main content */}
        <div>
          <div style={{ fontSize: "1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#BE9650", marginBottom: "2.5vh", textTransform: "uppercase" }}>
            Sonidos Ancestrales
          </div>
          <div style={{ fontSize: "4.2vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#EDE1D3", marginBottom: "1.5vh" }}>
            Milenios de
          </div>
          <div style={{ fontSize: "4.2vw", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#BE9650", marginBottom: "5vh" }}>
            sanación por sonido.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "3vh" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
              <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "50%", backgroundColor: "#BE9650", marginTop: "0.9vh", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "1.9vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.5vh" }}>Cuencos Tibetanos y de Cuarzo</div>
                <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.5 }}>Frecuencias que equilibran el sistema nervioso y profundizan el sueño.</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
              <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "50%", backgroundColor: "#BE9650", marginTop: "0.9vh", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "1.9vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.5vh" }}>Gongs y frecuencias sagradas</div>
                <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.5 }}>Vibraciones que disuelven tensión y abren estados contemplativos.</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
              <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "50%", backgroundColor: "#BE9650", marginTop: "0.9vh", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "1.9vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.5vh" }}>Subcategorías en la app</div>
                <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.5 }}>Cuencos Tibetanos · Cuarzo · Mix · Gongs · Full Instrumentos.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#7A8FA8" }}>02</div>
        </div>
      </div>

      {/* Right column — hero image */}
      <div style={{ width: "48vw", height: "100vh", position: "relative" }}>
        <img
          src={`${base}cuenco-hero.png`}
          crossOrigin="anonymous"
          alt="Cuenco tibetano"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          background: "linear-gradient(90deg, #060A0F 0%, rgba(6, 10, 15,0.25) 40%, rgba(6, 10, 15,0) 65%)"
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, width: "100%", height: "25%",
          background: "linear-gradient(0deg, #060A0F 0%, rgba(6, 10, 15,0) 100%)"
        }} />
      </div>
    </div>
  );
}
