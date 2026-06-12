import { useState } from "react";

const BG = "#0B0F14";
const CHIP_IDLE = "rgba(255,255,255,0.06)";
const CHIP_ACTIVE = "#BE9650";
const CHIP_ACTIVE_TXT = "#0B0F14";
const THUMB_COLOR = "#B6904D";

export default function FilterB() {
  const [tab, setTab] = useState<"todas" | "sesiones" | "musica">("sesiones");
  const [sub, setSub] = useState<"sono" | "med" | null>(null);

  const thumbLeft = sub === "sono" ? 3 : sub === "med" ? "calc(50% + 1px)" : "-100%";

  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16, fontFamily: "sans-serif" }}>
        Variante B — Thumb deslizable
      </p>

      <div style={{ display: "flex", flexDirection: "row", gap: 6, alignItems: "center" }}>
        {(["todas", "sesiones", "musica"] as const).map(t => {
          const sel = t === tab;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              borderRadius: 20, padding: "0 12px", height: 32, border: "none", cursor: "pointer",
              background: sel ? CHIP_ACTIVE : CHIP_IDLE,
              color: sel ? CHIP_ACTIVE_TXT : "#fff",
              fontSize: 13, fontWeight: sel ? 600 : 400, fontFamily: "sans-serif",
              letterSpacing: 0.1, whiteSpace: "nowrap", transition: "background 0.15s",
            }}>
              {t === "todas" ? "Todas" : t === "sesiones" ? "Sesiones" : "Música"}
            </button>
          );
        })}

        {tab === "sesiones" && (
          <div style={{
            position: "relative", display: "flex", flexDirection: "row",
            borderRadius: 20, background: CHIP_IDLE, height: 32, overflow: "hidden",
            animation: "fadeSlide 0.2s ease",
          }}>
            {/* Thumb deslizable */}
            <div style={{
              position: "absolute", top: 3, left: thumbLeft,
              width: "calc(50% - 4px)", height: 26, borderRadius: 16,
              background: THUMB_COLOR,
              transition: "left 0.2s cubic-bezier(.4,0,.2,1)",
              pointerEvents: "none",
            }} />
            {(["sono", "med"] as const).map(s => (
              <button key={s} onClick={() => setSub(sub === s ? null : s)} style={{
                position: "relative", zIndex: 1,
                padding: "0 14px", height: 32, border: "none", cursor: "pointer",
                background: "transparent",
                color: sub === s ? CHIP_ACTIVE_TXT : "#fff",
                fontSize: 13, fontWeight: sub === s ? 600 : 400, fontFamily: "sans-serif",
                letterSpacing: 0.1, whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}>
                {s === "sono" ? "Sonoterapia" : "Meditaciones"}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:translateX(0) } }`}</style>
    </div>
  );
}
