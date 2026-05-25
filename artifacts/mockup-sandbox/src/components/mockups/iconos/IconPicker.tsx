import { Sun, Wind, Eye, Compass, Heart } from "lucide-react";

const icons = [
  { name: "sun", label: "Sun", Icon: Sun },
  { name: "wind", label: "Wind", Icon: Wind },
  { name: "eye", label: "Eye", Icon: Eye },
  { name: "compass", label: "Compass", Icon: Compass },
  { name: "heart", label: "Heart", Icon: Heart },
];

export default function IconPicker() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#18110C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#9a7a5a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>
          Meditaciones Guiadas — elegí un icono
        </p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          {icons.map(({ name, label, Icon }) => (
            <div
              key={name}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                background: "#24160F",
                border: "1px solid rgba(198,155,79,0.2)",
                borderRadius: 16,
                padding: "28px 24px",
                width: 100,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#C69B4F")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(198,155,79,0.2)")}
            >
              <Icon size={36} color="#C69B4F" strokeWidth={1.5} />
              <span style={{ color: "#EDE1D3", fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>
                {label}
              </span>
              <span style={{ color: "#9a7a5a", fontSize: 10, letterSpacing: 0.3 }}>
                "{name}"
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
