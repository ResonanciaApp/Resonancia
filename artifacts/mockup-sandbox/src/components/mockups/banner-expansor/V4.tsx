export function V4() {
  return (
    <div style={{ minHeight: "100vh", background: "#1B060F", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{
        width: "100%", maxWidth: 400, position: "relative",
        borderRadius: 14, padding: "14px 18px",
        background: "rgba(10,4,6,0.80)",
        border: "1px solid rgba(212,175,55,0.22)",
        display: "flex", alignItems: "center", gap: 12,
        overflow: "hidden",
      }}>
        {/* glow */}
        <div style={{
          position: "absolute", left: -20, top: "50%", transform: "translateY(-50%)",
          width: 100, height: 100, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,175,55,0.28) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <span style={{
          fontSize: 22, lineHeight: 1,
          filter: "drop-shadow(0 0 8px rgba(212,175,55,0.8))",
        }}>✦</span>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 14, fontWeight: 700,
            background: "linear-gradient(90deg,#F0D060,#D4AF37)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            textShadow: "none",
          }}>Expansor Certificado</div>
        </div>

        <div style={{
          fontSize: 10, color: "rgba(212,175,55,0.50)", fontWeight: 600,
          letterSpacing: 1, textTransform: "uppercase",
        }}>Resonancia</div>
      </div>
    </div>
  );
}
