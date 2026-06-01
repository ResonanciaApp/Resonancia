export default function Slide10HojaDeRuta() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7a6050", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          11 · HOJA DE RUTA AL LANZAMIENTO
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          El camino a <span style={{ color: "#C69B4F" }}>las tiendas.</span>
        </div>
      </div>

      {/* Four steps */}
      <div style={{ display: "flex", gap: "2vw" }}>
        <div style={{ flex: 1, borderTop: "2px solid #C69B4F", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#C69B4F", marginBottom: "1vh" }}>01</div>
          <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "1vh" }}>Cobros</div>
          <div style={{ fontSize: "1.5vw", color: "#cbb9a4", lineHeight: 1.45 }}>
            Activar suscripciones con RevenueCat y definir precios por región.
          </div>
        </div>
        <div style={{ flex: 1, borderTop: "2px solid #C69B4F", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#C69B4F", marginBottom: "1vh" }}>02</div>
          <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "1vh" }}>Publicación</div>
          <div style={{ fontSize: "1.5vw", color: "#cbb9a4", lineHeight: 1.45 }}>
            Builds con EAS y aprobación en App Store y Google Play.
          </div>
        </div>
        <div style={{ flex: 1, borderTop: "2px solid #C69B4F", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#C69B4F", marginBottom: "1vh" }}>03</div>
          <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "1vh" }}>Lanzamiento</div>
          <div style={{ fontSize: "1.5vw", color: "#cbb9a4", lineHeight: 1.45 }}>
            Salida inicial en Latinoamérica y España con prueba gratis de 7 días.
          </div>
        </div>
        <div style={{ flex: 1, borderTop: "2px solid #C69B4F", paddingTop: "2.5vh" }}>
          <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#C69B4F", marginBottom: "1vh" }}>04</div>
          <div style={{ fontSize: "1.8vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "1vh" }}>Crecimiento</div>
          <div style={{ fontSize: "1.5vw", color: "#cbb9a4", lineHeight: 1.45 }}>
            Marketing, alianzas con artistas y expansión del catálogo.
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "#7a6050", lineHeight: 1.5, maxWidth: "78vw" }}>
        Horizonte estimado: [completar timeline]. El equipo ya tiene el producto listo para ejecutar.
      </div>
    </div>
  );
}
