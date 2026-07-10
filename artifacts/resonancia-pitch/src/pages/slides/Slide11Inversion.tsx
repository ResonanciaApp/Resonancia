const base = import.meta.env.BASE_URL;

export default function Slide11Inversion() {
  const items = [
    { pct: "24%", monto: "$6,4M", desc: "Contenido: 107 sesiones con artistas y guiadores de voz." },
    { pct: "9%",  monto: "$2,5M", desc: "Programación extra: desarrollo y funcionalidades adicionales." },
    { pct: "6%",  monto: "$1,5M", desc: "Masterización: postproducción y control de calidad de audio." },
    { pct: "15%", monto: "$4,0M", desc: "Equipamiento: micrófonos, tratamiento acústico y estudio." },
    { pct: "11%", monto: "$3,0M", desc: "Marketing de lanzamiento: orgánico + pauta inicial." },
    { pct: "2%",  monto: "$500K", desc: "Trámites legales: constitución, T&C y publicación en tiendas." },
    { pct: "31%", monto: "$8,4M", desc: "Runway operativo: sueldos del equipo en los meses 1–3." },
    { pct: "2%",  monto: "$500K", desc: "Colchón para imprevistos." },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ background: "linear-gradient(160deg, #2E0D16 0%, #1A0810 100%)", color: "#F4DAD5" }}
    >
      {/* Left column — content */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "56vw", height: "100vh", padding: "9vh 5vw", boxSizing: "border-box" }}
      >
        <div>
          <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
            LA INVERSIÓN
          </div>
          <div style={{ fontSize: "4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "48vw" }}>
            Buscamos <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>$27 millones</span>
          </div>
          <div style={{ fontSize: "1.9vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.5, marginTop: "2vh", maxWidth: "46vw" }}>
            para producir el catálogo, equipar el estudio, lanzar al mercado y operar hasta alcanzar flujo positivo.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.9vh" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "1.2vw" }}>
              <div style={{ width: "0.75vw", height: "0.75vw", backgroundColor: "#F7CB6B", flexShrink: 0, transform: "translateY(0.35vw) rotate(45deg)" }} />
              <div style={{ fontSize: "1.45vw", color: "rgba(242,231,228,0.50)", lineHeight: 1.4 }}>
                <span style={{ background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>{item.pct} · {item.monto}</span>
                {" "}— {item.desc}
              </div>
            </div>
          ))}
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
          background: "linear-gradient(90deg, #2E0D16 0%, rgba(46,13,22,0.12) 32%, rgba(46,13,22,0) 58%)"
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, width: "100%", height: "32%",
          background: "linear-gradient(0deg, #2E0D16 0%, rgba(46,13,22,0) 100%)"
        }} />
        {/* Brand mark bottom-right */}
        <div style={{ position: "absolute", bottom: "8vh", right: "3vw", textAlign: "right" }}>
          <div style={{ fontSize: "1.6vw", fontWeight: 700, letterSpacing: "-0.05em", background: "linear-gradient(90deg, #F7CB6B, #FBA980)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</div>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "rgba(242,231,228,0.50)", letterSpacing: "0.08em" }}>CASA DEL CUENCO</div>
        </div>
      </div>
    </div>
  );
}
