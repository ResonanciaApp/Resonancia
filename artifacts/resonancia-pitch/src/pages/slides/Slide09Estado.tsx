export default function Slide09Estado() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7a6050", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          08 · ESTADO ACTUAL
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "66vw" }}>
          El producto <span style={{ color: "#C69B4F" }}>ya existe.</span>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "flex", gap: "2.5vw" }}>
        <div style={{ flex: 1, backgroundColor: "#24160F", borderRadius: "1vw", padding: "3.5vh 2.2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#C69B4F", marginBottom: "2.2vh" }}>Construido</div>
          <div style={{ fontSize: "1.6vw", color: "#cbb9a4", lineHeight: 1.7 }}>
            App iOS y Android funcional · Catálogo de sesiones y reproductor · Comunidad, diario y perfiles · Infraestructura de audio y backend · Diseño y marca definidos
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#24160F", borderRadius: "1vw", padding: "3.5vh 2.2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "1.9vw", fontWeight: 700, color: "#C69B4F", marginBottom: "2.2vh" }}>En camino</div>
          <div style={{ fontSize: "1.6vw", color: "#cbb9a4", lineHeight: 1.7 }}>
            Cobros con RevenueCat · Publicación en App Store y Google Play · Notificaciones push · Migración de video a CDN · Crecimiento del catálogo
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "#7a6050", lineHeight: 1.5, maxWidth: "78vw" }}>
        La mayor parte del riesgo técnico ya está resuelto. Lo que sigue es lanzar y crecer.
      </div>
    </div>
  );
}
