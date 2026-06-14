import { Leaf, Bell, Waves } from "lucide-react";

const BG = "#1B060F";

const TABS = [
  { label: "Naturaleza", Icon: Leaf,  color: "#3DAA70" },
  { label: "Ancestrales", Icon: Bell,  color: "#D4741A" },
  { label: "Binaurales",  Icon: Waves, color: "#7B5FE8" },
];

function TabB({ label, Icon, color }: { label: string; Icon: any; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 85,
          height: 67,
          borderRadius: 20,
          background: `rgba(${hexToRgb(color)}, 0.10)`,
          border: `1.5px solid ${color}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          boxShadow: `0 0 14px ${color}60, 0 0 4px ${color}40, inset 0 0 12px ${color}18`,
          position: "relative",
        }}
      >
        {/* Punto de luz central sutil */}
        <div style={{
          position: "absolute",
          width: 40, height: 40, borderRadius: "50%",
          background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <Icon size={18} color={color} strokeWidth={2} style={{ filter: `drop-shadow(0 0 5px ${color}CC)` }} />
        <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 0.1, filter: `drop-shadow(0 0 4px ${color}99)` }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export function TabDisenoB() {
  return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 28, padding: 32,
    }}>
      <p style={{ color: "rgba(244,218,213,0.4)", fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
        Diseño B — Neón sobre oscuro
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        {TABS.map(t => <TabB key={t.label} {...t} />)}
      </div>
      <p style={{ color: "rgba(244,218,213,0.25)", fontSize: 10, letterSpacing: 0.5, textAlign: "center", maxWidth: 320 }}>
        Fondo oscuro · Borde coloreado · Glow exterior + interior · Ícono con halo
      </p>
    </div>
  );
}
