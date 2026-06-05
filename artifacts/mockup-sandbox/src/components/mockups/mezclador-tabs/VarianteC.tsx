import { TrendingUp, Wind, Bell, Sliders, Mic, Music2, Music, Radio, Volume2 } from "lucide-react";
import { useState } from "react";

const BG = "#0B0F14";
const CONTENT_BG = "#0E141C";
const GOLD = "#BE9650";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const CARD = "#151A23";
const BORDER = "rgba(255,255,255,0.07)";

const TABS = [
  { id: "popular", label: "Popular", icon: TrendingUp },
  { id: "naturaleza", label: "Naturaleza", icon: Wind },
  { id: "ancestrales", label: "Ancestrales", icon: Bell },
  { id: "sintetizadores", label: "Sintetizadores", icon: Sliders },
  { id: "voces", label: "Voces", icon: Mic },
];

const SUBTABS: Record<string, string[]> = {
  ancestrales: ["Cuencos Tibetanos", "Cuencos de Cuarzo", "Gongs", "Campanas de Viento"],
  naturaleza: ["Naturaleza", "Agua", "Ruidos"],
  sintetizadores: ["Solfeggio", "Frecuencias"],
};

const SOUNDS = ["Cuenco tibetano", "Cuenco grave", "Cuenco agudo", "Gong", "Gong planetario", "Campanas de viento"];
const ICONS = [Music2, Music, Volume2, Radio, Radio, Music];

export function VarianteC() {
  const [tab, setTab] = useState("ancestrales");
  const [sub, setSub] = useState("Cuencos Tibetanos");
  const subs = SUBTABS[tab] ?? [];

  return (
    <div style={{ background: CONTENT_BG, minHeight: "100vh", fontFamily: "system-ui, sans-serif", width: 390, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: BG, padding: "16px 20px 0" }}>
        <div style={{ marginBottom: 10 }}>
          <span style={{ color: MUTED, fontSize: 12 }}>Mi ♥ ∨</span>
        </div>

        {/* Main tabs — segmented control: una barra redondeada, icono arriba del texto */}
        <div style={{
          display: "flex", overflowX: "auto", scrollbarWidth: "none",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 18, padding: 4, gap: 2,
          marginBottom: 0,
        }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSub(SUBTABS[t.id]?.[0] ?? ""); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "8px 14px",
                  borderRadius: 14,
                  border: active ? `1px solid rgba(190,150,80,0.3)` : "1px solid transparent",
                  background: active ? "rgba(190,150,80,0.11)" : "transparent",
                  cursor: "pointer",
                  color: active ? FG : MUTED,
                  fontWeight: active ? 600 : 400,
                  fontSize: 11, whiteSpace: "nowrap", flex: "0 0 auto",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={18} color={active ? GOLD : MUTED} strokeWidth={1.8} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Sub-tabs: chips con acento borde-izquierdo dorado en activo */}
        {subs.length > 1 && (
          <div style={{ display: "flex", gap: 6, padding: "10px 0 10px", overflowX: "auto", scrollbarWidth: "none" }}>
            {subs.map((s) => {
              const active = sub === s;
              return (
                <button
                  key={s}
                  onClick={() => setSub(s)}
                  style={{
                    border: "none",
                    borderLeft: active ? `2px solid ${GOLD}` : `2px solid transparent`,
                    borderRadius: "0 8px 8px 0",
                    padding: "5px 12px 5px 10px",
                    background: active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                    color: active ? FG : MUTED,
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filler line */}
      <div style={{ height: 6, background: CONTENT_BG }} />

      {/* Contenido */}
      <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {SOUNDS.map((name, i) => {
          const Icon = ICONS[i];
          return (
            <div key={name} style={{ background: CARD, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 64, height: 64, borderRadius: 10, background: "rgba(190,150,80,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={26} color={GOLD} strokeWidth={1.5} />
              </div>
              <span style={{ color: FG, fontSize: 11, textAlign: "center" }}>{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
