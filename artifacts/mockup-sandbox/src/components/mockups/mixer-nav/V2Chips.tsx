import { useState } from "react";

const BG = "#0B0F14";
const CARD = "#151A23";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const PRIMARY = "#BE9650";

const CATS = [
  { id: "descanso", label: "Descanso" },
  { id: "meditacion", label: "Meditación" },
  { id: "enfoque", label: "Enfoque" },
];

const ALL_TABS = ["Popular", "Naturaleza", "Agua", "Cuencos Tibetanos", "Campanas", "Mantras", "Solfeggio", "Runas"];

export function V2Chips() {
  const [activeCat, setActiveCat] = useState("descanso");
  const [activeTab, setActiveTab] = useState("Popular");

  return (
    <div style={{ background: BG, padding: "20px", fontFamily: "system-ui, sans-serif", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ color: FG, fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Mezclador</span>
          <span style={{ color: MUTED, fontSize: 18, marginTop: 3 }}>∨</span>
        </div>
        <span style={{ color: "#89C5E0", fontSize: 13, fontWeight: 500 }}>0/10 sonidos activos</span>
      </div>

      {/* Categorías — chips compactos */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {CATS.map((cat) => {
          const active = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{
                padding: "9px 18px",
                background: active ? PRIMARY : "transparent",
                border: `1.5px solid ${active ? PRIMARY : "rgba(255,255,255,0.18)"}`,
                borderRadius: 50,
                cursor: "pointer",
                color: active ? "#0B0F14" : MUTED,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                letterSpacing: 0.2,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Divisor sutil */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 16 }} />

      {/* Filtros — fila única scrollable */}
      <div style={{ overflowX: "auto", scrollbarWidth: "none", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, width: "max-content" }}>
          {ALL_TABS.map((t) => {
            const sel = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: "6px 14px",
                  background: sel ? "rgba(190,150,80,0.12)" : "transparent",
                  border: `1px solid ${sel ? "rgba(190,150,80,0.45)" : "rgba(255,255,255,0.10)"}`,
                  borderRadius: 20,
                  cursor: "pointer",
                  color: sel ? PRIMARY : MUTED,
                  fontSize: 12,
                  fontWeight: sel ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.13)", margin: "4px 0 0" }} />
    </div>
  );
}
