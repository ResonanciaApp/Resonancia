import { Eye, Moon, Sparkles, Wind, Feather } from "lucide-react";

const OPTIONS = [
  { icon: Eye,       label: "Eye",       num: 1 },
  { icon: Moon,      label: "Moon",      num: 2 },
  { icon: Sparkles,  label: "Sparkles",  num: 3 },
  { icon: Wind,      label: "Wind",      num: 4 },
  { icon: Feather,   label: "Feather",   num: 5 },
];

const COLOR = "#C8B4E0";
const BG    = "linear-gradient(135deg, #4A3260, #251633)";

export default function IconosMeditacion() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#18110C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
        {OPTIONS.map(({ icon: Icon, label, num }) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {/* Category pill — same style as the app */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: BG,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${COLOR}33`,
              }}
            >
              <Icon size={28} color={COLOR} strokeWidth={1.5} />
            </div>
            <span style={{ color: COLOR, fontSize: 12, fontWeight: 600 }}>{num}. {label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
