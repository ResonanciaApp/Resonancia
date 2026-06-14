const BG = "#1B060F";

export function CompactB() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 14, padding: 20,
      fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <p style={{ color: "rgba(244,218,213,0.35)", fontSize: 11, letterSpacing: 1.5,
        textTransform: "uppercase", margin: 0 }}>Compact B — Vidriera Dorada</p>

      {/* Banner pill */}
      <div style={{
        width: 360, borderRadius: 18,
        background: "linear-gradient(135deg, #3A1108 0%, #220708 100%)",
        border: "1px solid rgba(212,175,55,0.50)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.40), inset 0 1px 0 rgba(212,175,55,0.12)",
        padding: "0 16px",
        height: 68,
        display: "flex", alignItems: "center", gap: 14,
        position: "relative", overflow: "hidden", cursor: "pointer",
      }}>
        {/* Gold top-edge glow */}
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.60), transparent)",
          pointerEvents: "none",
        }} />

        {/* Crown — sin círculo, con glow */}
        <div style={{
          fontSize: 24, flexShrink: 0, lineHeight: 1,
          filter: "drop-shadow(0 0 8px rgba(212,175,55,0.65)) drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
        }}>👑</div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE7DA", lineHeight: 1.2, marginBottom: 3 }}>
            Prueba Premium
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
            Desbloquea todo el contenido
          </div>
        </div>

        {/* Chevron plain */}
        <div style={{
          color: "rgba(212,175,55,0.80)", fontSize: 20, fontWeight: 700, flexShrink: 0, lineHeight: 1,
        }}>›</div>
      </div>

      <p style={{ color: "rgba(244,218,213,0.22)", fontSize: 10, margin: 0 }}>
        Borde dorado más marcado · corona flotante con glow · chevron simple
      </p>
    </div>
  );
}
