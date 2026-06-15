const base = import.meta.env.BASE_URL;

export default function Slide04Producto() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}
    >
      {/* Left column — text */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "52vw", height: "100vh", padding: "9vh 5vw", boxSizing: "border-box" }}
      >
        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
            03 · EL PRODUCTO
          </div>
          <div style={{ fontSize: "4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "44vw" }}>
            Una app completa, <span style={{ background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ya construida.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.6vh" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#D4AF37", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}>
              Catálogo de sesiones: meditaciones guiadas, música, sonidos ancestrales, historias y ASMR.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#D4AF37", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}>
              Reproductor con temporizador de sueño, favoritos y descargas offline.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#D4AF37", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}>
              Perfiles de artistas y voces guía, diario personal e intención del día.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#D4AF37", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.85vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}>
              Comunidad: grupos, chat, mensajes del alma y reproducción en pantalla bloqueada.
            </div>
          </div>
        </div>

        <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "rgba(242,231,228,0.50)", letterSpacing: "0.08em" }}>
          EXPO · iOS Y ANDROID DESDE UNA SOLA BASE DE CÓDIGO
        </div>
      </div>

      {/* Right column — iPhones, centered and larger */}
      <div style={{ width: "48vw", height: "100vh", position: "relative", backgroundColor: "#1B060F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.06) 0%, rgba(27,6,15,0) 65%)" }} />

        {/* Single phone — Mi Música, centered and large */}
        <div style={{
          position: "relative",
          width: "20vw",
          height: "43.4vw",
          backgroundColor: "#1C1C1E",
          borderRadius: "3.5vw",
          padding: "0.65vw",
          boxShadow: "0 2.4vw 9vw rgba(0,0,0,0.95), 0 0 0 0.14vw rgba(255,255,255,0.07)",
          zIndex: 1
        }}>
          <div style={{ position: "absolute", top: "1.65vw", left: "50%", transform: "translateX(-50%)", width: "4.7vw", height: "1vw", backgroundColor: "#000", borderRadius: "0.68vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "3vw", overflow: "hidden", backgroundColor: "#1B060F" }}>
            <img src={`${base}mockup-musica.jpg`} crossOrigin="anonymous" alt="Mi Música" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>

        {/* Blend gradient on left edge */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "10%", height: "100%", background: "linear-gradient(90deg, #1B060F 0%, rgba(27,6,15,0) 100%)", zIndex: 3 }} />
      </div>
    </div>
  );
}
