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
        <div style={{ position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)", width: 80, height: 80, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.15)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 100, height: 100, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.08)", pointerEvents: "none" }} />

        {/* texto a la izquierda */}
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{
            fontSize: 13, fontWeight: 800, letterSpacing: 0.4,
            background: "linear-gradient(90deg,#D4AF37,#E9C46A)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>EXPANSOR CERTIFICADO</div>
          <div style={{ fontSize: 11, color: "rgba(212,175,55,0.55)", marginTop: 2 }}>Verificado por Resonancia</div>
        </div>

        {/* ícono circular a la derecha */}
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, rgba(212,175,55,0.30), rgba(184,134,11,0.20))",
          border: "1.5px solid rgba(212,175,55,0.50)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px rgba(212,175,55,0.25)",
          fontSize: 17, color: "rgba(212,175,55,0.90)",
        }}>✦</div>
      </div>
    </div>
  );
}
