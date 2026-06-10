export function PerlaSuave() {
  const GOLD = "#BE9650";
  const DARK = "#1C1F28";
  const MUTED = "#7A7F96";
  const BORDER = "rgba(0,0,0,0.06)";

  const mainTabs = [
    { label: "Todos", active: true },
    { label: "Naturales" },
    { label: "Sagrados" },
    { label: "Digital" },
  ];

  const subTabs = ["Tibetanos", "Cuarzo", "Gongs", "Campanas", "Vientos"];

  const cards = [
    { label: "Cuencos de Cuarzo", sub: "12 min" },
    { label: "Gong Sagrado", sub: "18 min" },
    { label: "Bosque Profundo", sub: "Ilimitado" },
    { label: "Mar en Calma", sub: "Ilimitado" },
    { label: "Lluvia Nocturna", sub: "Ilimitado" },
    { label: "Mantras OM", sub: "22 min" },
  ];

  return (
    <div style={{
      width: 390,
      height: 780,
      background: "linear-gradient(160deg, #FDFCFA 0%, #F2EDEA 50%, #E8E2DD 100%)",
      fontFamily: "-apple-system, 'Helvetica Neue', sans-serif",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Subtle texture overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(ellipse at 80% 0%, rgba(190,150,80,0.06) 0%, transparent 60%), radial-gradient(ellipse at 20% 100%, rgba(190,150,80,0.04) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />

      {/* Status bar */}
      <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0, position: "relative" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <svg width="16" height="10" viewBox="0 0 16 10" fill={DARK}><rect x="0" y="3" width="3" height="7" rx="1"/><rect x="4.5" y="2" width="3" height="8" rx="1"/><rect x="9" y="0.5" width="3" height="9.5" rx="1"/><rect x="13.5" y="0" width="2.5" height="10" rx="1" opacity="0.3"/></svg>
          <svg width="16" height="11" viewBox="0 0 16 11" fill={DARK}><path d="M8 2.5C5.5 2.5 3.2 3.5 1.5 5.2L0 3.7C2.1 1.4 5 0 8 0s5.9 1.4 8 3.7L14.5 5.2C12.8 3.5 10.5 2.5 8 2.5z"/><path d="M8 6.5c-1.4 0-2.6.5-3.5 1.4L3 6.4C4.3 5.1 6.1 4.3 8 4.3s3.7.8 5 2.1L11.5 7.9C10.6 7 9.4 6.5 8 6.5z"/><circle cx="8" cy="10" r="1.5"/></svg>
        </div>
      </div>

      {/* Header */}
      <div style={{
        padding: "2px 20px 16px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexShrink: 0,
        position: "relative",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: GOLD }} />
            <span style={{ fontSize: 10.5, color: GOLD, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 600 }}>Mi Música</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: DARK, letterSpacing: -0.8, lineHeight: 1 }}>Mezclador</div>
        </div>
        <div style={{ display: "flex", gap: 10, paddingBottom: 3 }}>
          <div style={{ width: 38, height: 38, borderRadius: 14, background: "rgba(255,255,255,0.7)", border: `1px solid ${BORDER}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 14, background: "rgba(255,255,255,0.7)", border: `1px solid ${BORDER}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          </div>
        </div>
      </div>

      {/* Gold divider line */}
      <div style={{ height: 1, marginInline: 20, background: `linear-gradient(90deg, ${GOLD}40, ${GOLD}10, transparent)`, marginBottom: 12, flexShrink: 0 }} />

      {/* Main tabs */}
      <div style={{ display: "flex", gap: 7, paddingLeft: 20, paddingBottom: 10, flexShrink: 0 }}>
        {mainTabs.map((t) => (
          <div key={t.label} style={{
            paddingInline: 15,
            paddingBlock: 7,
            borderRadius: 999,
            background: t.active
              ? `linear-gradient(135deg, ${GOLD}, #A07B3A)`
              : "rgba(255,255,255,0.6)",
            border: `1px solid ${t.active ? "transparent" : BORDER}`,
            color: t.active ? "#FFFFFF" : MUTED,
            fontSize: 12.5,
            fontWeight: t.active ? 700 : 500,
            whiteSpace: "nowrap",
            boxShadow: t.active ? "0 2px 10px rgba(190,150,80,0.35)" : "0 1px 3px rgba(0,0,0,0.04)",
          }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, paddingLeft: 20, paddingBottom: 14, flexShrink: 0 }}>
        {subTabs.map((s, i) => (
          <div key={s} style={{
            paddingInline: 11,
            paddingBlock: 5,
            borderRadius: 999,
            background: i === 0 ? "rgba(255,255,255,0.85)" : "transparent",
            border: `1px solid ${i === 0 ? `${GOLD}60` : BORDER}`,
            color: i === 0 ? GOLD : MUTED,
            fontSize: 11,
            fontWeight: i === 0 ? 600 : 400,
            whiteSpace: "nowrap",
          }}>
            {s}
          </div>
        ))}
      </div>

      {/* Cards */}
      <div style={{ flex: 1, padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, alignContent: "start" }}>
        {cards.map((c, i) => (
          <div key={c.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              background: i % 3 === 0
                ? "linear-gradient(145deg, #FFFFFF, #F0ECE6)"
                : i % 3 === 1
                ? "linear-gradient(145deg, #F8F5F0, #EDE8E0)"
                : "linear-gradient(145deg, #F5F2EE, #E8E3DC)",
              border: `1.5px solid rgba(255,255,255,0.95)`,
              boxShadow: "0 3px 16px rgba(0,0,0,0.09), 0 0 0 1px rgba(190,150,80,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}08)`,
                border: `1px solid ${GOLD}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={GOLD} opacity="0.9"><polygon points="5 3 19 12 5 21 5 3"/></svg>
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
        color: GOLD,
        fontWeight: 600,
        opacity: 0.7,
      }}>
        Perla Suave
      </div>
    </div>
  );
}
