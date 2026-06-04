const P = {
  bg0:       "#100806",
  bg1:       "#1E1008",
  bg2:       "#2D1810",
  glow:      "#3D2014",
  cardBg:    "#1A0C07",
  cardSelBg: "#2A1810",
  gold:      "#D6A14D",
  goldSoft:  "#C89544",
  goldHi:    "#F0C36A",
  terra:     "#C46040",
  terraHi:   "#D97050",
  textMain:  "#EDE7DA",
  textMuted: "#CFC0A8",
  border:    "rgba(196,96,64,0.35)",
  borderSel: "#D6A14D",
};

const BENEFITS = [
  { icon: "🎧", text: "Acceso ilimitado a todas las sesiones" },
  { icon: "🌙", text: "Sección Descanso completa con historias y binaurales" },
  { icon: "🎙️", text: "Voz Interior — grabaciones ilimitadas" },
  { icon: "❤️", text: "Favoritos y diario ilimitados" },
  { icon: "⏱️", text: "Temporizador de sueño hasta 8 horas" },
  { icon: "⭐", text: "Contenido exclusivo para miembros" },
];

export function VarianteUno() {
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${P.bg0} 0%, ${P.bg1} 40%, ${P.bg2} 100%)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: P.textMain,
    }}>
      {/* Glow top */}
      <div style={{
        position: "absolute",
        top: 0, left: "20%", right: "20%",
        height: 220,
        background: `radial-gradient(ellipse at top, ${P.glow} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 390, padding: "48px 24px 32px", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1.5,
            color: P.gold,
            textTransform: "uppercase",
            marginBottom: 8,
            border: `1px solid ${P.border}`,
            borderRadius: 999,
            padding: "4px 14px",
          }}>
            Únete a la comunidad
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: "12px 0 4px", letterSpacing: 0.5 }}>
            Premium <span style={{ fontSize: 28 }}>⭐</span>
          </h1>
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${P.gold}, transparent)`, margin: "12px auto", maxWidth: 200 }} />
          <p style={{ fontSize: 14, color: P.textMuted, lineHeight: 1.6, margin: 0 }}>
            Comienza tu camino hacia el bienestar con más de 500 meditaciones y sonidos relajantes.
          </p>
        </div>

        {/* Preview images row */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {["🧘", "🔥", "🎵", "🌊"].map((e, i) => (
            <div key={i} style={{
              width: 70, height: 70,
              borderRadius: 14,
              background: P.cardSelBg,
              border: `1.5px solid ${P.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28,
              position: "relative",
            }}>
              {e}
              <span style={{ position: "absolute", top: 4, left: 4, fontSize: 14 }}>⭐</span>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {/* Anual */}
          <div style={{
            flex: 1,
            background: P.cardSelBg,
            border: `1.5px solid ${P.borderSel}`,
            borderRadius: 16,
            padding: "14px 12px",
            position: "relative",
            cursor: "pointer",
          }}>
            <div style={{
              position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
              background: P.terra,
              color: "#fff",
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              padding: "3px 10px", borderRadius: 999,
            }}>AHORRA 40%</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: P.textMain, textAlign: "center" }}>Anual</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: P.gold, textAlign: "center", margin: "4px 0" }}>$59.99</div>
            <div style={{ fontSize: 10, color: P.textMuted, textAlign: "center" }}>≈ $5/mes</div>
          </div>
          {/* Mensual */}
          <div style={{
            flex: 1,
            background: P.cardBg,
            border: `1px solid ${P.border}`,
            borderRadius: 16,
            padding: "14px 12px",
            cursor: "pointer",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: P.textMain, textAlign: "center" }}>Mensual</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: P.textMain, textAlign: "center", margin: "4px 0" }}>$8.99</div>
            <div style={{ fontSize: 10, color: P.textMuted, textAlign: "center" }}>por mes</div>
          </div>
        </div>

        {/* CTA */}
        <button style={{
          width: "100%",
          padding: "17px 0",
          borderRadius: 999,
          border: `1.5px solid ${P.gold}`,
          background: "transparent",
          color: P.gold,
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: 0.3,
          cursor: "pointer",
          marginBottom: 12,
        }}>
          Probar gratis 7 días
        </button>

        {/* Benefits */}
        <div style={{
          background: P.cardBg,
          border: `1px solid ${P.border}`,
          borderRadius: 18,
          padding: "16px 18px",
          marginBottom: 16,
        }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
              borderBottom: i < BENEFITS.length - 1 ? `1px solid rgba(196,96,64,0.12)` : "none" }}>
              <span style={{ fontSize: 16 }}>{b.icon}</span>
              <span style={{ fontSize: 13, color: P.textMuted }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* Color swatch label */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 18, height: 18, borderRadius: 999, background: P.terra }} />
            <div style={{ width: 18, height: 18, borderRadius: 999, background: P.gold }} />
            <div style={{ width: 18, height: 18, borderRadius: 999, background: P.bg2 }} />
            <span style={{ fontSize: 11, color: P.textMuted, marginLeft: 4 }}>Tierra Roja + Dorado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
