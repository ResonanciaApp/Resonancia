import { Sliders, Eye, Trash2 } from "lucide-react";
import { SeedGlyph } from "./SeedGlyph";

export function Pildoras() {
  const options = [
    { icon: Sliders, label: "Personalizar", color: "#D6A85B", tint: "rgba(214,168,91,0.10)", border: "rgba(214,168,91,0.30)" },
    { icon: Eye, label: "Ver solo esta", color: "#EDE1D3", tint: "rgba(255,255,255,0.03)", border: "#2c304f" },
    { icon: Trash2, label: "Quitar", color: "#D98A8A", tint: "rgba(217,138,138,0.08)", border: "rgba(217,138,138,0.28)" },
  ];
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#02030a" }}>
      <div
        className="flex items-center gap-4 overflow-hidden"
        style={{
          padding: 16,
          borderRadius: 20,
          border: "1px solid #2c304f",
          background: "linear-gradient(180deg, #090D20 0%, #06070F 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div className="flex flex-col gap-2.5" style={{ width: 200 }}>
          {options.map((o, i) => {
            const Icon = o.icon;
            return (
              <button
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 text-left transition-transform hover:scale-[1.02]"
                style={{ borderRadius: 12, background: o.tint, border: `1px solid ${o.border}` }}
              >
                <Icon size={17} color={o.color} strokeWidth={1.8} />
                <span style={{ color: o.color, fontSize: 14.5, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ width: 1, alignSelf: "stretch", background: "#2c304f" }} />
        <div className="flex items-center justify-center" style={{ width: 96 }}>
          <SeedGlyph size={68} color="#BE9650" />
        </div>
      </div>
    </div>
  );
}
