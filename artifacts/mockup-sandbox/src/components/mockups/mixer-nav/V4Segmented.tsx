import { useState } from "react";

const BG = "#0B0F14";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const PRIMARY = "#BE9650";

const CATS = [
  { id: "descanso", label: "Descanso" },
  { id: "meditacion", label: "Meditación" },
  { id: "enfoque", label: "Enfoque" },
];

const ALL_TABS = ["Popular", "Naturaleza", "Agua", "Cuencos Tibetanos", "Campanas", "Mantras", "Solfeggio", "Runas"];

export function V4Segmented() {
  const [activeCat, setActiveCat] = useState("descanso");
  const [activeTab, setActiveTab] = useState("Popular");
  const activeIdx = CATS.findIndex((c) => c.id === activeCat);

  return (
    <div style={{ background: BG, padding: "20px", fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ color: FG, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Mezclador</span>
          <span style={{ color: MUTED, fontSize: 18, marginTop: 3 }}>∨</span>
        </div>
        <span style={{ color: "#89C5E0", fontSize: 13, fontWeight: 500 }}>0/10 sonidos activos</span>
      </div>

      {/* Segmented control */}
      <div style={{
        position: "relative",
        display: "flex",
        background: "#151A23",
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* Sliding indicator */}
        <div
          style={{
            position: "absolute",
            top: 4,
            left: `calc(${activeIdx} * (100% - 8px) / 3 + 4px)`,
            width: "calc((100% - 8px) / 3)",
            bottom: 4,
            background: "rgba(190,150,80,0.18)",
            border: "1px solid rgba(190,150,80,0.40)",
            borderRadius: 9,
            transition: "left 0.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        {CATS.map((cat) => {
          const active = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{
                flex: 1,
                padding: "11px 8px",
                background: "transparent",
                border: "none",
                borderRadius: 9,
                cursor: "pointer",
                position: "relative",
                zIndex: 1,
                color: active ? PRIMARY : MUTED,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                letterSpacing: 0.2,
                transition: "color 0.15s",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Filtros — fila única scrollable */}
      <div style={{ overflowX: "auto", scrollbarWidth: "none", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, width: "max-content" }}>
          {ALL_TABS.map((t) => {
            const sel = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: "7px 13px",
                  background: sel ? "rgba(190,150,80,0.11)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${sel ? "rgba(190,150,80,0.40)" : "rgba(255,255,255,0.09)"}`,
                  borderRadius: 20,
                  cursor: "pointer",
                  color: sel ? PRIMARY : MUTED,
                  fontSize: 12,
                  fontWeight: sel ? 600 : 400,
                  whiteSpace: "nowrap",
                  transition: "all 0.12s",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.13)" }} />
    </div>
  );
}
