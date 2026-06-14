import { useEffect, useState } from "react";

const PLACEHOLDERS = [
  "¿Qué mágico mundo quieres crear hoy?",
  "Diseña tu paisaje sonoro ideal...",
  "Cada sonido, un portal hacia la calma",
  "Combina y crea tu ritual de bienestar",
];

const BG = "linear-gradient(to bottom, #2A1A06, #1E1204, #1B060F)";

export function PropuestaB() {
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
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.13)",
        borderRadius: 14,
        padding: "10px 16px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
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
          color: "#E9C46A",
          background: "rgba(233,196,106,0.10)",
          border: "1px solid rgba(233,196,106,0.25)",
          borderRadius: 20,
          padding: "6px 12px",
          cursor: "pointer",
          fontFamily: "system-ui, sans-serif",
          whiteSpace: "nowrap",
          backdropFilter: "blur(8px)",
        }}>
          ¿Cómo te sientes?
        </button>
      </div>
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 10, fontFamily: "system-ui" }}>
        B — Glassmorphism
      </div>
    </div>
  );
}
