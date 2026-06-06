import { useState } from "react";

const BG = "#0B0F14";
const CARD = "#0E141C";
const FG = "#EDE1D3";
const ACCENT = "#BE9650";
const MUTED = "#7A8FA8";
const PILLS = ["Popular", "Naturaleza", "Sintetiz."];

export function VarianteB() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes bounceIn {
          0%   { transform: scale(0.5); opacity: 0; }
          60%  { transform: scale(1.08); opacity: 1; }
          80%  { transform: scale(0.96); }
          100% { transform: scale(1); opacity: 1; }
        }
        .pill-bounce {
          animation: bounceIn 320ms cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
      `}</style>

      <div style={{ background: CARD, borderRadius: 16, padding: "20px 24px", width: 340 }}>

        <p style={{ color: MUTED, fontSize: 11, marginBottom: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Variante B — Scale Bounce
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 38 }}>
          <button
            onClick={() => setOpen(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
          >
            <span style={{ color: FG, fontSize: 16, fontWeight: 600 }}>Mis</span>
            <span style={{ fontSize: 15 }}>🤍</span>
            <span style={{ color: MUTED, fontSize: 13 }}>{open ? "‹" : "›"}</span>
          </button>

          <div style={{ flex: 1, display: "flex", gap: 6, overflow: "hidden" }}>
            {open && PILLS.map((label, i) => (
              <div
                key={label}
                className="pill-bounce"
                style={{
                  flex: 1,
                  padding: "8px 6px",
                  borderRadius: 13,
                  border: `1px solid ${ACCENT}50`,
                  background: "rgba(255,255,255,0.05)",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: FG,
                  opacity: 0,
                  animationDelay: `${i * 55}ms`,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: MUTED, fontSize: 11, marginTop: 20, lineHeight: 1.5 }}>
          Cada píldora escala desde 0 con un rebote elástico (55 ms de offset entre cada una).
        </p>
      </div>
    </div>
  );
}
