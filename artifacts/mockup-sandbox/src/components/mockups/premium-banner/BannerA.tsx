const BG = "#1B060F";
const GOLD = "#D4AF37";
const GOLD_SOFT = "#E9C46A";

const features = [
  { icon: "🎧", text: "+500 meditaciones" },
  { icon: "🎵", text: "+50 Música y sonidos" },
  { icon: "👥", text: "Muro de la comunidad" },
];

export function BannerA() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20, padding: 20,
      fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <p style={{ color: "rgba(244,218,213,0.35)", fontSize: 11, letterSpacing: 1.5,
        textTransform: "uppercase", margin: 0 }}>
        Banner A — Sólido Cálido
      </p>

      {/* Banner */}
      <div style={{
        width: 360, borderRadius: 20, overflow: "hidden",
        background: "linear-gradient(145deg, #4A1212 0%, #2C0A0A 55%, #1E0608 100%)",
        border: `1px solid rgba(212,175,55,0.40)`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.08)",
        padding: "18px 18px 20px 18px",
        position: "relative",
        cursor: "pointer",
      }}>
        {/* Glow orb top-left */}
        <div style={{
          position: "absolute", top: -30, left: -20, width: 110, height: 70,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(212,175,55,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          {/* Crown circle */}
          <div style={{
            width: 42, height: 42, borderRadius: 21, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.08) 100%)",
            border: `1.5px solid rgba(212,175,55,0.55)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>👑</div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#EDE7DA", lineHeight: 1.2, marginBottom: 3 }}>
              Prueba Premium
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.60)", lineHeight: 1.4 }}>
              Lleva tu relajación al siguiente nivel
            </div>
          </div>

          {/* Chevron */}
          <div style={{
            width: 28, height: 28, borderRadius: 14, flexShrink: 0,
            background: "rgba(212,175,55,0.14)", border: `1px solid rgba(212,175,55,0.30)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: GOLD, fontSize: 14, fontWeight: 700,
          }}>›</div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(212,175,55,0.18)", marginBottom: 14 }} />

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {features.map(f => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13 }}>{f.icon}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", lineHeight: 1 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: 16,
          background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_SOFT} 100%)`,
          borderRadius: 12, padding: "10px 0", textAlign: "center",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1B060F", letterSpacing: 0.3 }}>
            Probar 7 días gratis
          </span>
        </div>
      </div>

      <p style={{ color: "rgba(244,218,213,0.22)", fontSize: 10, margin: 0, textAlign: "center", lineHeight: 1.6, maxWidth: 260 }}>
        Relleno sólido borgoña · glow dorado · CTA full-width
      </p>
    </div>
  );
}
