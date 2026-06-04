const P = {
  bg0:       "#080408",
  bg1:       "#140810",
  bg2:       "#20101C",
  glow:      "#2E1028",
  cardBg:    "#120618",
  cardSelBg: "#201018",
  gold:      "#C9954A",
  goldSoft:  "#B88840",
  goldHi:    "#E5AE62",
  terra:     "#7A1525",
  terraHi:   "#961C30",
  copper:    "#B87333",
  textMain:  "#EDE3D2",
  textMuted: "#C8B898",
  border:    "rgba(200,149,74,0.25)",
  borderSel: "#C9954A",
};

const BENEFITS = [
  { icon: "🎧", text: "Acceso ilimitado a todas las sesiones" },
  { icon: "🌙", text: "Sección Descanso completa con historias y binaurales" },
  { icon: "🎙️", text: "Voz Interior — grabaciones ilimitadas" },
  { icon: "❤️", text: "Favoritos y diario ilimitados" },
  { icon: "⏱️", text: "Temporizador de sueño hasta 8 horas" },
  { icon: "⭐", text: "Contenido exclusivo para miembros" },
];

export function VarianteTres() {
  return (
    <div style={{
      minHeight: "100vh",
      background: P.bg0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0",
      fontFamily: "Georgia, 'Times New Roman', serif",
      color: P.textMain,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Subtle noise texture simulation via gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(ellipse at 30% 20%, ${P.glow} 0%, transparent 55%),
                     radial-gradient(ellipse at 80% 80%, rgba(140,74,36,0.2) 0%, transparent 50%)`,
        pointerEvents: "none",
      }} />

      {/* Decorative top border */}
      <div style={{ width: "100%", height: 2, background: `linear-gradient(90deg, transparent, ${P.copper}, ${P.gold}, ${P.copper}, transparent)` }} />

      <div style={{ width: "100%", maxWidth: 390, padding: "44px 24px 32px", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: P.copper, textTransform: "uppercase", marginBottom: 14, fontFamily: "system-ui" }}>
            Casa del Cuenco
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, margin: "0 0 4px", letterSpacing: 1, fontStyle: "italic" }}>
            Premium
          </h1>
          <span style={{ fontSize: 26 }}>⭐</span>
          {/* Ornamental divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", margin: "14px 0" }}>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${P.gold})` }} />
            <span style={{ color: P.gold, fontSize: 14 }}>✦</span>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${P.gold}, transparent)` }} />
          </div>
          <p style={{ fontSize: 14, color: P.textMuted, lineHeight: 1.7, margin: 0, fontFamily: "system-ui", fontStyle: "normal" }}>
            Comienza tu camino hacia el bienestar con más de 500 meditaciones y sonidos relajantes.
          </p>
        </div>

        {/* Preview images row */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {["🧘", "🔥", "🎵", "🌊"].map((e, i) => (
            <div key={i} style={{
              width: 70, height: 70,
              borderRadius: 12,
              background: P.cardSelBg,
              border: `1px solid rgba(200,149,74,0.3)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28,
              position: "relative",
              boxShadow: `inset 0 1px 0 rgba(200,149,74,0.15)`,
            }}>
              {e}
              <span style={{ position: "absolute", top: 4, left: 4, fontSize: 14 }}>⭐</span>
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{
            flex: 1,
            background: P.cardSelBg,
            border: `1px solid ${P.gold}`,
            borderRadius: 12,
            padding: "14px 12px",
            position: "relative",
            cursor: "pointer",
            boxShadow: `0 0 16px rgba(200,149,74,0.12)`,
          }}>
            <div style={{
              position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
              background: P.terra,
              color: P.goldHi,
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              padding: "3px 10px", borderRadius: 4,
              fontFamily: "system-ui",
            }}>AHORRA 40%</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: P.textMuted, textAlign: "center", letterSpacing: 1, textTransform: "uppercase", fontFamily: "system-ui" }}>Anual</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: P.gold, textAlign: "center", margin: "4px 0", fontFamily: "system-ui" }}>$59.99</div>
            <div style={{ fontSize: 10, color: P.textMuted, textAlign: "center", fontFamily: "system-ui" }}>≈ $5/mes</div>
          </div>
          <div style={{
            flex: 1,
            background: P.cardBg,
            border: `1px solid ${P.border}`,
            borderRadius: 12,
            padding: "14px 12px",
            cursor: "pointer",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: P.textMuted, textAlign: "center", letterSpacing: 1, textTransform: "uppercase", fontFamily: "system-ui" }}>Mensual</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: P.textMain, textAlign: "center", margin: "4px 0", fontFamily: "system-ui" }}>$8.99</div>
            <div style={{ fontSize: 10, color: P.textMuted, textAlign: "center", fontFamily: "system-ui" }}>por mes</div>
          </div>
        </div>

        {/* CTA */}
        <button style={{
          width: "100%",
          padding: "17px 0",
          borderRadius: 8,
          border: `1.5px solid ${P.gold}`,
          background: "transparent",
          color: P.gold,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: 1.5,
          cursor: "pointer",
          marginBottom: 12,
          textTransform: "uppercase",
          fontFamily: "system-ui",
          boxShadow: `inset 0 0 30px rgba(200,149,74,0.06), 0 2px 12px rgba(200,149,74,0.1)`,
        }}>
          Probar gratis 7 días
        </button>

        {/* Benefits */}
        <div style={{
          background: P.cardBg,
          border: `1px solid rgba(200,149,74,0.2)`,
          borderRadius: 12,
          padding: "16px 18px",
          marginBottom: 16,
          boxShadow: `inset 0 1px 0 rgba(200,149,74,0.08)`,
        }}>
          {BENEFITS.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0",
              borderBottom: i < BENEFITS.length - 1 ? `1px solid rgba(200,149,74,0.08)` : "none" }}>
              <span style={{ fontSize: 16 }}>{b.icon}</span>
              <span style={{ fontSize: 13, color: P.textMuted, fontFamily: "system-ui" }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* Swatch */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 18, height: 18, borderRadius: 999, background: P.terra }} />
            <div style={{ width: 18, height: 18, borderRadius: 999, background: P.copper }} />
            <div style={{ width: 18, height: 18, borderRadius: 999, background: P.gold }} />
            <span style={{ fontSize: 11, color: P.textMuted, marginLeft: 4, fontFamily: "system-ui" }}>Cobre Antiguo + Dorado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
