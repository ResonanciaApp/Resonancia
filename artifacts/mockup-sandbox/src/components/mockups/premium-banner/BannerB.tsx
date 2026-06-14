const BG = "#1B060F";
const GOLD = "#D4AF37";

const features = [
  { icon: "🎧", text: "+500 meditaciones" },
  { icon: "🎵", text: "+50 Música y sonidos" },
  { icon: "👥", text: "Muro de la comunidad" },
];

export function BannerB() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20, padding: 20,
      fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <p style={{ color: "rgba(244,218,213,0.35)", fontSize: 11, letterSpacing: 1.5,
        textTransform: "uppercase", margin: 0 }}>
        Banner B — Cristal Transparente
      </p>

      {/* Banner */}
      <div style={{
        width: 360, borderRadius: 20,
        background: "rgba(212,175,55,0.06)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid rgba(212,175,55,0.28)`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        padding: "18px 18px 20px 18px",
        position: "relative",
        cursor: "pointer",
      }}>
        {/* Shimmer diagonal */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 20,
          background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 45%)",
          pointerEvents: "none",
        }} />
        {/* Gold glow edge top */}
        <div style={{
          position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
          background: `linear-gradient(90deg, transparent, rgba(212,175,55,0.55), transparent)`,
          pointerEvents: "none",
        }} />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          {/* Crown circle */}
          <div style={{
            width: 42, height: 42, borderRadius: 21, flexShrink: 0,
            background: "rgba(212,175,55,0.12)",
            border: `1px solid rgba(212,175,55,0.38)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            boxShadow: "0 0 16px rgba(212,175,55,0.20)",
          }}>👑</div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#EDE7DA", lineHeight: 1.2, marginBottom: 3 }}>
              Prueba Premium
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
              Lleva tu relajación al siguiente nivel
            </div>
          </div>

          <div style={{
            width: 28, height: 28, borderRadius: 14, flexShrink: 0,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.60)", fontSize: 14, fontWeight: 700,
          }}>›</div>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
          {features.map(f => (
            <div key={f.text} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 20, padding: "5px 10px",
            }}>
              <span style={{ fontSize: 11 }}>{f.icon}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.78)" }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Ghost CTA */}
        <div style={{
          border: `1px solid rgba(212,175,55,0.50)`,
          borderRadius: 12, padding: "10px 0", textAlign: "center",
          background: "rgba(212,175,55,0.08)",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: 0.3 }}>
            Probar 7 días gratis
          </span>
        </div>
      </div>

      <p style={{ color: "rgba(244,218,213,0.22)", fontSize: 10, margin: 0, textAlign: "center", lineHeight: 1.6, maxWidth: 260 }}>
        Fondo transparente · features como pills · CTA ghost dorado
      </p>
    </div>
  );
}
