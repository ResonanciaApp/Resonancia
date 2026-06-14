const BG = "#1B060F";

export function CompactC() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 14, padding: 20,
      fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <p style={{ color: "rgba(244,218,213,0.35)", fontSize: 11, letterSpacing: 1.5,
        textTransform: "uppercase", margin: 0 }}>Compact C — Brasa Lateral</p>

      {/* Banner pill */}
      <div style={{
        width: 360, borderRadius: 18,
        background: "#1E060A",
        border: "1px solid rgba(212,175,55,0.28)",
        boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
        padding: "0 16px",
        height: 68,
        display: "flex", alignItems: "center", gap: 14,
        position: "relative", overflow: "hidden", cursor: "pointer",
      }}>
        {/* Brasa lateral izquierda — glow cálido desde el ícono */}
        <div style={{
          position: "absolute", top: "50%", left: -10,
          transform: "translateY(-50%)",
          width: 90, height: 90, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(190,80,20,0.38) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* Degradado que se apaga hacia la derecha */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg, rgba(120,30,10,0.18) 0%, transparent 55%)",
          pointerEvents: "none",
        }} />

        {/* Crown */}
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: "rgba(190,80,20,0.22)",
          border: "1px solid rgba(212,150,50,0.40)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, position: "relative",
          boxShadow: "0 0 12px rgba(190,80,20,0.35)",
        }}>👑</div>

        {/* Text */}
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE7DA", lineHeight: 1.2, marginBottom: 3 }}>
            Prueba Premium
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.50)" }}>
            Desbloquea todo el contenido
          </div>
        </div>

        {/* Chevron */}
        <div style={{
          color: "rgba(212,175,55,0.70)", fontSize: 18, fontWeight: 700,
          flexShrink: 0, position: "relative",
        }}>›</div>
      </div>

      <p style={{ color: "rgba(244,218,213,0.22)", fontSize: 10, margin: 0 }}>
        Glow cálido lateral desde la corona · fondo plano oscuro · sin borde pesado
      </p>
    </div>
  );
}
