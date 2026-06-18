export function V1() {
  return (
    <div style={{ minHeight: "100vh", background: "#1B060F", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{
        width: "100%", maxWidth: 400,
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px", borderRadius: 12,
        background: "rgba(212,175,55,0.07)",
      }}>
        <span style={{ fontSize: 15, color: "#D4AF37", fontWeight: 800 }}>✦</span>
        <span style={{
          fontSize: 14, fontWeight: 700, letterSpacing: 0.3,
          background: "linear-gradient(90deg, #D4AF37, #E9C46A)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Expansor Certificado
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(212,175,55,0.55)", fontWeight: 500 }}>por Resonancia</span>
      </div>
    </div>
  );
}
