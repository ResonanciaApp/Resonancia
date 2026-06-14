import { useEffect, useState } from "react";

const PLACEHOLDERS = [
  "¿Qué mágico mundo quieres crear hoy?",
  "Diseña tu paisaje sonoro ideal...",
  "Cada sonido, un portal hacia la calma",
  "Combina y crea tu ritual de bienestar",
];

const BG = "linear-gradient(to bottom, #2A1A06, #1E1204, #1B060F)";

export function PropuestaD() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setVisible(true);
      }, 500);
    }, 3200);
    return () => clearInterval(cycle);
  }, []);

  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
      <div style={{
        width: "100%", maxWidth: 660,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        background: "rgba(212,175,55,0.05)",
        borderRadius: 14,
        padding: "10px 16px",
        boxShadow: "0 0 0 1px rgba(212,175,55,0.12), 0 4px 24px rgba(212,175,55,0.07)",
      }}>
        <p style={{
          margin: 0, flex: 1,
          fontSize: 13, fontWeight: 400,
          color: `rgba(255,255,255,${visible ? 0.9 : 0})`,
          transition: "opacity 0.45s ease",
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.4,
        }}>
          {PLACEHOLDERS[idx]}
        </p>
        <button style={{
          flexShrink: 0,
          fontSize: 11, fontWeight: 600,
          color: "#1B060F",
          background: "linear-gradient(135deg, #D4AF37, #E9C46A)",
          border: "none",
          borderRadius: 20,
          padding: "7px 13px",
          cursor: "pointer",
          fontFamily: "system-ui, sans-serif",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 10px rgba(212,175,55,0.3)",
        }}>
          ¿Cómo te sientes?
        </button>
      </div>
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "system-ui" }}>
        D — Glow dorado
      </div>
    </div>
  );
}
