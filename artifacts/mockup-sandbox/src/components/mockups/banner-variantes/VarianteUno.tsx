const P = {
  bg0:      "#080306",
  bg1:      "#160609",
  glowClr:  "#380A18",
  gold:     "#E0AE52",
  goldSoft: "#C8963E",
  goldHi:   "#F5C86A",
  textMain: "#EDE7DA",
  textMuted:"#C8B89A",
  border:   "rgba(224,174,82,0.22)",
  btnBorder:"rgba(224,174,82,0.45)",
  divLine:  "#C8963E",
};

const THUMBS = [
  { bg: "#2A1408" },
  { bg: "#1A1030" },
  { bg: "#301808" },
  { bg: "#0A2030" },
];

export default function BannerVarianteUno() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#060204",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        width: 320,
        borderRadius: 22,
        border: `0.8px solid ${P.border}`,
        overflow: "hidden",
        boxShadow: `0 0 40px rgba(56,10,24,0.55), 0 8px 24px rgba(0,0,0,0.7)`,
        background: `linear-gradient(180deg, ${P.bg1} 0%, ${P.bg0} 100%)`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "34px 24px 28px",
      }}>
        {/* Top glow */}
        <div style={{
          position: "absolute",
          top: -30,
          left: "50%",
          transform: "translateX(-50%)",
          width: 200,
          height: 90,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${P.glowClr} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* Eyebrow */}
        <p style={{
          margin: "0 0 6px",
          fontSize: 12.5,
          letterSpacing: "0.6px",
          color: P.textMuted,
          textAlign: "center",
        }}>Únete a la comunidad</p>

        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{
            fontSize: 36,
            fontWeight: 800,
            color: P.gold,
            letterSpacing: "0.4px",
            textShadow: `0 0 18px rgba(224,174,82,0.25)`,
          }}>Premium</span>
          <span style={{ fontSize: 26 }}>⭐</span>
        </div>

        {/* Divider */}
        <div style={{
          width: 160,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${P.divLine}, transparent)`,
          marginBottom: 16,
          opacity: 0.55,
        }} />

        {/* Description */}
        <p style={{
          margin: "0 0 22px",
          fontSize: 13,
          color: P.textMuted,
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: 260,
        }}>
          Comienza tu camino hacia el bienestar con más de 500 meditaciones y sonidos relajantes.
        </p>

        {/* Thumbnails */}
        <div style={{ display: "flex", gap: 8, marginBottom: 26 }}>
          {THUMBS.map((t, i) => (
            <div key={i} style={{
              width: 62,
              height: 62,
              borderRadius: 12,
              background: t.bg,
              border: `1px solid rgba(224,174,82,0.18)`,
              boxShadow: `0 0 8px rgba(56,10,24,0.4)`,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(135deg, rgba(40,6,16,0.6) 0%, transparent 60%)`,
              }} />
              <span style={{ position: "absolute", top: 3, left: 3, fontSize: 13, lineHeight: 1 }}>⭐</span>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <div style={{
          width: "100%",
          borderRadius: 50,
          border: `1px solid ${P.btnBorder}`,
          background: `linear-gradient(90deg, rgba(22,6,9,0.9) 0%, rgba(10,4,8,0.95) 100%)`,
          boxShadow: `0 0 16px rgba(224,174,82,0.10), inset 0 1px 0 rgba(224,174,82,0.08)`,
          padding: "15px 0",
          textAlign: "center",
          cursor: "pointer",
        }}>
          <span style={{
            fontSize: 15.5,
            fontWeight: 700,
            color: P.gold,
            letterSpacing: "0.3px",
            textShadow: `0 0 12px rgba(224,174,82,0.3)`,
          }}>Probar gratis 7 días</span>
        </div>
      </div>
    </div>
  );
}
