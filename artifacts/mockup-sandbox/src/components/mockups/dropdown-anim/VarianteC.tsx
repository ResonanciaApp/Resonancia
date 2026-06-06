import { useState } from "react";

const BG = "#0B0F14";
const CARD = "#0E141C";
const FG = "#EDE1D3";
const ACCENT = "#BE9650";
const MUTED = "#7A8FA8";
const LABELS = ["Popular", "Naturaleza", "Sintetiz."];

export function VarianteC() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        .pill-c { opacity: 0; transform: translateY(10px); transition: opacity 200ms ease, transform 200ms ease; pointer-events: none; }
        .pill-c.open { opacity: 1; transform: translateY(0px); pointer-events: auto; }
        .pill-c.open.d0 { transition-delay: 0ms; }
        .pill-c.open.d1 { transition-delay: 70ms; }
        .pill-c.open.d2 { transition-delay: 140ms; }
        .pill-c.close.d0 { transition-delay: 100ms; }
        .pill-c.close.d1 { transition-delay: 50ms; }
        .pill-c.close.d2 { transition-delay: 0ms; }
      `}</style>

      <div style={{ background: CARD, borderRadius: 16, padding: "20px 24px", width: 340 }}>
        <p style={{ color: MUTED, fontSize: 11, marginBottom: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Variante C — Stagger Cascade
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 38 }}>
          <button
            onClick={() => setOpen(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 0", flexShrink: 0 }}
          >
            <span style={{ color: FG, fontSize: 16, fontWeight: 600 }}>Mis</span>
            <span style={{ fontSize: 15 }}>🤍</span>
            <span style={{ color: MUTED, fontSize: 13 }}>{open ? "‹" : "›"}</span>
          </button>

          <div style={{ flex: 1, display: "flex", gap: 6 }}>
            {LABELS.map((label, i) => (
              <div
                key={label}
                className={`pill-c ${open ? "open" : "close"} d${i}`}
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
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: MUTED, fontSize: 11, marginTop: 20, lineHeight: 1.5 }}>
          Aparece de izquierda a derecha (70 ms entre c/u). Al cerrar se va en orden inverso.
        </p>
      </div>
    </div>
  );
}
