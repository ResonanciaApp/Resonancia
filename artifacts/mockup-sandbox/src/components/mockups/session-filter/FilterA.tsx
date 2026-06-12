import { useState } from "react";

const BG = "#0B0F14";
const CHIP_IDLE = "rgba(255,255,255,0.06)";
const CHIP_ACTIVE = "#BE9650";
const CHIP_ACTIVE_TXT = "#0B0F14";

export default function FilterA() {
  const [tab, setTab] = useState<"todas" | "sesiones" | "musica">("sesiones");
  const [sub, setSub] = useState<"sono" | "med" | null>(null);

  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      {/* Label */}
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16, fontFamily: "sans-serif" }}>
        Variante A — Segmentos + divisor
      </p>

      {/* Tab row */}
      <div style={{ display: "flex", flexDirection: "row", gap: 6, alignItems: "center" }}>
        {(["todas", "sesiones", "musica"] as const).map(t => {
          const sel = t === tab;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              borderRadius: 20, padding: "0 12px", height: 32, border: "none", cursor: "pointer",
              background: sel ? CHIP_ACTIVE : CHIP_IDLE,
              color: sel ? CHIP_ACTIVE_TXT : "#fff",
              fontSize: 13, fontWeight: sel ? 600 : 400, fontFamily: "sans-serif",
              letterSpacing: 0.1, whiteSpace: "nowrap",
              transition: "background 0.15s",
            }}>
              {t === "todas" ? "Todas" : t === "sesiones" ? "Sesiones" : "Música"}
            </button>
          );
        })}

        {/* Single pill segmented — aparece al seleccionar Sesiones */}
        {tab === "sesiones" && (
          <div style={{
            display: "flex", flexDirection: "row", alignItems: "center",
            borderRadius: 20, overflow: "hidden",
            background: CHIP_IDLE, height: 32,
            animation: "fadeSlide 0.2s ease",
          }}>
            {(["sono", "med"] as const).map((s, i) => {
              const active = sub === s;
              return (
                <>
                  {i > 0 && (
                    <div key={`div-${s}`} style={{
                      width: 1, height: 18, background: "rgba(255,255,255,0.15)",
                      flexShrink: 0,
                    }} />
                  )}
                  <button key={s} onClick={() => setSub(sub === s ? null : s)} style={{
                    padding: "0 12px", height: 32, border: "none", cursor: "pointer",
                    background: active ? "#B6904D" : "transparent",
                    color: active ? CHIP_ACTIVE_TXT : "#fff",
                    fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: "sans-serif",
                    letterSpacing: 0.1, whiteSpace: "nowrap",
                    transition: "background 0.15s, color 0.15s",
                  }}>
                    {s === "sono" ? "Sonoterapia" : "Meditaciones"}
                  </button>
                </>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:translateX(0) } }`}</style>
    </div>
  );
}
