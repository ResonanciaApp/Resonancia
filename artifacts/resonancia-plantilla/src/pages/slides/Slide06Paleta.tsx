const SWATCHES = [
  { name: "Primary", hex: "#BE9650" },
  { name: "Accent", hex: "#D6A85B" },
  { name: "Background", hex: "#0B0F14" },
  { name: "Card", hex: "#151A23" },
  { name: "Text", hex: "#EDE1D3" },
  { name: "Muted", hex: "#7A8FA8" },
];

export default function Slide06Paleta() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ backgroundColor: "#FFFFFF", color: "#0B0F14" }}
    >
      <div
        className="flex flex-col"
        style={{ width: "100vw", height: "100vh", padding: "10vh 8vw", boxSizing: "border-box" }}
      >
        {/* Eyebrow */}
        <div
          style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.14em", color: "#BE9650", marginBottom: "1.6vh" }}
        >
          RESONANCIA
        </div>

        {/* Headline */}
        <div
          style={{ fontSize: "4vw", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: "6vh" }}
        >
          Paleta de colores
        </div>

        {/* Swatches */}
        <div className="flex" style={{ gap: "2vw" }}>
          {SWATCHES.map((s) => (
            <div key={s.hex} className="flex flex-col" style={{ flex: 1, gap: "1.4vh" }}>
              <div
                style={{
                  backgroundColor: s.hex,
                  width: "100%",
                  height: "26vh",
                  borderRadius: "1vw",
                  border: "1px solid rgba(11,15,20,0.08)",
                }}
              />
              <div style={{ fontSize: "1.5vw", fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "#7A8FA8", letterSpacing: "0.04em" }}>
                {s.hex}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
