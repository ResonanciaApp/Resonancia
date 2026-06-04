export function MinimalFrost() {
  const tracks = [
    { name: "Viento", vol: 72, color: "#8B9A7A" },
    { name: "Noche", vol: 58, color: "#6A7E9E" },
  ];

  return (
    <div
      className="min-h-screen flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.55)", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div
        style={{
          width: 390,
          background: "#090F17",
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          paddingBottom: 36,
          overflow: "hidden",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, paddingBottom: 20 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{ paddingInline: 22, display: "flex", alignItems: "center", marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#EDE1D3", letterSpacing: 0.2 }}>Tu mezcla</div>
            <div style={{ fontSize: 12, color: "rgba(122,143,168,0.8)", marginTop: 2 }}>2 / 10 sonidos</div>
          </div>
          <span style={{ fontSize: 13, color: "rgba(122,143,168,0.7)", marginRight: 16 }}>Terminar</span>
          <span style={{ fontSize: 20, color: "rgba(237,225,211,0.5)" }}>⌄</span>
        </div>

        {/* Tracks — sin card, solo separador */}
        <div style={{ paddingInline: 22 }}>
          {tracks.map((t, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `linear-gradient(135deg, ${t.color}44, ${t.color}22)`,
                  border: `1px solid ${t.color}33`,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 15, color: "#EDE1D3", flex: 1, fontWeight: 400 }}>{t.name}</span>
                <span style={{ fontSize: 13, color: "rgba(122,143,168,0.5)" }}>×</span>
              </div>
              {/* Slim slider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 52 }}>
                <div style={{ flex: 1, position: "relative", height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                  <div style={{ width: `${t.vol}%`, height: "100%", background: "rgba(190,150,80,0.55)", borderRadius: 2 }} />
                  <div style={{
                    position: "absolute", top: "50%", left: `${t.vol}%`,
                    transform: "translate(-50%, -50%)",
                    width: 14, height: 14, borderRadius: 7,
                    background: "#BE9650", boxShadow: "0 0 0 3px rgba(190,150,80,0.18)",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: "rgba(122,143,168,0.5)", minWidth: 24, textAlign: "right" }}>{t.vol}</span>
              </div>
              {i < tracks.length - 1 && (
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginTop: 20 }} />
              )}
            </div>
          ))}

          {/* Agregar — texto limpio */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBlock: 14, gap: 8 }}>
            <span style={{ fontSize: 18, color: "rgba(190,150,80,0.5)", lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 14, color: "rgba(190,150,80,0.6)", fontWeight: 400 }}>Agregar sonidos</span>
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginInline: 22, marginTop: 4, marginBottom: 18 }} />

        {/* Controls */}
        <div style={{ paddingInline: 22, display: "flex", gap: 10 }}>
          <div style={{
            flex: 1, height: 50, borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 18, color: "#EDE1D3" }}>⏸</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#EDE1D3" }}>Pausar</span>
          </div>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 16, color: "rgba(122,143,168,0.7)" }}>⏱</span>
          </div>
        </div>

        {/* Save row */}
        <div style={{ paddingInline: 22, display: "flex", gap: 10, marginTop: 10 }}>
          {["✓  Actualizar", "⊟  Guardar nueva"].map((label, i) => (
            <div key={i} style={{
              flex: 1, height: 44, borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 13, color: "rgba(237,225,211,0.55)", fontWeight: 400 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
