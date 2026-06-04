export function SlateGlass() {
  const tracks = [
    { name: "Viento", vol: 72, color: "#6B8A70" },
    { name: "Noche", vol: 58, color: "#4A6A8A" },
  ];

  return (
    <div
      className="min-h-screen flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div
        style={{
          width: 390,
          background: "rgba(11,15,20,0.97)",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: 38,
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "none",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 18 }}>
          <div style={{ width: 32, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Header — dos columnas: texto izq + acciones der */}
        <div style={{ paddingInline: 20, display: "flex", alignItems: "center", marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#EDE1D3", letterSpacing: 0.1 }}>Tu mezcla</div>
            <div style={{ fontSize: 12, color: "rgba(122,143,168,0.6)", marginTop: 2, fontWeight: 300 }}>2 · 10 sonidos</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(122,143,168,0.5)", fontWeight: 400 }}>Terminar</span>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14, color: "rgba(237,225,211,0.4)", lineHeight: 1 }}>⌄</span>
            </div>
          </div>
        </div>

        {/* Tracks — glass cards */}
        <div style={{ paddingInline: 20, display: "flex", flexDirection: "column", gap: 8 }}>
          {tracks.map((t, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.035)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 18,
              padding: "12px 16px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `linear-gradient(145deg, ${t.color}55, ${t.color}1A)`,
                  border: `1px solid ${t.color}3A`,
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: 15, color: "rgba(237,225,211,0.85)", fontWeight: 400 }}>{t.name}</span>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 11, color: "rgba(122,143,168,0.5)" }}>✕</span>
                </div>
              </div>
              {/* Slider */}
              <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                <div style={{
                  width: `${t.vol}%`, height: "100%",
                  background: `linear-gradient(90deg, ${t.color}50, ${t.color}80)`,
                  borderRadius: 2,
                }} />
                <div style={{
                  position: "absolute", top: "50%", left: `${t.vol}%`,
                  transform: "translate(-50%, -50%)",
                  width: 16, height: 16, borderRadius: 8,
                  background: "#EDE1D3",
                  boxShadow: "0 1px 6px rgba(0,0,0,0.6)",
                }} />
              </div>
            </div>
          ))}

          {/* Agregar */}
          <div style={{
            height: 46,
            background: "rgba(255,255,255,0.025)",
            border: "1px dashed rgba(255,255,255,0.07)",
            borderRadius: 18,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginTop: 2,
          }}>
            <span style={{ fontSize: 17, color: "rgba(190,150,80,0.45)", lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 13, color: "rgba(190,150,80,0.45)", fontWeight: 300 }}>Agregar sonidos</span>
          </div>
        </div>

        {/* Controls — play grande + timer integrado */}
        <div style={{ paddingInline: 20, marginTop: 18, display: "flex", gap: 8 }}>
          {/* Play */}
          <div style={{
            flex: 1, height: 52, borderRadius: 16,
            background: "rgba(237,225,211,0.07)",
            border: "1px solid rgba(237,225,211,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <span style={{ fontSize: 18, color: "rgba(237,225,211,0.8)" }}>⏸</span>
            <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(237,225,211,0.8)", letterSpacing: 0.2 }}>Pausar</span>
          </div>
          {/* Timer — integrado como chip */}
          <div style={{
            padding: "0 16px", height: 52, borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <span style={{ fontSize: 14, color: "rgba(122,143,168,0.6)" }}>⏱</span>
            <span style={{ fontSize: 11, color: "rgba(122,143,168,0.45)", fontWeight: 500 }}>30 min</span>
          </div>
        </div>

        {/* Save */}
        <div style={{ paddingInline: 20, display: "flex", gap: 8, marginTop: 8 }}>
          {["✓  Actualizar", "⊟  Guardar nueva"].map((label, i) => (
            <div key={i} style={{
              flex: 1, height: 44, borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 13, color: "rgba(237,225,211,0.35)", fontWeight: 400 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
