const TABS = [
  { id: "natural",   label: "Naturaleza",  icon: "🌿", color: "#3DAA70" },
  { id: "ancestral", label: "Ancestrales", icon: "🔔", color: "#D4741A" },
  { id: "digital",   label: "Digitales",   icon: "〜", color: "#2979FF" },
  { id: "binaural",  label: "Binaurales",  icon: "⚡", color: "#7B5FE8" },
  { id: "voces",     label: "Voces",       icon: "🎙", color: "#D44F8A" },
];

const BG = "#1B060F";
const UNSEL_BG = "rgba(27,6,15,0.30)";

function brighten(hex: string, amount: number) {
  const r = Math.min(255, parseInt(hex.slice(1,3),16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3,5),16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5,7),16) + amount);
  return `rgb(${r},${g},${b})`;
}

function darken(hex: string, amount: number) {
  const r = Math.max(0, parseInt(hex.slice(1,3),16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3,5),16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5,7),16) - amount);
  return `rgb(${r},${g},${b})`;
}

function Tab({ tab, sel }: { tab: typeof TABS[0]; sel: boolean }) {
  const c = tab.color;
  const r = parseInt(c.slice(1,3),16);
  const g = parseInt(c.slice(3,5),16);
  const b = parseInt(c.slice(5,7),16);
  const light = brighten(c, 50);
  const dark  = darken(c, 24);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 6, width: 80, height: 80,
      borderRadius: 20, cursor: "pointer", position: "relative", overflow: "hidden",
      background: sel
        ? `radial-gradient(ellipse at 50% 40%, ${light} 0%, ${c} 55%, ${dark} 100%)`
        : UNSEL_BG,
      border: sel ? `1px solid rgba(255,255,255,0.22)` : "1px solid transparent",
      boxShadow: sel
        ? `0 0 24px 4px rgba(${r},${g},${b},0.35), 0 4px 12px rgba(0,0,0,0.22)`
        : "none",
      transition: "all 0.2s ease",
    }}>
      {sel && (
        <>
          {/* Anillo interior translúcido claro */}
          <div style={{
            position: "absolute", inset: 3, borderRadius: 17,
            border: `1px solid rgba(255,255,255,0.15)`,
            pointerEvents: "none",
          }} />
          {/* Destello blanco en parte superior */}
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
            background: `radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.20) 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
        </>
      )}
      <span style={{ fontSize: 18, lineHeight: 1, position: "relative",
        filter: sel ? "drop-shadow(0 0 5px rgba(255,255,255,0.3)) drop-shadow(0 1px 3px rgba(0,0,0,0.4))" : "none",
        opacity: sel ? 1 : 0.40 }}>{tab.icon}</span>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 0.3, position: "relative",
        color: sel ? "#FFFFFF" : "rgba(255,255,255,0.40)",
        textShadow: sel ? "0 1px 4px rgba(0,0,0,0.35)" : "none",
        textAlign: "center", lineHeight: 1.2,
      }}>{tab.label}</span>
    </div>
  );
}

export function TabFondoF() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 32, padding: 24,
      fontFamily: "system-ui, sans-serif" }}>
      <p style={{ color: "rgba(244,218,213,0.40)", fontSize: 11, letterSpacing: 1.5,
        textTransform: "uppercase", margin: 0 }}>Nuevo C — Aura</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {TABS.map((t, i) => <Tab key={t.id} tab={t} sel={i < 3} />)}
      </div>
      <p style={{ color: "rgba(244,218,213,0.25)", fontSize: 10, letterSpacing: 0.5, margin: 0,
        textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
        Color pleno · degradado radial más claro en el centro → más oscuro en bordes · halo exterior del color
      </p>
    </div>
  );
}
