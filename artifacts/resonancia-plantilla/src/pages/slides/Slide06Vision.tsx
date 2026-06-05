export default function Slide06Vision() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          05 · HACIA DÓNDE VAMOS
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "70vw" }}>
          Los próximos <span style={{ color: "#BE9650" }}>doce meses.</span>
        </div>
      </div>

      {/* Three columns */}
      <div style={{ display: "flex", gap: "2.2vw" }}>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "4vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#7A8FA8", marginBottom: "1.6vh", letterSpacing: "0.04em" }}>01</div>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#BE9650", marginBottom: "1.8vh" }}>Lanzar</div>
          <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.65 }}>
            Publicar en App Store y Google Play y activar los cobros para los primeros suscriptores.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "4vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#7A8FA8", marginBottom: "1.6vh", letterSpacing: "0.04em" }}>02</div>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#BE9650", marginBottom: "1.8vh" }}>Crecer</div>
          <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.65 }}>
            Ampliar el catálogo y convertir la audiencia que ya tenemos en usuarios activos.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "4vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#7A8FA8", marginBottom: "1.6vh", letterSpacing: "0.04em" }}>03</div>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#BE9650", marginBottom: "1.8vh" }}>Expandir</div>
          <div style={{ fontSize: "1.5vw", color: "#7A8FA8", lineHeight: 1.65 }}>
            Llevar RESONANCIA a más países de habla hispana en Latinoamérica.
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "#EDE1D3", lineHeight: 1.5, maxWidth: "80vw" }}>
        Los números finos y el plan en detalle los vemos juntos en la reunión.
      </div>
    </div>
  );
}
