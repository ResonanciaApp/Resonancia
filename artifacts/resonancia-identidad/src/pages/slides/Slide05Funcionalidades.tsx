const base = import.meta.env.BASE_URL;

export default function Slide05Funcionalidades() {
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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>
              RESONANCIA
            </div>
            <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
          </div>
          <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
            Funcionalidades <span style={{ fontWeight: 700, color: "#C69B4F" }}>clave</span>
          </h2>
        </div>

        {/* Features */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "3.5vh" }}>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
            <div style={{ width: "3vw", height: "3vw", borderRadius: "0.6vw", backgroundColor: "rgba(198,155,79,0.12)", border: "1px solid rgba(198,155,79,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: "1vw", height: "1vw", borderRadius: "50%", backgroundColor: "#C69B4F" }} />
            </div>
            <div>
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.5vh" }}>Biblioteca de sesiones</div>
              <div style={{ fontSize: "1.5vw", color: "#7a6050", lineHeight: 1.5 }}>30+ sesiones en 5 categorías: Sonidos Ancestrales, Meditaciones Guiadas, Música, ASMR e Historias.</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
            <div style={{ width: "3vw", height: "3vw", borderRadius: "0.6vw", backgroundColor: "rgba(198,155,79,0.12)", border: "1px solid rgba(198,155,79,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: "1vw", height: "0.35vh", backgroundColor: "#C69B4F", borderRadius: "2px" }} />
            </div>
            <div>
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.5vh" }}>Reproductor inmersivo</div>
              <div style={{ fontSize: "1.5vw", color: "#7a6050", lineHeight: 1.5 }}>Arte circular, timer personalizable, control independiente de voz y ambiente.</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
            <div style={{ width: "3vw", height: "3vw", borderRadius: "0.6vw", backgroundColor: "rgba(198,155,79,0.12)", border: "1px solid rgba(198,155,79,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg viewBox="0 0 20 20" width="1.1vw" height="1.1vw">
                <path d="M10 3 C10 3 4 7 4 12 C4 15.3 6.7 18 10 18 C13.3 18 16 15.3 16 12 C16 7 10 3 10 3Z" stroke="#C69B4F" fill="none" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.5vh" }}>Mi Música — Mixer</div>
              <div style={{ fontSize: "1.5vw", color: "#7a6050", lineHeight: 1.5 }}>36 sonidos ambiente para combinar: naturaleza, agua, cuencos, frecuencias binaurales.</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "2vw" }}>
            <div style={{ width: "3vw", height: "3vw", borderRadius: "0.6vw", backgroundColor: "rgba(198,155,79,0.12)", border: "1px solid rgba(198,155,79,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: "1vw", height: "1vw", borderRadius: "2px", border: "0.15vw solid #C69B4F" }} />
            </div>
            <div>
              <div style={{ fontSize: "2vw", fontWeight: 600, color: "#EDE1D3", marginBottom: "0.5vh" }}>Perfil y progreso</div>
              <div style={{ fontSize: "1.5vw", color: "#7a6050", lineHeight: 1.5 }}>Racha diaria, minutos escuchados, diario, favoritos y mezclas guardadas.</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>05</div>
        </div>
      </div>

      {/* Right column — iPhone mockup */}
      <div style={{ width: "48vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(198,155,79,0.05) 0%, rgba(24,17,12,0) 65%)" }} />
        <div style={{
          width: "13vw", height: "28.2vw",
          backgroundColor: "#1C1C1E",
          borderRadius: "2.4vw",
          padding: "0.45vw",
          boxShadow: "0 1vw 5vw rgba(0,0,0,0.9), 0 0 0 0.12vw rgba(255,255,255,0.07)",
          position: "relative",
          zIndex: 1
        }}>
          <div style={{ position: "absolute", top: "1.2vw", left: "50%", transform: "translateX(-50%)", width: "3.2vw", height: "0.7vw", backgroundColor: "#000", borderRadius: "0.45vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "2.05vw", overflow: "hidden", backgroundColor: "#18110C" }}>
            <img
              src={`${base}mockup-home.jpg`}
              crossOrigin="anonymous"
              alt="RESONANCIA app"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
