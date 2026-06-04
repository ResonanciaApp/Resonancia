const P = {
  bg0:       "#0C0408",
  bg1:       "#1A0812",
  bg2:       "#2A1020",
  glow:      "#3A1228",
  cardBg:    "#160610",
  cardSelBg: "#2A1020",
  gold:      "#E8B840",
  goldSoft:  "#D4A438",
  goldHi:    "#F5CE6A",
  terra:     "#8B1828",
  terraHi:   "#A82035",
  textMain:  "#F0E8DA",
  textMuted: "#D4C4A8",
  border:    "rgba(139,24,40,0.35)",
  borderSel: "#E8B840",
};

const BENEFITS = [
  { icon: "🎧", text: "Acceso ilimitado a todas las sesiones" },
  { icon: "🌙", text: "Sección Descanso completa con historias y binaurales" },
  { icon: "🎙️", text: "Voz Interior — grabaciones ilimitadas" },
  { icon: "❤️", text: "Favoritos y diario ilimitados" },
  { icon: "⏱️", text: "Temporizador de sueño hasta 8 horas" },
  { icon: "⭐", text: "Contenido exclusivo para miembros" },
];

export function VarianteDos() {
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${P.bg0} 0%, ${P.bg1} 50%, ${P.bg2} 100%)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0",
      fontFamily: "system-ui, -apple-system, sans-serif",
      color: P.textMain,
    }}>
      {/* Side glow */}
      <div style={{
        position: "absolute",
        top: "10%", right: "-10%",
        width: 260, height: 260,
        background: `radial-gradient(circle, ${P.glow} 0%, transparent 70%)`,
        pointerEvents: "none",
        borderRadius: "50%",
      }} />

      <div style={{ width: "100%", maxWidth: 390, padding: "48px 24px 32px", position: "relative" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ height: 1, width: 40, background: `linear-gradient(90deg, transparent, ${P.terra})` }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: P.terra, letterSpacing: 2, textTransform: "uppercase" }}>Membresía</span>
            <div style={{ height: 1, width: 40, background: `linear-gradient(90deg, ${P.terra}, transparent)` }} />
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, margin: "0 0 4px", letterSpacing: 0.5 }}>
            <span style={{ color: P.gold }}>Premium</span> <span style={{ fontSize: 28 }}>⭐</span>
          </h1>
          <div style={{ height: 1.5, background: `linear-gradient(90deg, transparent, ${P.terra}, ${P.gold}, ${P.terra}, transparent)`, margin: "12px auto", maxWidth: 220 }} />
          <p style={{ fontSize: 14, color: P.textMuted, lineHeight: 1.6, margin: 0 }}>
            Comienza tu camino hacia el bienestar con más de 500 meditaciones y sonidos relajantes.
          </p>
        </div>

        {/* Preview images row */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
          {["🧘", "🔥", "🎵", "🌊"].map((e, i) => (
            <div key={i} style={{
              width: 70, height: 70,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${P.cardSelBg}, ${P.cardBg})`,
              border: `1.5px solid ${i === 0 ? P.terra : P.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28,
              position: "relative",
              boxShadow: i === 0 ? `0 0 12px rgba(181,104,58,0.3)` : "none",
            }}>
              {e}
              {i < 3 && <span style={{ position: "absolute", top: 4, left: 4, fontSize: 14 }}>⭐</span>}
            </div>
          ))}
        </div>

        {/* Plan selector */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{
            flex: 1,
            background: `linear-gradient(135deg, ${P.cardSelBg}, ${P.glow})`,
            border: `1.5px solid ${P.terra}`,
            borderRadius: 16,
            padding: "14px 12px",
            position: "relative",
            cursor: "pointer",
            boxShadow: `0 4px 20px rgba(181,104,58,0.2)`,
          }}>
            <div style={{
              position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
              background: `linear-gradient(90deg, ${P.terra}, ${P.gold})`,
              color: "#fff",
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              padding: "3px 10px", borderRadius: 999,
            }}>MEJOR VALOR</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: P.textMain, textAlign: "center" }}>Anual</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: P.gold, textAlign: "center", margin: "4px 0" }}>$59.99</div>
            <div style={{ fontSize: 10, color: P.textMuted, textAlign: "center" }}>≈ $5/mes</div>
          </div>
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
          border: "none",
          background: `linear-gradient(90deg, ${P.terra}, ${P.gold})`,
          color: "#fff",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: 0.3,
          cursor: "pointer",
          marginBottom: 12,
          boxShadow: `0 4px 20px rgba(181,104,58,0.4)`,
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
              borderBottom: i < BENEFITS.length - 1 ? `1px solid rgba(181,104,58,0.10)` : "none" }}>
              <span style={{ fontSize: 16 }}>{b.icon}</span>
              <span style={{ fontSize: 13, color: P.textMuted }}>{b.text}</span>
            </div>
          ))}
        </div>

        {/* Swatch */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 18, height: 18, borderRadius: 999, background: P.terra }} />
            <div style={{ width: 18, height: 18, borderRadius: 999, background: P.gold }} />
            <div style={{ width: 18, height: 18, borderRadius: 999, background: P.bg2 }} />
            <span style={{ fontSize: 11, color: P.textMuted, marginLeft: 4 }}>Adobe + Ámbar Dorado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
