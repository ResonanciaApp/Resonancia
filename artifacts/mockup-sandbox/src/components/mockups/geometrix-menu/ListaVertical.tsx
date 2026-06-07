import { Sliders, Eye, Trash2 } from "lucide-react";
import { SeedGlyph } from "./SeedGlyph";

export function ListaVertical() {
  const options = [
    { icon: Sliders, label: "Personalizar", color: "#EDE1D3" },
    { icon: Eye, label: "Ver solo esta", color: "#EDE1D3" },
    { icon: Trash2, label: "Quitar", color: "#D98A8A" },
  ];
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#02030a" }}>
      <div
        className="flex items-stretch overflow-hidden"
        style={{
          width: 340,
          borderRadius: 18,
          border: "1px solid #2c304f",
          background: "linear-gradient(180deg, #090D20 0%, #06070F 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div className="flex flex-col py-2 flex-1">
          {options.map((o, i) => {
            const Icon = o.icon;
            return (
              <button
                key={i}
                className="flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.04]"
              >
                <Icon size={18} color={o.color} strokeWidth={1.8} />
                <span style={{ color: o.color, fontSize: 15, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ width: 1, background: "#2c304f", margin: "16px 0" }} />
        <div className="flex items-center justify-center px-6">
          <SeedGlyph size={64} color="#BE9650" />
        </div>
      </div>
    </div>
  );
}
