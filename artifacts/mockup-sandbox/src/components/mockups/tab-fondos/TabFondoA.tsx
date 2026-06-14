const TABS = [
  { id: "natural",    label: "Naturaleza",  icon: "🌿", color: "#3DAA70", glow: "rgba(61,170,112,0.55)" },
  { id: "ancestral",  label: "Ancestrales", icon: "🔔", color: "#D4741A", glow: "rgba(212,116,26,0.55)"  },
  { id: "digital",    label: "Digitales",   icon: "〜", color: "#2979FF", glow: "rgba(41,121,255,0.55)"  },
  { id: "binaural",   label: "Binaurales",  icon: "⚡", color: "#7B5FE8", glow: "rgba(123,95,232,0.55)" },
  { id: "voces",      label: "Voces",       icon: "🎙", color: "#D44F8A", glow: "rgba(212,79,138,0.55)" },
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
      position: "relative", overflow: "hidden",
      background: sel
        ? `radial-gradient(ellipse at 50% 60%, rgba(${r},${g},${b},0.22) 0%, rgba(${r},${g},${b},0.07) 55%, transparent 100%), #12060A`
        : UNSEL_BG,
      boxShadow: sel ? `0 0 18px 2px rgba(${r},${g},${b},0.28), 0 0 6px 0px rgba(${r},${g},${b},0.18)` : "none",
      border: sel ? `1px solid rgba(${r},${g},${b},0.20)` : "1px solid transparent",
      transition: "all 0.25s ease",
    }}>
      {sel && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 20,
          background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.09) 0%, transparent 55%)`,
          pointerEvents: "none",
        }} />
      )}
      <span style={{ fontSize: 18, lineHeight: 1, filter: sel ? `drop-shadow(0 0 6px rgba(${r},${g},${b},0.8))` : "none" }}>
        {tab.icon}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: 0.2, color: sel ? "#FFFFFF" : "rgba(255,255,255,0.40)",
        textAlign: "center", lineHeight: 1.2,
      }}>
        {tab.label}
      </span>
    </div>
  );
}

export function TabFondoA() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <p style={{ color: "rgba(244,218,213,0.40)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", margin: 0 }}>
        Opción A — Neblina Profunda
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {TABS.map((t, i) => <Tab key={t.id} tab={t} sel={i < 3} />)}
      </div>
      <p style={{ color: "rgba(244,218,213,0.25)", fontSize: 10, letterSpacing: 0.5, margin: 0, textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
        Degradado radial desde el color del tab · glow exterior muy sutil · borde translúcido
      </p>
    </div>
  );
}
