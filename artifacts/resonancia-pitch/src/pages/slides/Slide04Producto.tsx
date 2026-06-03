const base = import.meta.env.BASE_URL;

export default function Slide04Producto() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}
    >
      {/* Left column — text */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "52vw", height: "100vh", padding: "9vh 5vw", boxSizing: "border-box" }}
      >
        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
            03 · EL PRODUCTO
          </div>
          <div style={{ fontSize: "4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "44vw" }}>
            Una app completa, <span style={{ color: "#BE9650" }}>ya construida.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.6vh" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#BE9650", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.4 }}>
              Catálogo de sesiones: meditaciones guiadas, música, sonidos ancestrales, historias y ASMR.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#BE9650", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.4 }}>
              Reproductor con temporizador de sueño, favoritos y descargas offline.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#BE9650", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.4 }}>
              Perfiles de artistas y voces guía, diario personal e intención del día.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#BE9650", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "#7A8FA8", lineHeight: 1.4 }}>
              Comunidad: grupos, chat, mensajes del alma y reproducción en pantalla bloqueada.
            </div>
          </div>
        </div>

        <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.08em" }}>
          EXPO · iOS Y ANDROID DESDE UNA SOLA BASE DE CÓDIGO
        </div>
      </div>

      {/* Right column — iPhones, centered and larger */}
      <div style={{ width: "48vw", height: "100vh", position: "relative", backgroundColor: "#060A0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(190, 150, 80,0.06) 0%, rgba(6, 10, 15,0) 65%)" }} />

        {/* Phone group */}
        <div style={{ position: "relative", width: "36vw", height: "38vw", zIndex: 1 }}>

          {/* Back phone — Mi Música, offset top-right */}
          <div style={{
            position: "absolute",
            right: 0,
            top: "10%",
            width: "14vw",
            height: "30.4vw",
            backgroundColor: "#2C2C2E",
            borderRadius: "2.5vw",
            padding: "0.46vw",
            boxShadow: "0 1vw 3.5vw rgba(0,0,0,0.75)",
            zIndex: 1,
            opacity: 0.6
          }}>
            <div style={{ position: "absolute", top: "1.2vw", left: "50%", transform: "translateX(-50%)", width: "3.3vw", height: "0.72vw", backgroundColor: "#000", borderRadius: "0.48vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2.1vw", overflow: "hidden", backgroundColor: "#060A0F" }}>
              <img src={`${base}mockup-musica.jpg`} crossOrigin="anonymous" alt="Mi Música" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>

          {/* Front phone — Sonidos Ancestrales, large and prominent */}
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "17vw",
            height: "36.9vw",
            backgroundColor: "#1C1C1E",
            borderRadius: "3vw",
            padding: "0.55vw",
            boxShadow: "0 2vw 8vw rgba(0,0,0,0.95), 0 0 0 0.12vw rgba(255,255,255,0.07)",
            zIndex: 2
          }}>
            <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4vw", height: "0.85vw", backgroundColor: "#000", borderRadius: "0.58vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2.55vw", overflow: "hidden", backgroundColor: "#060A0F" }}>
              <img src={`${base}mockup-sonidos.jpg`} crossOrigin="anonymous" alt="Sonidos Ancestrales" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>

        </div>

        {/* Blend gradient on left edge */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "10%", height: "100%", background: "linear-gradient(90deg, #060A0F 0%, rgba(6, 10, 15,0) 100%)", zIndex: 3 }} />
      </div>
    </div>
  );
}
