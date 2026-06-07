import { Sliders, Eye, Trash2 } from "lucide-react";
import { SeedGlyph } from "./SeedGlyph";

export function TokenGlow() {
  const options = [
    { icon: Sliders, label: "Personalizar", color: "#EDE1D3" },
    { icon: Eye, label: "Ver solo esta", color: "#EDE1D3" },
    { icon: Trash2, label: "Quitar", color: "#D98A8A" },
  ];
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#02030a" }}>
      <div
        className="flex items-center overflow-hidden"
        style={{
          gap: 18,
          padding: "14px 18px",
          borderRadius: 22,
          border: "1px solid #2c304f",
          background: "linear-gradient(180deg, #090D20 0%, #06070F 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div className="flex flex-col" style={{ width: 188 }}>
          {options.map((o, i) => {
            const Icon = o.icon;
            return (
              <button
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                style={{ borderRadius: 10 }}
              >
                <Icon size={17} color={o.color} strokeWidth={1.8} />
                <span style={{ color: o.color, fontSize: 14.5, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ width: 1, alignSelf: "stretch", background: "#2c304f", margin: "6px 0" }} />
        <div
          className="flex items-center justify-center"
          style={{
            width: 92,
            height: 92,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(190,150,80,0.16) 0%, rgba(190,150,80,0) 70%)",
            border: "1px solid rgba(190,150,80,0.22)",
          }}
        >
          <SeedGlyph size={60} color="#D6A85B" />
        </div>
      </div>
    </div>
  );
}
