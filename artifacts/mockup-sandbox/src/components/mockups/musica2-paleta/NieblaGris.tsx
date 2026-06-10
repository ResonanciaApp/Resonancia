export function NieblaGris() {
  const GOLD = "#BE9650";
  const DARK = "#1E2330";
  const MUTED = "#7480A0";
  const SURFACE = "#ECEEF3";
  const BORDER = "rgba(0,0,0,0.09)";

  const mainTabs = [
    { label: "Todos", active: true },
    { label: "Naturales" },
    { label: "Sagrados" },
    { label: "Digital" },
  ];

  const subTabs = ["Tibetanos", "Cuarzo", "Gongs", "Campanas", "Vientos"];

  const cards = [
    { label: "Cuencos de Cuarzo", sub: "12 min", color: "#C0D4E8" },
    { label: "Gong Sagrado", sub: "18 min", color: "#D4C9B0" },
    { label: "Bosque Profundo", sub: "Ilimitado", color: "#B8D4BC" },
    { label: "Mar en Calma", sub: "Ilimitado", color: "#B0CDD4" },
    { label: "Lluvia Nocturna", sub: "Ilimitado", color: "#C8C0D8" },
    { label: "Mantras OM", sub: "22 min", color: "#D4C4B0" },
  ];

  return (
    <div style={{
      width: 390,
      height: 780,
      background: "linear-gradient(170deg, #F4F6FA 0%, #EAECF2 40%, #DDE0E8 100%)",
      fontFamily: "-apple-system, 'Helvetica Neue', sans-serif",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Status bar */}
      <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <svg width="16" height="10" viewBox="0 0 16 10" fill={DARK}><rect x="0" y="3" width="3" height="7" rx="1"/><rect x="4.5" y="2" width="3" height="8" rx="1"/><rect x="9" y="0.5" width="3" height="9.5" rx="1"/><rect x="13.5" y="0" width="2.5" height="10" rx="1" opacity="0.3"/></svg>
          <svg width="16" height="11" viewBox="0 0 16 11" fill={DARK}><path d="M8 2.5C5.5 2.5 3.2 3.5 1.5 5.2L0 3.7C2.1 1.4 5 0 8 0s5.9 1.4 8 3.7L14.5 5.2C12.8 3.5 10.5 2.5 8 2.5z"/><path d="M8 6.5c-1.4 0-2.6.5-3.5 1.4L3 6.4C4.3 5.1 6.1 4.3 8 4.3s3.7.8 5 2.1L11.5 7.9C10.6 7 9.4 6.5 8 6.5z"/><circle cx="8" cy="10" r="1.5"/></svg>
        </div>
      </div>

      {/* Header with glass card style */}
      <div style={{
        margin: "0 14px 12px",
        padding: "14px 16px",
        borderRadius: 18,
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(16px)",
        border: `1px solid rgba(255,255,255,0.9)`,
        boxShadow: "0 1px 12px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 2 }}>Mi Música</div>
          <div style={{ fontSize: 21, fontWeight: 700, color: DARK, letterSpacing: -0.4 }}>Mezclador</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["search", "filter"].map((_, i) => (
            <div key={i} style={{ width: 38, height: 38, borderRadius: 12, background: SURFACE, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {i === 0
                ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              }
            </div>
          ))}
        </div>
      </div>

      {/* Main tabs */}
      <div style={{ display: "flex", gap: 8, paddingLeft: 14, paddingBottom: 10, flexShrink: 0 }}>
        {mainTabs.map((t) => (
          <div key={t.label} style={{
            paddingInline: 16,
            paddingBlock: 8,
            borderRadius: 999,
            background: t.active ? DARK : "rgba(255,255,255,0.55)",
            border: `1px solid ${t.active ? "transparent" : BORDER}`,
            color: t.active ? "#FFFFFF" : MUTED,
            fontSize: 13,
            fontWeight: t.active ? 600 : 500,
            whiteSpace: "nowrap",
            boxShadow: t.active ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
          }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, paddingLeft: 14, paddingBottom: 14, flexShrink: 0 }}>
        {subTabs.map((s, i) => (
          <div key={s} style={{
            paddingInline: 12,
            paddingBlock: 5,
            borderRadius: 999,
            background: i === 0 ? "rgba(255,255,255,0.8)" : "transparent",
            border: `1px solid ${i === 0 ? GOLD : BORDER}`,
            color: i === 0 ? GOLD : MUTED,
            fontSize: 11,
            fontWeight: i === 0 ? 600 : 400,
            whiteSpace: "nowrap",
            boxShadow: i === 0 ? "0 1px 6px rgba(190,150,80,0.15)" : "none",
          }}>
            {s}
          </div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ flex: 1, padding: "0 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignContent: "start" }}>
        {cards.map((c) => (
          <div key={c.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
            <div style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${c.color}, ${c.color}80)`,
              border: `2px solid rgba(255,255,255,0.8)`,
              boxShadow: "0 3px 14px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: DARK, lineHeight: 1.3 }}>{c.label}</div>
              <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Label */}
      <div style={{
        position: "absolute",
        bottom: 14,
        left: 0, right: 0,
        textAlign: "center",
        fontSize: 10,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: MUTED,
        fontWeight: 600,
      }}>
        Niebla Gris
      </div>
    </div>
  );
}
