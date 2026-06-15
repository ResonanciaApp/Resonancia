const base = import.meta.env.BASE_URL;

export default function Slide11Inversion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}
    >
      {/* Left column — content */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "56vw", height: "100vh", padding: "9vh 5vw", boxSizing: "border-box" }}
      >
        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
            12 · LA INVERSIÓN
          </div>
          <div style={{ fontSize: "4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "48vw" }}>
            Buscamos <span style={{ background: "linear-gradient(90deg, #FF6B3D, #FF9E4D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>US$ 30.000</span>
          </div>
          <div style={{ fontSize: "1.9vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.5, marginTop: "2vh", maxWidth: "46vw" }}>
            para producir el catálogo, equipar el estudio, lanzar al mercado y operar hasta alcanzar flujo positivo.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.35vh" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#D4AF37", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.5vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}><span style={{ background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>22% · US$6.670</span> — Contenido: pistas con artistas certificados y pago a guiadores de voz.</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#D4AF37", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.5vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}><span style={{ background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>15% · US$4.440</span> — Equipos de estudio: micrófonos, tratamiento acústico y ambientación.</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#D4AF37", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.5vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}><span style={{ background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>15% · US$4.440</span> — Marketing de lanzamiento (orgánico + pauta).</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#D4AF37", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.5vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}><span style={{ background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>11% · US$3.330</span> — Legal, constitución, T&C y publicación en tiendas.</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#D4AF37", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.5vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}><span style={{ background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>26% · US$7.900</span> — Runway operativo: sueldos del equipo en los meses 1–3 (hasta flujo positivo).</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw" }}>
            <div style={{ width: "0.8vw", height: "0.8vw", backgroundColor: "#D4AF37", flexShrink: 0, transform: "translateY(0.4vw) rotate(45deg)" }} />
            <div style={{ fontSize: "1.5vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}><span style={{ background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>11% · US$3.220</span> — Colchón para imprevistos.</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "rgba(242,231,228,0.50)", letterSpacing: "0.1em", marginBottom: "0.8vh" }}>
            CONTACTO
          </div>
          <div style={{ fontSize: "1.6vw", fontWeight: 500, color: "#F4DAD5" }}>
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
          background: "linear-gradient(90deg, #1B060F 0%, rgba(27,6,15,0.12) 32%, rgba(27,6,15,0) 58%)"
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, width: "100%", height: "32%",
          background: "linear-gradient(0deg, #1B060F 0%, rgba(27,6,15,0) 100%)"
        }} />
        {/* Brand mark bottom-right */}
        <div style={{ position: "absolute", bottom: "8vh", right: "3vw", textAlign: "right" }}>
          <div style={{ fontSize: "1.6vw", fontWeight: 700, letterSpacing: "-0.05em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "rgba(242,231,228,0.50)", letterSpacing: "0.08em" }}>CASA DEL CUENCO</div>
        </div>
      </div>
    </div>
  );
}
