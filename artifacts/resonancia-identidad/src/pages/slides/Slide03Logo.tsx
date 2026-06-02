export default function Slide03Logo() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "7vh 7vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5vh" }}>
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
            Propuesta de <span style={{ fontWeight: 700, color: "#C69B4F" }}>identidad</span>
          </h2>
          <div style={{ fontSize: "1.5vw", color: "#7a6050", marginTop: "0.8vh" }}>
            Tres conceptos para Casa del Cuenco
          </div>
        </div>
      </div>

      {/* 3 logo concepts */}
      <div style={{ display: "flex", flex: 1, gap: "3vw" }}>

        {/* Option A — El Cuenco */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#24160F", borderRadius: "1vw", border: "1px solid rgba(198,155,79,0.12)", padding: "4vh 2vw" }}>
          <div style={{ marginBottom: "3.5vh" }}>
            <svg viewBox="0 0 140 100" width="12vw" height="8.5vw" style={{ overflow: "visible" }}>
              <ellipse cx="70" cy="28" rx="60" ry="16" stroke="#C69B4F" fill="none" strokeWidth="2.5" />
              <path d="M 10 28 C 8 58 132 58 130 28" stroke="#C69B4F" fill="none" strokeWidth="2.5" />
              <ellipse cx="70" cy="58" rx="38" ry="9" stroke="#C69B4F" fill="none" strokeWidth="1.2" opacity="0.4" />
              <line x1="70" y1="67" x2="70" y2="80" stroke="#C69B4F" strokeWidth="1.5" opacity="0.3" />
              <ellipse cx="70" cy="82" rx="18" ry="4" stroke="#C69B4F" fill="none" strokeWidth="1" opacity="0.2" />
            </svg>
          </div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, letterSpacing: "0.1em", color: "#C69B4F", marginBottom: "1.5vh" }}>
            EL CUENCO
          </div>
          <div style={{ fontSize: "1.3vw", color: "#7a6050", textAlign: "center", lineHeight: 1.5, maxWidth: "18vw" }}>
            Silueta del cuenco tibetano. Directo, reconocible, ancestral.
          </div>
        </div>

        {/* Option B — La Vibración */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#24160F", borderRadius: "1vw", border: "1px solid rgba(198,155,79,0.22)", padding: "4vh 2vw" }}>
          <div style={{ marginBottom: "3.5vh" }}>
            <svg viewBox="0 0 140 110" width="12vw" height="9.4vw" style={{ overflow: "visible" }}>
              <circle cx="70" cy="72" r="6" fill="#C69B4F" />
              <path d="M 44 72 C 44 44 96 44 96 72" stroke="#C69B4F" fill="none" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M 26 72 C 26 30 114 30 114 72" stroke="#C69B4F" fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
              <path d="M 8 72 C 8 16 132 16 132 72" stroke="#C69B4F" fill="none" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />
            </svg>
          </div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, letterSpacing: "0.1em", color: "#C69B4F", marginBottom: "1.5vh" }}>
            LA VIBRACIÓN
          </div>
          <div style={{ fontSize: "1.3vw", color: "#7a6050", textAlign: "center", lineHeight: 1.5, maxWidth: "18vw" }}>
            Ondas sonoras expandiéndose. Movimiento, frecuencia, resonancia.
          </div>
        </div>

        {/* Option C — Monograma */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#24160F", borderRadius: "1vw", border: "1px solid rgba(198,155,79,0.12)", padding: "4vh 2vw" }}>
          <div style={{ marginBottom: "3.5vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: "8.5vw", fontWeight: 700, color: "#C69B4F", lineHeight: 1, letterSpacing: "-0.05em" }}>
              R
            </div>
            <svg viewBox="0 0 120 28" width="10vw" height="2.3vw" style={{ marginTop: "-0.5vw" }}>
              <path d="M 5 14 C 30 2 90 2 115 14" stroke="#C69B4F" fill="none" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
              <path d="M 20 18 C 40 8 80 8 100 18" stroke="#C69B4F" fill="none" strokeWidth="1.3" strokeLinecap="round" opacity="0.45" />
            </svg>
          </div>
          <div style={{ fontSize: "1.5vw", fontWeight: 700, letterSpacing: "0.1em", color: "#C69B4F", marginBottom: "1.5vh" }}>
            MONOGRAMA
          </div>
          <div style={{ fontSize: "1.3vw", color: "#7a6050", textAlign: "center", lineHeight: 1.5, maxWidth: "18vw" }}>
            Inicial con arco de cuenco. Tipográfico, versátil, elegante.
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3.5vh" }}>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>03</div>
      </div>
    </div>
  );
}
