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

function Tab({ tab, sel }: { tab: typeof TABS[0]; sel: boolean }) {
  const c = tab.color;
  const light = brighten(c, 38);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 6, width: 80, height: 80,
      borderRadius: 20, cursor: "pointer", position: "relative", overflow: "hidden",
      background: sel ? c : UNSEL_BG,
      border: sel ? `1px solid rgba(255,255,255,0.18)` : "1px solid transparent",
      boxShadow: sel ? `0 4px 16px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06)` : "none",
      transition: "all 0.2s ease",
    }}>
      {sel && (
        <>
          {/* Capa satín — dos diagonales sutiles superpuestas */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(118deg, rgba(255,255,255,0.22) 0%, transparent 45%)`,
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(118deg, transparent 35%, rgba(0,0,0,0.10) 100%)`,
            pointerEvents: "none",
          }} />
          {/* Hilo de luz sutil perpendicular */}
          <div style={{
            position: "absolute", top: 0, left: "20%", width: "30%", height: "100%",
            background: `linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 60%)`,
            pointerEvents: "none",
          }} />
        </>
      )}
      <span style={{ fontSize: 18, lineHeight: 1, position: "relative",
        filter: sel ? "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" : "none",
        opacity: sel ? 1 : 0.40 }}>{tab.icon}</span>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 0.3, position: "relative",
        color: sel ? "#FFFFFF" : "rgba(255,255,255,0.40)",
        textShadow: sel ? "0 1px 3px rgba(0,0,0,0.35)" : "none",
        textAlign: "center", lineHeight: 1.2,
      }}>{tab.label}</span>
    </div>
  );
}

export function TabFondoD() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 32, padding: 24,
      fontFamily: "system-ui, sans-serif" }}>
      <p style={{ color: "rgba(244,218,213,0.40)", fontSize: 11, letterSpacing: 1.5,
        textTransform: "uppercase", margin: 0 }}>Nuevo A — Satín</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {TABS.map((t, i) => <Tab key={t.id} tab={t} sel={i < 3} />)}
      </div>
      <p style={{ color: "rgba(244,218,213,0.25)", fontSize: 10, letterSpacing: 0.5, margin: 0,
        textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
        Color pleno · dos diagonales superpuestas crean textura tela/satín · borde blanco sutil
      </p>
    </div>
  );
}
