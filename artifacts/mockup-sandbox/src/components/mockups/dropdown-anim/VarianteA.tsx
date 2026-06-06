import { useState } from "react";

const BG = "#0B0F14";
const CARD = "#0E141C";
const FG = "#EDE1D3";
const ACCENT = "#BE9650";
const MUTED = "#7A8FA8";
const PILLS = ["Popular", "Naturaleza", "Sintetiz."];

export function VarianteA() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: CARD, borderRadius: 16, padding: "20px 24px", width: 340 }}>

        <p style={{ color: MUTED, fontSize: 11, marginBottom: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Variante A — Slide + Fade
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
            {PILLS.map((label, i) => (
              <div
                key={label}
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
                  opacity: open ? 1 : 0,
                  transform: open ? "translateX(0)" : "translateX(-18px)",
                  transition: `opacity 220ms ease ${i * 40}ms, transform 220ms ease ${i * 40}ms`,
                  pointerEvents: open ? "auto" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: MUTED, fontSize: 11, marginTop: 20, lineHeight: 1.5 }}>
          Todos aparecen deslizando desde la izquierda con fade simultáneo (offset de 40 ms por píldora).
        </p>
      </div>
    </div>
  );
}
