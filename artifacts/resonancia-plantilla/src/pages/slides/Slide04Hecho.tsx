export default function Slide04Hecho() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          03 · LO QUE YA ESTÁ HECHO
        </div>
        <div style={{ fontSize: "4.4vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "70vw" }}>
          No es una idea. <span style={{ color: "#BE9650" }}>Ya funciona.</span>
        </div>
      </div>

      {/* Stat row */}
      <div style={{ display: "flex", gap: "1.8vw" }}>
        <div style={{ flex: 1, backgroundColor: "rgba(190,150,80,0.08)", border: "1.5px solid #BE9650", borderRadius: "1vw", padding: "3.5vh 1.6vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "3.4vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>+1.000.000</div>
          <div style={{ fontSize: "1.4vw", color: "#7A8FA8", marginTop: "1.4vh", lineHeight: 1.45 }}>seguidores en redes — un canal de distribución propio</div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "3.5vh 1.6vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "3.4vw", fontWeight: 700, color: "#EDE1D3", lineHeight: 1 }}>180</div>
          <div style={{ fontSize: "1.4vw", color: "#7A8FA8", marginTop: "1.4vh", lineHeight: 1.45 }}>pistas de audio listas para escuchar</div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "3.5vh 1.6vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "3.4vw", fontWeight: 700, color: "#EDE1D3", lineHeight: 1 }}>iOS + Android</div>
          <div style={{ fontSize: "1.4vw", color: "#7A8FA8", marginTop: "1.4vh", lineHeight: 1.45 }}>app completa: cuentas, reproductor y comunidad</div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "3.5vh 1.6vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "3.4vw", fontWeight: 700, color: "#EDE1D3", lineHeight: 1 }}>Suscripciones</div>
          <div style={{ fontSize: "1.4vw", color: "#7A8FA8", marginTop: "1.4vh", lineHeight: 1.45 }}>cobros y panel de administración listos</div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "#EDE1D3", lineHeight: 1.5, maxWidth: "80vw" }}>
        El mayor riesgo técnico ya está resuelto. Lo que sigue es lanzar y crecer.
      </div>
    </div>
  );
}
