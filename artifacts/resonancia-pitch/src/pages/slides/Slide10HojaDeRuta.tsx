export default function Slide10HojaDeRuta() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          11 · HOJA DE RUTA AL LANZAMIENTO
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          El camino a <span style={{ color: "#FFFFFF" }}>las tiendas.</span>
        </div>
      </div>

      {/* Four steps */}
      <div style={{ display: "flex", gap: "2vw" }}>
        <div style={{ flex: 1, borderTop: "2px solid #FFFFFF", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>01</div>
          <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#F4F4F4", marginBottom: "1vh" }}>Cobros</div>
          <div style={{ fontSize: "1.5vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.45 }}>
            Activar suscripciones con RevenueCat y definir precios por región.
          </div>
        </div>
        <div style={{ flex: 1, borderTop: "2px solid #FFFFFF", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>02</div>
          <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#F4F4F4", marginBottom: "1vh" }}>Publicación</div>
          <div style={{ fontSize: "1.5vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.45 }}>
            Builds con EAS y aprobación en App Store y Google Play.
          </div>
        </div>
        <div style={{ flex: 1, borderTop: "2px solid #FFFFFF", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>03</div>
          <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#F4F4F4", marginBottom: "1vh" }}>Lanzamiento</div>
          <div style={{ fontSize: "1.5vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.45 }}>
            Salida inicial en Latinoamérica y España con prueba gratis de 7 días.
          </div>
        </div>
        <div style={{ flex: 1, borderTop: "2px solid #FFFFFF", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#FFFFFF", marginBottom: "1vh" }}>04</div>
          <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#F4F4F4", marginBottom: "1vh" }}>Crecimiento</div>
          <div style={{ fontSize: "1.5vw", color: "rgba(244,244,244,0.50)", lineHeight: 1.45 }}>
            Marketing, alianzas con artistas y expansión del catálogo.
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "rgba(244,244,244,0.50)", lineHeight: 1.5, maxWidth: "78vw" }}>
        Horizonte estimado: [completar timeline]. El equipo ya tiene el producto listo para ejecutar.
      </div>
    </div>
  );
}
