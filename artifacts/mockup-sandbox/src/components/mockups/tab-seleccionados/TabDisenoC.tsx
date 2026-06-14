import { Leaf, Bell, Waves } from "lucide-react";

const BG = "#1B060F";

const TABS = [
  { label: "Naturaleza", Icon: Leaf,  color: "#3DAA70" },
  { label: "Ancestrales", Icon: Bell,  color: "#D4741A" },
  { label: "Binaurales",  Icon: Waves, color: "#7B5FE8" },
];

function TabC({ label, Icon, color }: { label: string; Icon: any; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 85,
          height: 67,
          borderRadius: 20,
          background: color,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          boxShadow: `0 0 28px ${color}90, 0 0 8px ${color}60, 0 6px 20px rgba(0,0,0,0.5)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Shimmer diagonal */}
        <div style={{
          position: "absolute", top: "-30%", left: "-30%",
          width: "80%", height: "80%",
          background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 60%)",
          borderRadius: "50%",
          pointerEvents: "none",
          transform: "rotate(-15deg)",
        }} />
        {/* Borde interior blanco sutil */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.20)",
          pointerEvents: "none",
        }} />
        <Icon size={18} color="rgba(255,255,255,0.95)" strokeWidth={2.2} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: 0.1 }}>
          {label}
        </span>
      </div>
    </div>
  );
}

export function TabDisenoC() {
  return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 28, padding: 32,
    }}>
      <p style={{ color: "rgba(244,218,213,0.4)", fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
        Diseño C — Sólido con halo exterior
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        {TABS.map(t => <TabC key={t.label} {...t} />)}
      </div>
      <p style={{ color: "rgba(244,218,213,0.25)", fontSize: 10, letterSpacing: 0.5, textAlign: "center", maxWidth: 320 }}>
        Color sólido · Shimmer diagonal · Borde interior blanco · Halo exterior difuso
      </p>
    </div>
  );
}
