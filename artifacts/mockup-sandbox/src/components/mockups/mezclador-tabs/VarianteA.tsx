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

export function VarianteA() {
  const [tab, setTab] = useState("ancestrales");
  const [sub, setSub] = useState("Cuencos Tibetanos");
  const subs = SUBTABS[tab] ?? [];

  return (
    <div style={{ background: CONTENT_BG, minHeight: "100vh", fontFamily: "system-ui, sans-serif", width: 390, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: BG, padding: "16px 20px 0" }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{ color: MUTED, fontSize: 12 }}>Mi ♥ ∨</span>
        </div>

        {/* Main tabs — icono inline izquierda + texto, activo en dorado */}
        <div style={{ display: "flex", overflowX: "auto", gap: 0, borderBottom: `1px solid ${BORDER}`, scrollbarWidth: "none" }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSub(SUBTABS[t.id]?.[0] ?? ""); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 16px 10px",
                  border: "none", background: "transparent", cursor: "pointer",
                  color: active ? GOLD : MUTED,
                  fontWeight: active ? 600 : 400,
                  fontSize: 13, letterSpacing: 0.2, whiteSpace: "nowrap",
                  borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Sub-tabs: pill con borde dorado sutil en activo */}
        {subs.length > 1 && (
          <div style={{ display: "flex", gap: 8, padding: "10px 0", overflowX: "auto", scrollbarWidth: "none" }}>
            {subs.map((s) => {
              const active = sub === s;
              return (
                <button
                  key={s}
                  onClick={() => setSub(s)}
                  style={{
                    border: `1px solid ${active ? GOLD : BORDER}`,
                    borderRadius: 20, padding: "5px 14px",
                    background: active ? "rgba(190,150,80,0.08)" : "rgba(255,255,255,0.05)",
                    color: active ? GOLD : MUTED,
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
