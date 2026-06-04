import { useState } from "react";

const BG = "#0B0F14";
const CARD = "#151A23";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const PRIMARY = "#BE9650";

const CATS = [
  {
    id: "descanso",
    label: "Descanso",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
      </svg>
    ),
    color: "#4A7FA8",
  },
  {
    id: "meditacion",
    label: "Meditación",
    icon: (
      <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
        <ellipse cx="15" cy="23.5" rx="8" ry="4.2" fill="currentColor" opacity={0.95} />
        <ellipse cx="15.6" cy="16.5" rx="5.8" ry="3.3" fill="currentColor" opacity={0.85} />
        <ellipse cx="14.8" cy="10.8" rx="3.8" ry="2.6" fill="currentColor" opacity={0.75} />
      </svg>
    ),
    color: "#8B82BE",
  },
  {
    id: "enfoque",
    label: "Enfoque",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" />
      </svg>
    ),
    color: "#5B9E7A",
  },
];

const ALL_TABS = ["Popular", "Naturaleza", "Agua", "Cuencos Tibetanos", "Campanas", "Mantras", "Solfeggio", "Runas"];

export function V3Iconos() {
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

      {/* Categorías — ícono + etiqueta, 3 columnas iguales */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {CATS.map((cat) => {
          const active = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{
                flex: 1,
                padding: "14px 8px 12px",
                background: active ? `${cat.color}18` : CARD,
                border: `1.5px solid ${active ? cat.color : "rgba(255,255,255,0.09)"}`,
                borderRadius: 14,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
            >
              <span style={{ color: active ? cat.color : MUTED, display: "flex" }}>
                {cat.icon}
              </span>
              <span style={{
                color: active ? FG : MUTED,
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                letterSpacing: 0.2,
              }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtros — una fila */}
      <div style={{ overflowX: "auto", scrollbarWidth: "none", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, width: "max-content" }}>
          {ALL_TABS.map((t) => {
            const sel = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: "6px 13px",
                  background: sel ? "rgba(190,150,80,0.13)" : "transparent",
                  border: `1px solid ${sel ? `${PRIMARY}55` : "rgba(255,255,255,0.11)"}`,
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
      <div style={{ height: 1, background: "rgba(255,255,255,0.13)" }} />
    </div>
  );
}
