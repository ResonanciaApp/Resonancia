const base = import.meta.env.BASE_URL;

export default function Slide07Cierre() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left gold panel */}
      <div style={{
        width: "45vw", height: "100vh",
        backgroundColor: "#C69B4F",
        padding: "0 7vw",
        boxSizing: "border-box",
        display: "flex", flexDirection: "column", justifyContent: "center"
      }}>
        <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "0.2em", color: "#18110C", marginBottom: "1.5vh" }}>
          RESONANCIA
        </div>
        <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#18110C", marginBottom: "5vh", opacity: 0.4 }} />
        <div style={{ fontSize: "5vw", fontWeight: 700, color: "#18110C", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "0.2vh" }}>
          Casa del
        </div>
        <div style={{ fontSize: "5vw", fontWeight: 300, color: "#18110C", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "4.5vh" }}>
          Cuenco.
        </div>
        <div style={{ fontSize: "1.4vw", color: "rgba(24,17,12,0.5)", lineHeight: 1.6 }}>
          Cuencos · Gongs · Frecuencias Sagradas
        </div>
      </div>

      {/* Right dark panel */}
      <div style={{
        width: "55vw", height: "100vh",
        padding: "0 7vw",
        boxSizing: "border-box",
        display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative"
      }}>
        {/* Subtle rings decoration */}
        <div style={{ position: "absolute", right: "-5vw", top: "50%", transform: "translateY(-50%)", width: "35vw", height: "35vw", borderRadius: "50%", border: "1px solid rgba(198,155,79,0.06)" }} />
        <div style={{ position: "absolute", right: "0vw", top: "50%", transform: "translateY(-50%)", width: "24vw", height: "24vw", borderRadius: "50%", border: "1px solid rgba(198,155,79,0.1)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5vh" }}>
            <div>
              <div style={{ fontSize: "1vw", color: "#3d2a18", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "1.5vh" }}>Plataformas</div>
              <div style={{ fontSize: "2.8vw", fontWeight: 300, color: "#EDE1D3" }}>iOS · Android</div>
            </div>
            <div>
              <div style={{ fontSize: "1vw", color: "#3d2a18", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "1.5vh" }}>Idioma</div>
              <div style={{ fontSize: "2.8vw", fontWeight: 300, color: "#EDE1D3" }}>Español</div>
            </div>
            <div>
              <div style={{ fontSize: "1vw", color: "#3d2a18", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "1.5vh" }}>Lanzamiento</div>
              <div style={{ fontSize: "2.8vw", fontWeight: 300, color: "#EDE1D3" }}>2026</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: "7vh", left: "7vw", right: "5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>07</div>
        </div>
      </div>
    </div>
  );
}
