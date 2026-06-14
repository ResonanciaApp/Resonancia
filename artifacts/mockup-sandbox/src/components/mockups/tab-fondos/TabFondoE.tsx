const TABS = [
  { id: "natural",   label: "Naturaleza",  icon: "🌿", color: "#3DAA70" },
  { id: "ancestral", label: "Ancestrales", icon: "🔔", color: "#D4741A" },
  { id: "digital",   label: "Digitales",   icon: "〜", color: "#2979FF" },
  { id: "binaural",  label: "Binaurales",  icon: "⚡", color: "#7B5FE8" },
  { id: "voces",     label: "Voces",       icon: "🎙", color: "#D44F8A" },
];

const BG = "#1B060F";
const UNSEL_BG = "rgba(27,6,15,0.30)";

function Tab({ tab, sel }: { tab: typeof TABS[0]; sel: boolean }) {
  const c = tab.color;
  const r = parseInt(c.slice(1,3),16);
  const g = parseInt(c.slice(3,5),16);
  const b = parseInt(c.slice(5,7),16);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 6, width: 80, height: 80,
      borderRadius: 20, cursor: "pointer", position: "relative", overflow: "hidden",
      background: sel ? c : UNSEL_BG,
      border: sel ? `1px solid rgba(255,255,255,0.20)` : "1px solid transparent",
      boxShadow: sel
        ? `0 6px 20px rgba(${r},${g},${b},0.50), 0 2px 6px rgba(0,0,0,0.25)`
        : "none",
      transition: "all 0.2s ease",
    }}>
      {sel && (
        <>
          {/* Viga de luz ancha desde esquina sup-izq */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(135deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.10) 30%, transparent 58%)`,
            pointerEvents: "none",
          }} />
          {/* Oscurecimiento en esquina inf-der */}
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.14) 100%)`,
            pointerEvents: "none",
          }} />
          {/* Línea de brillo horizontal delgada en el tercio superior */}
          <div style={{
            position: "absolute", top: "22%", left: "10%", right: "10%", height: 1,
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 40%, rgba(255,255,255,0.35) 60%, transparent 100%)`,
            pointerEvents: "none",
          }} />
        </>
      )}
      <span style={{ fontSize: 18, lineHeight: 1, position: "relative",
        filter: sel ? "drop-shadow(0 1px 4px rgba(0,0,0,0.45))" : "none",
        opacity: sel ? 1 : 0.40 }}>{tab.icon}</span>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 0.3, position: "relative",
        color: sel ? "#FFFFFF" : "rgba(255,255,255,0.40)",
        textShadow: sel ? "0 1px 4px rgba(0,0,0,0.40)" : "none",
        textAlign: "center", lineHeight: 1.2,
      }}>{tab.label}</span>
    </div>
  );
}

export function TabFondoE() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 32, padding: 24,
      fontFamily: "system-ui, sans-serif" }}>
      <p style={{ color: "rgba(244,218,213,0.40)", fontSize: 11, letterSpacing: 1.5,
        textTransform: "uppercase", margin: 0 }}>Nuevo B — Viga de Luz</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {TABS.map((t, i) => <Tab key={t.id} tab={t} sel={i < 3} />)}
      </div>
      <p style={{ color: "rgba(244,218,213,0.25)", fontSize: 10, letterSpacing: 0.5, margin: 0,
        textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
        Color pleno · destello diagonal prominente + sombra exterior del propio color · línea de brillo sutil
      </p>
    </div>
  );
}
