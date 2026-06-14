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

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 6, width: 80, height: 80, borderRadius: 20, cursor: "pointer",
      position: "relative", overflow: "visible",
      background: sel ? `rgba(${Math.floor(r*0.12)},${Math.floor(g*0.12)},${Math.floor(b*0.12)},1)` : UNSEL_BG,
      outline: sel ? `1.5px solid rgba(${r},${g},${b},0.50)` : "1.5px solid transparent",
      boxShadow: sel
        ? `0 0 0 3px rgba(${r},${g},${b},0.12), 0 0 20px 0px rgba(${r},${g},${b},0.22), inset 0 0 12px rgba(${r},${g},${b},0.06)`
        : "none",
      transition: "all 0.25s ease",
    }}>
      {sel && (
        <div style={{
          position: "absolute", inset: -1, borderRadius: 21,
          background: `conic-gradient(from 120deg at 70% 25%, rgba(${r},${g},${b},0.18) 0deg, transparent 90deg, transparent 270deg, rgba(${r},${g},${b},0.10) 360deg)`,
          pointerEvents: "none",
        }} />
      )}
      <span style={{
        fontSize: 18, lineHeight: 1, position: "relative",
        filter: sel ? `drop-shadow(0 0 5px rgba(${r},${g},${b},0.70))` : "none",
        opacity: sel ? 1 : 0.38,
      }}>
        {tab.icon}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: 0.2, position: "relative",
        color: sel ? `rgba(${r},${g},${b},1)` : "rgba(255,255,255,0.38)",
        textShadow: sel ? `0 0 12px rgba(${r},${g},${b},0.5)` : "none",
        textAlign: "center", lineHeight: 1.2,
      }}>
        {tab.label}
      </span>
    </div>
  );
}

export function TabFondoC() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <p style={{ color: "rgba(244,218,213,0.40)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>
        Opción C — Halo Periférico
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {TABS.map((t, i) => <Tab key={t.id} tab={t} sel={i < 3} />)}
      </div>
      <p style={{ color: "rgba(244,218,213,0.25)", fontSize: 10, letterSpacing: 0.5, margin: 0, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
        Ring exterior del color del tab · fondo muy oscuro · texto e ícono con glow propio
      </p>
    </div>
  );
}
