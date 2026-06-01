const base = import.meta.env.BASE_URL;

export default function Slide04Producto() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left column — text */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "56vw", height: "100vh", padding: "9vh 5vw", boxSizing: "border-box" }}
      >
        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7a6050", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
            03 · EL PRODUCTO
          </div>
          <div style={{ fontSize: "4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "48vw" }}>
            Una app completa, <span style={{ color: "#C69B4F" }}>ya construida.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.6vh" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#C69B4F", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "#cbb9a4", lineHeight: 1.4 }}>
              Catálogo de sesiones: meditaciones guiadas, música, sonidos ancestrales, historias y ASMR.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#C69B4F", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "#cbb9a4", lineHeight: 1.4 }}>
              Reproductor con temporizador de sueño, favoritos y descargas offline.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#C69B4F", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "#cbb9a4", lineHeight: 1.4 }}>
              Perfiles de artistas y voces guía, diario personal e intención del día.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#C69B4F", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "#cbb9a4", lineHeight: 1.4 }}>
              Comunidad: grupos, chat, mensajes del alma y reproducción en pantalla bloqueada.
            </div>
          </div>
        </div>

        <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "#5a4632", letterSpacing: "0.08em" }}>
          EXPO · iOS Y ANDROID DESDE UNA SOLA BASE DE CÓDIGO
        </div>
      </div>

      {/* Right column — image */}
      <div style={{ width: "44vw", height: "100vh", position: "relative" }}>
        <img
          src={`${base}hero-bowl.png`}
          crossOrigin="anonymous"
          alt="Experiencia sonora de RESONANCIA"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          background: "linear-gradient(90deg, #18110C 0%, rgba(24,17,12,0.1) 30%, rgba(24,17,12,0) 55%)"
        }} />
      </div>
    </div>
  );
}
