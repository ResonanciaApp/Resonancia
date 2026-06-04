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

export function V5Subrayado() {
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

      {/* Categorías — tabs con subrayado (estilo texto) */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        marginBottom: 18,
        position: "relative",
      }}>
        {CATS.map((cat) => {
          const active = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{
                flex: 1,
                padding: "12px 4px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
                position: "relative",
                paddingBottom: 11,
              }}
            >
              <span style={{
                color: active ? FG : MUTED,
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                letterSpacing: 0.2,
              }}>
                {cat.label}
              </span>
              {active && (
                <div style={{
                  position: "absolute",
                  bottom: -1,
                  left: "20%",
                  right: "20%",
                  height: 2.5,
                  background: PRIMARY,
                  borderRadius: 2,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Label de categoría de sonidos */}
      <div style={{ color: MUTED, fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
        Tipo de sonido
      </div>

      {/* Filtros — chips pequeños, scroll horizontal */}
      <div style={{ overflowX: "auto", scrollbarWidth: "none", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, width: "max-content" }}>
          {ALL_TABS.map((t) => {
            const sel = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: "6px 13px",
                  background: sel ? PRIMARY : "transparent",
                  border: `1px solid ${sel ? PRIMARY : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  color: sel ? "#0B0F14" : MUTED,
                  fontSize: 12,
                  fontWeight: sel ? 700 : 400,
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
