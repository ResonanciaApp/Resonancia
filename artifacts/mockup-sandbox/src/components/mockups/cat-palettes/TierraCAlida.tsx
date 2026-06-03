import { Disc2, Eye, Music, Mic2 } from "lucide-react";

const BG = "#060A0F";
const CARD = "#0E1520";

const cats = [
  { label: "Sonidos\nAncestales",  Icon: Disc2,  color: "#E8924A" },
  { label: "Meditaciones\nGuiadas", Icon: Eye,    color: "#C87BB5" },
  { label: "Música y\nSonidos",    Icon: Music,   color: "#52B87A" },
  { label: "Podcast",              Icon: Mic2,    color: "#7BAED6" },
];

const radii = [
  { borderRadius: "20px 6px 6px 6px" },
  { borderRadius: "6px 20px 6px 6px" },
  { borderRadius: "6px 6px 20px 6px" },
  { borderRadius: "6px 6px 6px 20px" },
];

export function TierraCAlida() {
  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", fontFamily: "system-ui, sans-serif" }}>
      <p style={{ color: "#BE9650", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Propuesta 1</p>
      <h2 style={{ color: "#EDE1D3", fontSize: 20, fontWeight: 700, marginBottom: 28, letterSpacing: 0.3 }}>Tierra Cálida</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 320 }}>
        {cats.map((cat, i) => (
          <div key={cat.label} style={{ background: CARD, ...radii[i], padding: "24px 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, minHeight: 120 }}>
            <cat.Icon size={28} color={cat.color} strokeWidth={1.8} />
            <span style={{ color: "#EDE1D3", fontSize: 12.5, fontWeight: 600, textAlign: "center", lineHeight: 1.4, whiteSpace: "pre-line" }}>{cat.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {cats.map(cat => (
          <div key={cat.color} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: cat.color }} />
            <span style={{ color: "#7A8FA8", fontSize: 10 }}>{cat.color}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
