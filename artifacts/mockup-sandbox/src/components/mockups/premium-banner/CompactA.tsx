const BG = "#1B060F";

export function CompactA() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 14, padding: 20,
      fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <p style={{ color: "rgba(244,218,213,0.35)", fontSize: 11, letterSpacing: 1.5,
        textTransform: "uppercase", margin: 0 }}>Compact A — Borgoña Cálido</p>

      {/* Banner pill */}
      <div style={{
        width: 360, borderRadius: 18,
        background: "linear-gradient(125deg, #4A1212 0%, #2C0909 50%, #1E0608 100%)",
        border: "1px solid rgba(212,175,55,0.35)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
        padding: "0 16px",
        height: 68,
        display: "flex", alignItems: "center", gap: 14,
        position: "relative", overflow: "hidden", cursor: "pointer",
      }}>
        {/* Shimmer top-left sutil */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: "50%", height: "100%",
          background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        {/* Crown circle */}
        <div style={{
          width: 40, height: 40, borderRadius: 20, flexShrink: 0,
          background: "rgba(212,175,55,0.14)",
          border: "1.5px solid rgba(212,175,55,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>👑</div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE7DA", lineHeight: 1.2, marginBottom: 3 }}>
            Prueba Premium
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.52)" }}>
            Desbloquea todo el contenido
          </div>
        </div>

        {/* Chevron */}
        <div style={{
          width: 26, height: 26, borderRadius: 13, flexShrink: 0,
          background: "rgba(212,175,55,0.15)",
          border: "1px solid rgba(212,175,55,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#D4AF37", fontSize: 15, fontWeight: 700,
        }}>›</div>
      </div>

      <p style={{ color: "rgba(244,218,213,0.22)", fontSize: 10, margin: 0 }}>
        Relleno borgoña · corona en círculo dorado · chevron pill
      </p>
    </div>
  );
}
