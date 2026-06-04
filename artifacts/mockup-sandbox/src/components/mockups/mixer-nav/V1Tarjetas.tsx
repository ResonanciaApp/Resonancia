import { useState } from "react";

const BG = "#0B0F14";
const CARD = "#151A23";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const PRIMARY = "#BE9650";
const BORDER = "rgba(255,255,255,0.10)";

const CATS = [
  { id: "descanso", label: "Descanso", accent: "#4A7FA8" },
  { id: "meditacion", label: "Meditación", accent: "#8B82BE" },
  { id: "enfoque", label: "Enfoque", accent: "#5B9E7A" },
];

const TABS_ROW1 = ["Popular", "Naturaleza", "Agua", "Cuencos Tibetanos", "Campanas"];
const TABS_ROW2 = ["Mantras", "Solfeggio", "Runas", "Lluvias", "Frecuencias"];

export function V1Tarjetas() {
  const [activeCat, setActiveCat] = useState("descanso");
  const [activeTab, setActiveTab] = useState("Popular");

  return (
    <div style={{ background: BG, padding: "20px", fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>

      {/* Header hint */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ color: FG, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Mezclador</span>
          <span style={{ color: MUTED, fontSize: 18, marginTop: 3 }}>∨</span>
        </div>
        <span style={{ color: "#89C5E0", fontSize: 13, fontWeight: 500 }}>0/10 sonidos activos</span>
      </div>

      {/* Categorías — tarjetas grandes */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {CATS.map((cat) => {
          const active = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{
                flex: 1,
                padding: "18px 12px",
                background: active ? CARD : CARD,
                border: `1px solid ${active ? cat.accent : BORDER}`,
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.15s",
                boxShadow: active ? `0 0 0 1px ${cat.accent}33` : "none",
              }}
            >
              <span style={{
                color: active ? FG : MUTED,
                fontSize: 14,
                fontWeight: active ? 700 : 600,
                textAlign: "center",
                letterSpacing: 0.1,
              }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabs — 2 filas scroll */}
      <div style={{ overflowX: "auto", scrollbarWidth: "none", marginBottom: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "max-content" }}>
          {[TABS_ROW1, TABS_ROW2].map((row, ri) => (
            <div key={ri} style={{ display: "flex", gap: 14 }}>
              {row.map((t) => {
                const sel = activeTab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    style={{
                      padding: "7px 12px",
                      background: "transparent",
                      border: `1px solid ${sel ? "rgba(237,225,211,0.55)" : "rgba(255,255,255,0.12)"}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      color: sel ? FG : MUTED,
                      fontSize: 13,
                      fontWeight: sel ? 600 : 400,
                      letterSpacing: 0.2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.13)", margin: "8px 0 0" }} />

      <div style={{ marginTop: 12, color: MUTED, fontSize: 12, textAlign: "center", opacity: 0.5 }}>— actual —</div>
    </div>
  );
}
