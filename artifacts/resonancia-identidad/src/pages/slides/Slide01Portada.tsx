export default function Slide01Portada() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center font-display"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}
    >
      {/* Decorative concentric rings */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0 }}>
        <div style={{ position: "relative", width: "70vw", height: "70vw" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "0.5px solid rgba(190, 150, 80,0.06)" }} />
          <div style={{ position: "absolute", inset: "12%", borderRadius: "50%", border: "0.5px solid rgba(190, 150, 80,0.1)" }} />
          <div style={{ position: "absolute", inset: "26%", borderRadius: "50%", border: "1px solid rgba(190, 150, 80,0.16)" }} />
          <div style={{ position: "absolute", inset: "38%", borderRadius: "50%", border: "1px solid rgba(190, 150, 80,0.28)" }} />
          <div style={{ position: "absolute", inset: "47%", borderRadius: "50%", border: "1.5px solid rgba(190, 150, 80,0.45)", backgroundColor: "rgba(190, 150, 80,0.03)" }} />
        </div>
      </div>

      {/* Radial glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(190, 150, 80,0.04) 0%, rgba(6, 10, 15,0) 65%)", zIndex: 0 }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
        <div style={{ fontSize: "1.1vw", fontWeight: 700, letterSpacing: "0.3em", color: "#BE9650", marginBottom: "3vh" }}>
          CASA DEL CUENCO
        </div>

        <div style={{ width: "8vw", height: "0.35vh", backgroundColor: "#BE9650", opacity: 0.5, marginBottom: "4vh" }} />

        <div style={{ fontSize: "8vw", fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.04em", color: "#EDE1D3", marginBottom: "0vh" }}>
          RESONANCIA
        </div>
        <div style={{ fontSize: "2.4vw", fontWeight: 300, letterSpacing: "0.05em", color: "#EDE1D3", marginBottom: "4.5vh" }}>
          Sonidos Ancestrales
        </div>

        <div style={{ width: "8vw", height: "0.35vh", backgroundColor: "#BE9650", opacity: 0.5, marginBottom: "4vh" }} />

        <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "#7A8FA8", letterSpacing: "0.12em" }}>
          Cuencos · Gongs · Frecuencias Sagradas
        </div>
      </div>

      {/* Bottom label */}
      <div style={{ position: "absolute", bottom: "6vh", left: 0, right: 0, display: "flex", justifyContent: "space-between", paddingLeft: "7vw", paddingRight: "7vw", zIndex: 1 }}>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.08em" }}>
          IDENTIDAD VISUAL · 2026
        </div>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#7A8FA8" }}>
          iOS · Android
        </div>
      </div>
    </div>
  );
}
