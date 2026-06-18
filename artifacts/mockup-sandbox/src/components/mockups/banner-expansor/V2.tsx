export function V2() {
  return (
    <div style={{ minHeight: "100vh", background: "#1B060F", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{
        width: "100%", maxWidth: 400,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "9px 20px", borderRadius: 999,
        border: "1.5px solid rgba(212,175,55,0.45)",
        background: "rgba(212,175,55,0.06)",
        alignSelf: "flex-start",
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "linear-gradient(135deg,#D4AF37,#B8860B)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, color: "#1B060F", fontWeight: 900, flexShrink: 0,
        }}>✦</div>
        <span style={{
          fontSize: 13, fontWeight: 700,
          background: "linear-gradient(90deg,#D4AF37,#E9C46A)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Expansor Certificado
        </span>
      </div>
    </div>
  );
}
