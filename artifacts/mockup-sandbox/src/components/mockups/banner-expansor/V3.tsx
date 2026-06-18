export function V3() {
  return (
    <div style={{ minHeight: "100vh", background: "#1B060F", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{
        width: "100%", maxWidth: 400, position: "relative",
        overflow: "hidden", borderRadius: 12,
        background: "linear-gradient(100deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.04) 100%)",
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        {/* líneas decorativas */}
        <div style={{ position: "absolute", right: -10, top: -20, width: 80, height: 80, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.15)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 10, top: -30, width: 100, height: 100, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.08)", pointerEvents: "none" }} />

        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg,#D4AF37,#B8860B)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, color: "#1B060F", fontWeight: 900,
          boxShadow: "0 4px 12px rgba(212,175,55,0.35)",
        }}>✦</div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 13, fontWeight: 800, letterSpacing: 0.4,
            background: "linear-gradient(90deg,#D4AF37,#E9C46A)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>EXPANSOR CERTIFICADO</div>
          <div style={{ fontSize: 11, color: "rgba(212,175,55,0.55)", marginTop: 2 }}>Verificado por Resonancia</div>
        </div>
      </div>
    </div>
  );
}
