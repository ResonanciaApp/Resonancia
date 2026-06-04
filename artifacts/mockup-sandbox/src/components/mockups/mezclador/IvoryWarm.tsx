export function IvoryWarm() {
  const tracks = [
    { name: "Viento", vol: 72, hue: "#C4A97D" },
    { name: "Noche", vol: 58, hue: "#7A9AB0" },
  ];

  return (
    <div
      className="min-h-screen flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.55)", fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div
        style={{
          width: 390,
          background: "#100D09",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: 40,
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 20 }}>
          <div style={{ width: 32, height: 3, borderRadius: 2, background: "rgba(190,150,80,0.25)" }} />
        </div>

        {/* Header */}
        <div style={{ paddingInline: 22, display: "flex", alignItems: "flex-start", marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", color: "rgba(190,150,80,0.5)", marginBottom: 4 }}>Mezclador</div>
            <div style={{ fontSize: 20, fontWeight: 300, color: "#EDE1D3", letterSpacing: 0.3 }}>Tu mezcla</div>
            <div style={{ fontSize: 12, color: "rgba(237,225,211,0.3)", marginTop: 3 }}>2 sonidos activos</div>
          </div>
          <span style={{ fontSize: 12, color: "rgba(190,150,80,0.45)", marginRight: 14, fontWeight: 400, marginTop: 4 }}>Terminar</span>
          <span style={{ fontSize: 18, color: "rgba(237,225,211,0.3)", marginTop: 2 }}>⌄</span>
        </div>

        {/* Tracks — warm tint suave */}
        <div style={{ paddingInline: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          {tracks.map((t, i) => (
            <div key={i} style={{
              background: "rgba(190,150,80,0.05)",
              border: "1px solid rgba(190,150,80,0.1)",
              borderRadius: 16,
              padding: "14px 14px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `linear-gradient(135deg, ${t.hue}55, ${t.hue}18)`,
                  border: `1px solid ${t.hue}33`,
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: 15, color: "#D8CAB8", fontWeight: 300, letterSpacing: 0.2 }}>{t.name}</span>
                <span style={{ fontSize: 11, color: "rgba(237,225,211,0.2)" }}>✕</span>
              </div>
              {/* Warm slider */}
              <div style={{ position: "relative", height: 3, background: "rgba(190,150,80,0.1)", borderRadius: 2 }}>
                <div style={{
                  width: `${t.vol}%`, height: "100%",
                  background: "linear-gradient(90deg, rgba(190,150,80,0.35), rgba(190,150,80,0.6))",
                  borderRadius: 2,
                }} />
                <div style={{
                  position: "absolute", top: "50%", left: `${t.vol}%`,
                  transform: "translate(-50%, -50%)",
                  width: 14, height: 14, borderRadius: 7,
                  background: "#C4A97D",
                  boxShadow: "0 0 0 3px rgba(190,150,80,0.15)",
                }} />
              </div>
            </div>
          ))}

          {/* Agregar */}
          <div style={{
            height: 46,
            border: "1px dashed rgba(190,150,80,0.18)",
            borderRadius: 16,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginTop: 2,
          }}>
            <span style={{ fontSize: 18, color: "rgba(190,150,80,0.4)", lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 13, color: "rgba(190,150,80,0.45)", fontWeight: 300, letterSpacing: 0.3 }}>Agregar sonidos</span>
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: 1, background: "rgba(190,150,80,0.08)", marginInline: 22, marginBlock: 20 }} />

        {/* Play — dorado muy apagado / soft */}
        <div style={{ paddingInline: 22, display: "flex", gap: 10 }}>
          <div style={{
            flex: 1, height: 50, borderRadius: 14,
            background: "rgba(190,150,80,0.14)",
            border: "1px solid rgba(190,150,80,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 17, color: "#C4A97D" }}>⏸</span>
            <span style={{ fontSize: 15, fontWeight: 400, color: "#C4A97D", letterSpacing: 0.3 }}>Pausar</span>
          </div>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: "rgba(190,150,80,0.08)",
            border: "1px solid rgba(190,150,80,0.14)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 15, color: "rgba(190,150,80,0.5)" }}>⏱</span>
          </div>
        </div>

        {/* Save */}
        <div style={{ paddingInline: 22, display: "flex", gap: 10, marginTop: 10 }}>
          {["✓  Actualizar", "⊟  Guardar nueva"].map((label, i) => (
            <div key={i} style={{
              flex: 1, height: 44, borderRadius: 12,
              border: "1px solid rgba(190,150,80,0.12)",
              background: "rgba(190,150,80,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 12, color: "rgba(190,150,80,0.4)", fontWeight: 300, letterSpacing: 0.3 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
