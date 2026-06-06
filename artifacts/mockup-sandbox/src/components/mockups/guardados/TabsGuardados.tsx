import { useState } from "react";
import { MoreVertical, Music, BarChart2, ChevronLeft } from "lucide-react";

const BG = "#0B0F14";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const GOLD = "#BE9650";
const ROW_BG = "rgba(255,255,255,0.06)";
const PILL_BG = "rgba(190,150,80,0.12)";
const PILL_BORDER = "rgba(190,150,80,0.45)";
const BORDER = "rgba(255,255,255,0.08)";

type TabId = "dormir" | "motivarme" | "concentracion";

function MoonIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" fill={color} />
    </svg>
  );
}

function ZenStonesIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30">
      <ellipse cx="15" cy="23.5" rx="8" ry="4.2" fill={color} opacity={0.95} />
      <ellipse cx="15.6" cy="16.5" rx="5.8" ry="3.3" fill={color} opacity={0.85} />
      <ellipse cx="14.8" cy="10.8" rx="3.8" ry="2.6" fill={color} opacity={0.75} />
    </svg>
  );
}

function MountainIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 19h18L14.5 8l-3.2 5L9 9.5 3 19z"
        fill={color}
      />
    </svg>
  );
}

const TABS: { id: TabId; label: string; Icon: typeof MoonIcon }[] = [
  { id: "dormir", label: "Descanso", Icon: MoonIcon },
  { id: "motivarme", label: "Meditación", Icon: ZenStonesIcon },
  { id: "concentracion", label: "Enfoque", Icon: MountainIcon },
];

type Mix = { id: string; name: string; thumbs: string[]; playing?: boolean };

const MIXES: Record<TabId, Mix[]> = {
  dormir: [
    { id: "d1", name: "Lluvia nocturna", thumbs: ["#2E4756", "#3A5C5A"], playing: true },
    { id: "d2", name: "Olas suaves", thumbs: ["#39506B", "#2F4658"] },
    { id: "d3", name: "Viento y cuenco", thumbs: ["#3D4A63"] },
  ],
  motivarme: [
    { id: "m1", name: "Mañana en calma", thumbs: ["#5A4156", "#6B4A5C"] },
    { id: "m2", name: "Respiración profunda", thumbs: ["#4A3D63", "#574266", "#3D4A63"] },
  ],
  concentracion: [
    { id: "c1", name: "Bosque profundo", thumbs: ["#3D4A2E", "#4A5C3A", "#2F4633"] },
    { id: "c2", name: "Río y pájaros", thumbs: ["#3A5648", "#2E4740"] },
  ],
};

function SoundStack({ thumbs }: { thumbs: string[] }) {
  const THUMB = 44;
  const SHIFT = 26;
  const visible = thumbs.slice(0, 2);
  const width = THUMB + Math.max(0, visible.length - 1) * SHIFT;
  return (
    <div style={{ position: "relative", height: THUMB, width, flexShrink: 0 }}>
      {visible.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: i * SHIFT,
            top: 0,
            zIndex: i,
            width: THUMB,
            height: THUMB,
            borderRadius: 10,
            overflow: "hidden",
            background: c,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        >
          <Music size={15} color="rgba(237,225,211,0.65)" />
        </div>
      ))}
    </div>
  );
}

function MixRow({ mix, isLast }: { mix: Mix; isLast: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 4px",
        borderBottom: isLast ? "none" : `1px solid rgba(30,39,51,1)`,
      }}
    >
      <SoundStack thumbs={mix.thumbs} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: FG,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {mix.name}
        </div>
        {mix.playing ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
            <BarChart2 size={12} color={GOLD} />
            <span style={{ fontSize: 12, color: GOLD }}>Reproduciendo</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
            {mix.thumbs.length} sonido{mix.thumbs.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      {mix.playing && <BarChart2 size={18} color={GOLD} style={{ marginRight: 2 }} />}
      <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MoreVertical size={20} color={MUTED} />
      </div>
    </div>
  );
}

export function TabsGuardados() {
  const [tab, setTab] = useState<TabId>("dormir");
  const mixes = MIXES[tab];

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: BG,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ padding: "52px 20px 16px" }}>
        {/* Botón retroceder */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            border: "none",
            cursor: "pointer",
            marginBottom: 14,
          }}
        >
          <ChevronLeft size={20} color={FG} />
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, color: FG }}>
          Mis Mezclas
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>Mezclas guardadas</div>
      </div>

      {/* Tab bar — 3 bloques iguales, ícono arriba */}
      <div style={{ display: "flex", gap: 10, padding: "0 16px 14px" }}>
        {TABS.map(({ id, label, Icon }) => {
          const sel = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                paddingTop: 14,
                paddingBottom: 12,
                borderRadius: 16,
                cursor: "pointer",
                background: sel ? PILL_BG : "rgba(255,255,255,0.03)",
                border: "none",
                transition: "all 0.18s ease",
              }}
            >
              <Icon color={sel ? GOLD : MUTED} size={26} />
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: 0.1,
                  color: sel ? FG : MUTED,
                  fontWeight: sel ? 700 : 400,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Separador */}
      <div style={{ height: 1, background: BORDER, margin: "0 16px 16px" }} />

      {/* Lista de mezclas — una debajo de otra */}
      <div style={{ flex: 1, padding: "0 16px" }}>
        {mixes.length > 0 ? (
          mixes.map((m, i) => <MixRow key={m.id} mix={m} isLast={i === mixes.length - 1} />)
        ) : (
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, paddingTop: 8 }}>
            Todavía no guardaste mezclas en esta categoría.
          </div>
        )}
      </div>
    </div>
  );
}
