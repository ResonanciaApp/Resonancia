export function DarkLines() {
  const tracks = [
    { name: "Viento", vol: 72, img: "#8B7A5A" },
    { name: "Noche", vol: 58, img: "#4A6080" },
  ];

  return (
    <div
      className="min-h-screen flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div
        style={{
          width: 390,
          background: "#0B0F14",
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          paddingBottom: 36,
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 18 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Header */}
        <div style={{ paddingInline: 20, display: "flex", alignItems: "center", marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#EDE1D3" }}>Tu mezcla</div>
            <div style={{ fontSize: 12, color: "rgba(122,143,168,0.7)", marginTop: 1 }}>2 de 10 sonidos</div>
          </div>
          <span style={{ fontSize: 13, color: "#7A8FA8", marginRight: 14, fontWeight: 400 }}>Terminar</span>
          <span style={{ fontSize: 20, color: "rgba(237,225,211,0.35)" }}>⌄</span>
        </div>

        {/* Tracks — separados por líneas */}
        <div style={{ marginTop: 12 }}>
          {tracks.map((t, i) => (
            <div key={i}>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ paddingInline: 20, paddingBlock: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  {/* Circular thumb */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 18,
                    background: `linear-gradient(145deg, ${t.img}66, ${t.img}22)`,
                    border: `1px solid ${t.img}44`,
                    flexShrink: 0,
                  }} />
                  <span style={{ flex: 1, fontSize: 15, color: "#D0C5B8", fontWeight: 400 }}>{t.name}</span>
                  <span style={{ fontSize: 12, color: "rgba(122,143,168,0.4)", cursor: "pointer" }}>✕</span>
                </div>
                {/* Slider bar */}
                <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, marginLeft: 48 }}>
                  <div style={{ width: `${t.vol}%`, height: "100%", background: "rgba(190,150,80,0.45)", borderRadius: 2 }} />
                  <div style={{
                    position: "absolute", top: "50%", left: `${t.vol}%`,
                    transform: "translate(-50%, -50%)",
                    width: 16, height: 16, borderRadius: 8,
                    background: "#EDE1D3",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
                  }} />
                </div>
              </div>
            </div>
          ))}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Agregar */}
        <div style={{
          paddingInline: 20, paddingBlock: 16,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 14,
            border: "1px solid rgba(190,150,80,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 18, color: "rgba(190,150,80,0.6)", lineHeight: 1 }}>+</span>
          </div>
          <span style={{ fontSize: 14, color: "rgba(190,150,80,0.55)", fontWeight: 400 }}>Agregar sonidos</span>
        </div>

        {/* Play — blanco limpio, texto navy */}
        <div style={{ paddingInline: 20, display: "flex", gap: 10, marginTop: 8 }}>
          <div style={{
            flex: 1, height: 52, borderRadius: 14,
            background: "#EDE1D3",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 18, color: "#090F17" }}>⏸</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#090F17" }}>Pausar</span>
          </div>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 16, color: "#7A8FA8" }}>⏱</span>
          </div>
        </div>

        {/* Save */}
        <div style={{ paddingInline: 20, display: "flex", gap: 10, marginTop: 10 }}>
          {["✓  Actualizar", "⊟  Guardar nueva"].map((label, i) => (
            <div key={i} style={{
              flex: 1, height: 44, borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 13, color: "rgba(237,225,211,0.45)", fontWeight: 400 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
