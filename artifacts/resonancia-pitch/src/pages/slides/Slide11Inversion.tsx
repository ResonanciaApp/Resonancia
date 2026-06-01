const base = import.meta.env.BASE_URL;

export default function Slide11Inversion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left column — content */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "56vw", height: "100vh", padding: "9vh 5vw", boxSizing: "border-box" }}
      >
        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7a6050", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
            12 · LA INVERSIÓN
          </div>
          <div style={{ fontSize: "4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "48vw" }}>
            Buscamos <span style={{ color: "#C69B4F" }}>[monto a levantar]</span>
          </div>
          <div style={{ fontSize: "1.9vw", fontWeight: 400, color: "#7a6050", lineHeight: 1.5, marginTop: "2vh", maxWidth: "46vw" }}>
            para lanzar al mercado y acelerar el crecimiento.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.2vh" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#C69B4F", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.75vw", color: "#cbb9a4", lineHeight: 1.4 }}>Publicación en tiendas y activación de cobros.</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#C69B4F", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.75vw", color: "#cbb9a4", lineHeight: 1.4 }}>Marketing de lanzamiento y adquisición de usuarios.</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#C69B4F", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.75vw", color: "#cbb9a4", lineHeight: 1.4 }}>Producción de contenido con artistas y voces guía.</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "#7a6050", letterSpacing: "0.1em", marginBottom: "0.8vh" }}>
            CONTACTO
          </div>
          <div style={{ fontSize: "1.6vw", fontWeight: 500, color: "#EDE1D3" }}>
            [nombre] · [correo] · [teléfono]
          </div>
        </div>
      </div>

      {/* Right column — image */}
      <div style={{ width: "44vw", height: "100vh", position: "relative" }}>
        <img
          src={`${base}hero-atmosphere.png`}
          crossOrigin="anonymous"
          alt="Atmósfera sonora de RESONANCIA"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          background: "linear-gradient(90deg, #18110C 0%, rgba(24,17,12,0.12) 32%, rgba(24,17,12,0) 58%)"
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, width: "100%", height: "32%",
          background: "linear-gradient(0deg, #18110C 0%, rgba(24,17,12,0) 100%)"
        }} />
        {/* Brand mark bottom-right */}
        <div style={{ position: "absolute", bottom: "8vh", right: "3vw", textAlign: "right" }}>
          <div style={{ fontSize: "1.6vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F" }}>RESONANCIA</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "#cbb9a4", letterSpacing: "0.08em" }}>CASA DEL CUENCO</div>
        </div>
      </div>
    </div>
  );
}
