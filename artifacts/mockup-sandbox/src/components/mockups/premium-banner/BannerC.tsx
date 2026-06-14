const BG = "#1B060F";
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#E9C46A";

const features = [
  { icon: "🎧", text: "+500 meditaciones" },
  { icon: "🎵", text: "+50 Música y sonidos" },
  { icon: "👥", text: "Muro de la comunidad" },
];

export function BannerC() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20, padding: 20,
      fontFamily: "system-ui, -apple-system, sans-serif" }}>

      <p style={{ color: "rgba(244,218,213,0.35)", fontSize: 11, letterSpacing: 1.5,
        textTransform: "uppercase", margin: 0 }}>
        Banner C — Acento Dorado
      </p>

      {/* Banner */}
      <div style={{
        width: 360, borderRadius: 20, overflow: "hidden",
        background: "#1E060A",
        border: `1px solid rgba(212,175,55,0.35)`,
        boxShadow: "0 8px 36px rgba(0,0,0,0.50)",
        cursor: "pointer", position: "relative",
      }}>
        {/* Gold accent strip at top */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, transparent 0%, ${GOLD} 30%, ${GOLD_LIGHT} 65%, transparent 100%)`,
        }} />

        <div style={{ padding: "16px 18px 18px 18px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
            {/* Crown — larger, no circle */}
            <div style={{ fontSize: 32, lineHeight: 1, flexShrink: 0, marginTop: 2,
              filter: `drop-shadow(0 0 8px rgba(212,175,55,0.55))` }}>
              👑
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#EDE7DA", letterSpacing: 0.2 }}>
                  Prueba Premium
                </span>
                <div style={{
                  background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                  borderRadius: 6, padding: "2px 7px",
                }}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#1B060F", letterSpacing: 0.8, textTransform: "uppercase" }}>
                    7 días gratis
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                Lleva tu relajación al siguiente nivel
              </div>
            </div>

            <div style={{
              width: 26, height: 26, borderRadius: 13, flexShrink: 0, marginTop: 4,
              background: "rgba(212,175,55,0.12)", border: `1px solid rgba(212,175,55,0.35)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: GOLD, fontSize: 13, fontWeight: 700,
            }}>›</div>
          </div>

          {/* Feature list with gold dots */}
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
            {features.map(f => (
              <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)" }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* CTA — split: left ghost / right solid */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{
              flex: 1, borderRadius: 11, padding: "10px 0", textAlign: "center",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>
                Más info
              </span>
            </div>
            <div style={{
              flex: 2, borderRadius: 11, padding: "10px 0", textAlign: "center",
              background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#1B060F" }}>
                Empezar prueba gratis
              </span>
            </div>
          </div>
        </div>
      </div>

      <p style={{ color: "rgba(244,218,213,0.22)", fontSize: 10, margin: 0, textAlign: "center", lineHeight: 1.6, maxWidth: 260 }}>
        Sólido oscuro · franja dorada superior · badge "7 días gratis" · CTA doble
      </p>
    </div>
  );
}
