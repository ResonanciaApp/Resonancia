export function MarmoBlanco() {
  const GOLD = "#BE9650";
  const DARK = "#1A1E2B";
  const MUTED = "#6B7A96";
  const BORDER = "rgba(0,0,0,0.07)";

  const mainTabs = [
    { label: "Todos", active: true },
    { label: "Naturales", color: "#5DA068" },
    { label: "Sagrados", color: "#C4A252" },
    { label: "Digital", color: "#5A9EC4" },
  ];

  const subTabs = ["Tibetanos", "Cuarzo", "Gongs", "Campanas", "Vientos"];

  const cards = [
    { label: "Cuencos de Cuarzo", sub: "12 min", icon: "○" },
    { label: "Gong Sagrado", sub: "18 min", icon: "◎" },
    { label: "Bosque Profundo", sub: "Ilimitado", icon: "⊛" },
    { label: "Mar en Calma", sub: "Ilimitado", icon: "〜" },
    { label: "Lluvia Nocturna", sub: "Ilimitado", icon: "◉" },
    { label: "Mantras OM", sub: "22 min", icon: "⊕" },
  ];

  return (
    <div style={{
      width: 390,
      height: 780,
      background: "linear-gradient(175deg, #FFFFFF 0%, #EFF2F7 55%, #E4E8EF 100%)",
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

      {/* Header */}
      <div style={{
        padding: "4px 20px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(12px)",
      }}>
        <div>
          <div style={{ fontSize: 11, color: MUTED, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 2 }}>Mi Música</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: DARK, letterSpacing: -0.5 }}>Mezclador</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          </div>
        </div>
      </div>

      {/* Main tabs */}
      <div style={{ padding: "12px 0 8px", display: "flex", gap: 8, paddingLeft: 20, flexShrink: 0, overflowX: "hidden" }}>
        {mainTabs.map((t) => (
          <div key={t.label} style={{
            paddingInline: 16,
            paddingBlock: 8,
            borderRadius: 999,
            background: t.active ? DARK : "rgba(0,0,0,0.05)",
            color: t.active ? "#FFFFFF" : MUTED,
            fontSize: 13,
            fontWeight: t.active ? 600 : 500,
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ padding: "0 0 12px", display: "flex", gap: 6, paddingLeft: 20, flexShrink: 0, overflowX: "hidden" }}>
        {subTabs.map((s, i) => (
          <div key={s} style={{
            paddingInline: 12,
            paddingBlock: 6,
            borderRadius: 999,
            background: i === 0 ? `${GOLD}18` : "transparent",
            border: `1px solid ${i === 0 ? GOLD : BORDER}`,
            color: i === 0 ? GOLD : MUTED,
            fontSize: 11.5,
            fontWeight: i === 0 ? 600 : 400,
            whiteSpace: "nowrap",
          }}>
            {s}
          </div>
        ))}
      </div>

      {/* Cards grid */}
      <div style={{ flex: 1, padding: "0 16px", overflowY: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignContent: "start" }}>
        {cards.map((c) => (
          <div key={c.label} style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}>
            <div style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              background: "linear-gradient(145deg, #FFFFFF, #E8ECF3)",
              border: `1.5px solid ${BORDER}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.9) inset",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: GOLD,
            }}>
              {c.icon}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: DARK, lineHeight: 1.3 }}>{c.label}</div>
              <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>{c.sub}</div>
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
        Mármol Blanco
      </div>
    </div>
  );
}
