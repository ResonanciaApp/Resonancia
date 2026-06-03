export default function Slide04Paleta() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col font-display"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "7vh 7vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5.5vh" }}>
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#BE9650", marginBottom: "1vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#BE9650" }} />
        </div>
        <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
          Sistema de <span style={{ fontWeight: 700, color: "#BE9650" }}>color</span>
        </h2>
      </div>

      {/* Color swatches row */}
      <div style={{ display: "flex", gap: "1.5vw", marginBottom: "4.5vh", flex: "0 0 auto" }}>

        {/* Fondo */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ height: "22vh", borderRadius: "0.8vw", backgroundColor: "#060A0F", border: "1px solid rgba(190, 150, 80,0.2)", marginBottom: "1.8vh" }} />
          <div style={{ fontSize: "1.6vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.4vh" }}>Fondo</div>
          <div style={{ fontSize: "1.3vw", color: "#7A8FA8" }}>#060A0F</div>
          <div style={{ fontSize: "1.1vw", color: "#7A8FA8", marginTop: "0.3vh" }}>Azul marina</div>
        </div>

        {/* Primario */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ height: "22vh", borderRadius: "0.8vw", backgroundColor: "#BE9650", marginBottom: "1.8vh" }} />
          <div style={{ fontSize: "1.6vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.4vh" }}>Primario</div>
          <div style={{ fontSize: "1.3vw", color: "#7A8FA8" }}>#BE9650</div>
          <div style={{ fontSize: "1.1vw", color: "#7A8FA8", marginTop: "0.3vh" }}>Bronce dorado</div>
        </div>

        {/* Acento */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ height: "22vh", borderRadius: "0.8vw", backgroundColor: "#D6A85B", marginBottom: "1.8vh" }} />
          <div style={{ fontSize: "1.6vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.4vh" }}>Acento</div>
          <div style={{ fontSize: "1.3vw", color: "#7A8FA8" }}>#D6A85B</div>
          <div style={{ fontSize: "1.1vw", color: "#7A8FA8", marginTop: "0.3vh" }}>Ámbar cálido</div>
        </div>

        {/* Card */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ height: "22vh", borderRadius: "0.8vw", backgroundColor: "#090E17", border: "1px solid rgba(190, 150, 80,0.15)", marginBottom: "1.8vh" }} />
          <div style={{ fontSize: "1.6vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.4vh" }}>Card</div>
          <div style={{ fontSize: "1.3vw", color: "#7A8FA8" }}>#090E17</div>
          <div style={{ fontSize: "1.1vw", color: "#7A8FA8", marginTop: "0.3vh" }}>Azul profundo</div>
        </div>

        {/* Texto */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ height: "22vh", borderRadius: "0.8vw", backgroundColor: "#EDE1D3", marginBottom: "1.8vh" }} />
          <div style={{ fontSize: "1.6vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.4vh" }}>Texto</div>
          <div style={{ fontSize: "1.3vw", color: "#7A8FA8" }}>#EDE1D3</div>
          <div style={{ fontSize: "1.1vw", color: "#7A8FA8", marginTop: "0.3vh" }}>Crema arena</div>
        </div>

      </div>

      {/* Typography section */}
      <div style={{ borderTop: "1px solid rgba(190, 150, 80,0.12)", paddingTop: "3.5vh" }}>
        <div style={{ fontSize: "1vw", fontWeight: 600, letterSpacing: "0.15em", color: "#7A8FA8", marginBottom: "2.5vh" }}>
          TIPOGRAFÍA
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4vw" }}>
          <div>
            <div style={{ fontSize: "4.5vw", fontWeight: 700, color: "#EDE1D3", letterSpacing: "-0.04em", lineHeight: 1 }}>
              Space Grotesk
            </div>
            <div style={{ fontSize: "1.3vw", color: "#7A8FA8", marginTop: "1vh" }}>Display · 700 Bold</div>
          </div>
          <div style={{ width: "1px", height: "6vh", backgroundColor: "rgba(190, 150, 80,0.2)" }} />
          <div style={{ display: "flex", gap: "3vw", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: "2.5vw", fontWeight: 300, color: "#EDE1D3" }}>Light 300</div>
              <div style={{ fontSize: "1.3vw", color: "#7A8FA8", marginTop: "0.5vh" }}>Títulos suaves</div>
            </div>
            <div>
              <div style={{ fontSize: "2.5vw", fontWeight: 600, color: "#BE9650" }}>Semi 600</div>
              <div style={{ fontSize: "1.3vw", color: "#7A8FA8", marginTop: "0.5vh" }}>Etiquetas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh", marginTop: "auto" }}>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#7A8FA8" }}>04</div>
      </div>
    </div>
  );
}
