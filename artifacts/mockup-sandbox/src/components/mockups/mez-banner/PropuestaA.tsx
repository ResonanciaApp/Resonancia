import { useEffect, useState } from "react";

const PLACEHOLDERS = [
  "¿Qué mágico mundo quieres crear hoy?",
  "Diseña tu paisaje sonoro ideal...",
  "Cada sonido, un portal hacia la calma",
  "Combina y crea tu ritual de bienestar",
];

const BG = "linear-gradient(to bottom, #2A1A06, #1E1204, #1B060F)";

export function PropuestaA() {
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
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        background: "rgba(255,255,255,0.03)",
        padding: "10px 16px",
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
          color: "#D4AF37",
          background: "rgba(212,175,55,0.10)",
          border: "1px solid rgba(212,175,55,0.22)",
          borderRadius: 20,
          padding: "6px 12px",
          cursor: "pointer",
          fontFamily: "system-ui, sans-serif",
          whiteSpace: "nowrap",
        }}>
          ¿Cómo te sientes?
        </button>
      </div>
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "system-ui" }}>
        A — Borde sutil
      </div>
    </div>
  );
}
