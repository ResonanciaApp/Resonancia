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

      {/* Right column — 2 iPhone mockups */}
      <div style={{ width: "44vw", height: "100vh", position: "relative", backgroundColor: "#18110C" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(198,155,79,0.05) 0%, rgba(24,17,12,0) 65%)" }} />

        {/* Back phone — Mi Música */}
        <div style={{
          position: "absolute",
          right: "1.5vw",
          top: "50%",
          transform: "translateY(-42%)",
          width: "10.5vw",
          height: "22.8vw",
          backgroundColor: "#2C2C2E",
          borderRadius: "2vw",
          padding: "0.38vw",
          boxShadow: "0 1vw 3vw rgba(0,0,0,0.7)",
          zIndex: 1,
          opacity: 0.6
        }}>
          <div style={{ position: "absolute", top: "1vw", left: "50%", transform: "translateX(-50%)", width: "2.7vw", height: "0.58vw", backgroundColor: "#000", borderRadius: "0.38vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "1.68vw", overflow: "hidden", backgroundColor: "#18110C" }}>
            <img src={`${base}mockup-musica.jpg`} crossOrigin="anonymous" alt="Mi Música" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>

        {/* Front phone — Sonidos Ancestrales */}
        <div style={{
          position: "absolute",
          right: "12.5vw",
          top: "50%",
          transform: "translateY(-54%)",
          width: "12.5vw",
          height: "27.1vw",
          backgroundColor: "#1C1C1E",
          borderRadius: "2.3vw",
          padding: "0.44vw",
          boxShadow: "0 1.5vw 6vw rgba(0,0,0,0.92), 0 0 0 0.12vw rgba(255,255,255,0.07)",
          zIndex: 2
        }}>
          <div style={{ position: "absolute", top: "1.2vw", left: "50%", transform: "translateX(-50%)", width: "3.1vw", height: "0.68vw", backgroundColor: "#000", borderRadius: "0.46vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "1.95vw", overflow: "hidden", backgroundColor: "#18110C" }}>
            <img src={`${base}mockup-sonidos.jpg`} crossOrigin="anonymous" alt="Sonidos Ancestrales" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>

        {/* Blend gradient on left edge */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "18%", height: "100%", background: "linear-gradient(90deg, #18110C 0%, rgba(24,17,12,0) 100%)", zIndex: 3 }} />
      </div>
    </div>
  );
}
