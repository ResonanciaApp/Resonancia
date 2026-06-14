const TABS = [
  { id: "natural",    label: "Naturaleza",  icon: "🌿", color: "#3DAA70" },
  { id: "ancestral",  label: "Ancestrales", icon: "🔔", color: "#D4741A" },
  { id: "digital",    label: "Digitales",   icon: "〜", color: "#2979FF" },
  { id: "binaural",   label: "Binaurales",  icon: "⚡", color: "#7B5FE8" },
  { id: "voces",      label: "Voces",       icon: "🎙", color: "#D44F8A" },
];

const BG = "#1B060F";
const UNSEL_BG = "rgba(27,6,15,0.60)";

function Tab({ tab, sel }: { tab: typeof TABS[0]; sel: boolean }) {
  const base = tab.color;
  const r = parseInt(base.slice(1,3),16);
  const g = parseInt(base.slice(3,5),16);
  const b = parseInt(base.slice(5,7),16);

  const darkened = `rgba(${Math.floor(r*0.28)},${Math.floor(g*0.28)},${Math.floor(b*0.28)},1)`;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 6, width: 80, height: 80, borderRadius: 20, cursor: "pointer",
      position: "relative", overflow: "hidden",
      background: sel
        ? `linear-gradient(175deg, rgba(${r},${g},${b},0.06) 0%, rgba(${r},${g},${b},0.18) 100%), ${darkened}`
        : UNSEL_BG,
      borderBottom: sel ? `2px solid rgba(${r},${g},${b},0.65)` : "2px solid transparent",
      borderTop: "1px solid transparent",
      borderLeft: "1px solid transparent",
      borderRight: "1px solid transparent",
      transition: "all 0.25s ease",
    }}>
      {sel && (
        <>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "40%",
            background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)`,
            borderRadius: "20px 20px 0 0", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: 20,
            boxShadow: `inset 0 -1px 0 rgba(${r},${g},${b},0.35)`,
            pointerEvents: "none",
          }} />
        </>
      )}
      <span style={{ fontSize: 18, lineHeight: 1, opacity: sel ? 1 : 0.4 }}>{tab.icon}</span>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: 0.2,
        color: sel ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.38)",
        textAlign: "center", lineHeight: 1.2,
      }}>
        {tab.label}
      </span>
    </div>
  );
}

export function TabFondoB() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <p style={{ color: "rgba(244,218,213,0.40)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>
        Opción B — Cristal Tintado
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {TABS.map((t, i) => <Tab key={t.id} tab={t} sel={i < 3} />)}
      </div>
      <p style={{ color: "rgba(244,218,213,0.25)", fontSize: 10, letterSpacing: 0.5, margin: 0, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
        Fondo oscuro derivado del color · degradado vertical sutil · borde inferior acentuado
      </p>
    </div>
  );
}
