import { Leaf, Bell, Waves } from "lucide-react";

const BG = "#1B060F";

const TABS = [
  { label: "Naturaleza", Icon: Leaf,  color: "#3DAA70", grad: ["#4DC88A", "#2E8A55"] },
  { label: "Ancestrales", Icon: Bell,  color: "#D4741A", grad: ["#E8943A", "#B05810"] },
  { label: "Binaurales",  Icon: Waves, color: "#7B5FE8", grad: ["#9B82F5", "#5A3DC8"] },
];

function TabA({ label, Icon, grad }: { label: string; Icon: any; grad: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 85,
          height: 67,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          boxShadow: `0 4px 16px ${grad[1]}55, 0 1px 3px rgba(0,0,0,0.4)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Brillo interior superior */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "45%",
          background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
          borderRadius: "20px 20px 0 0",
          pointerEvents: "none",
        }} />
        <Icon size={18} color="#1B060F" strokeWidth={2.2} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#1B060F", letterSpacing: 0.1 }}>
          {label}
        </span>
      </div>
    </div>
  );
}

export function TabDisenoA() {
  return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 28, padding: 32,
    }}>
      <p style={{ color: "rgba(244,218,213,0.4)", fontSize: 10, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
        Diseño A — Degradado sólido
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        {TABS.map(t => <TabA key={t.label} {...t} />)}
      </div>
      <p style={{ color: "rgba(244,218,213,0.25)", fontSize: 10, letterSpacing: 0.5, textAlign: "center", maxWidth: 320 }}>
        Gradiente diagonal · Brillo interior superior · Sombra de color · Ícono oscuro
      </p>
    </div>
  );
}
