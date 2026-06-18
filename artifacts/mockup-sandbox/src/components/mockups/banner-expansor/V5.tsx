export function V5() {
  return (
    <div style={{ minHeight: "100vh", background: "#1B060F", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{
        width: "100%", maxWidth: 400,
        display: "flex", alignItems: "stretch",
        borderRadius: 12, overflow: "hidden",
        border: "1px solid rgba(212,175,55,0.18)",
      }}>
        {/* barra lateral dorada */}
        <div style={{
          width: 5, flexShrink: 0,
          background: "linear-gradient(180deg,#E9C46A,#B8860B)",
        }} />

        {/* contenido */}
        <div style={{
          flex: 1, padding: "11px 14px",
          background: "rgba(212,175,55,0.05)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 16, color: "#D4AF37", lineHeight: 1 }}>✦</span>
          <div>
            <div style={{
              fontSize: 13, fontWeight: 700,
              background: "linear-gradient(90deg,#D4AF37,#E9C46A)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Expansor Certificado</div>
            <div style={{ fontSize: 10, color: "rgba(212,175,55,0.50)", marginTop: 2, letterSpacing: 0.5 }}>Verificado · Resonancia</div>
          </div>
        </div>
      </div>
    </div>
  );
}
