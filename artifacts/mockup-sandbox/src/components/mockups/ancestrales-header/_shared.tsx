import { ArrowLeft, Search, Disc, Bell, BellRing, Wind, Play } from "lucide-react";
import type { ReactNode } from "react";

export const T = {
  bg: "#0B0F14",
  bgDeep: "#06070F",
  card: "#151A23",
  fg: "#EDE1D3",
  gold: "#BE9650",
  accent: "#D6A85B",
  icon: "#C4956A",
  sub: "#FFFFFF",
  muted: "#7A8FA8",
  border: "rgba(182,149,95,0.08)",
};

export const HERO_IMG = "/__mockup/images/ancestrales-hero.png";

export function BowlIcon({ size = 32, color = T.icon, stroke = 1.6 }: { size?: number; color?: string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5a9 5 0 0 0 18 0" />
      <ellipse cx="12" cy="10.5" rx="9" ry="2.6" />
      <path d="M12 4.2v3.6" />
      <circle cx="12" cy="3.2" r="1.1" fill={color} stroke="none" />
    </svg>
  );
}

export function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        width: "100%",
        fontFamily: "system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
}

/** Hero banner with a subtle zen fade into the app background. */
export function Hero({ h = 204, children }: { h?: number; children?: ReactNode }) {
  return (
    <div style={{ position: "relative", width: "100%", height: h, overflow: "hidden" }}>
      <img
        src={HERO_IMG}
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* subtle top scrim so the back button stays legible */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 96, background: "linear-gradient(to bottom, rgba(6,7,15,0.55), transparent)" }} />
      {/* gentle zen fade into the app background at the bottom */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, rgba(11,15,20,0.10) 0%, rgba(11,15,20,0) 30%, rgba(8,10,24,0.45) 66%, ${T.bg} 100%)` }} />
      {children}
    </div>
  );
}

export function BackBtnHero() {
  return (
    <div style={{ position: "absolute", top: 16, left: 18, zIndex: 3 }}>
      <ArrowLeft size={22} color={T.fg} strokeWidth={2} />
    </div>
  );
}

export function SearchBar({ subtle }: { subtle?: boolean }) {
  return (
    <div style={{ padding: "0 20px", marginTop: 16, marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: T.card,
          borderRadius: 14,
          padding: "11px 14px",
          border: subtle ? `1px solid ${T.border}` : "1px solid transparent",
        }}
      >
        <Search size={17} color={T.muted} strokeWidth={2} />
        <span style={{ color: T.muted, fontSize: 14 }}>Buscar en Ancestrales…</span>
      </div>
    </div>
  );
}

const TABS = [
  { label: "Cuencos", Icon: Disc, sel: true },
  { label: "Gongs", Icon: Bell, sel: false },
  { label: "Campanas", Icon: BellRing, sel: false },
  { label: "Vientos", Icon: Wind, sel: false },
];

export function Tabs() {
  return (
    <div style={{ display: "flex", gap: 8, padding: "0 20px", marginBottom: 18 }}>
      {TABS.map((t) => (
        <div
          key={t.label}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            padding: "10px 0",
            borderRadius: 14,
            background: t.sel ? "rgba(190,150,80,0.10)" : "transparent",
            border: t.sel ? "1px solid rgba(190,150,80,0.32)" : "1px solid transparent",
          }}
        >
          <t.Icon size={22} color={t.sel ? "#D6933A" : T.muted} strokeWidth={1.8} />
          <span style={{ color: "#FFFFFF", fontSize: 12, fontWeight: t.sel ? 700 : 400 }}>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

const SESSIONS = [
  { title: "Cuenco Tibetano · Raíz", sub: "Casa del Cuenco", dur: "18 min" },
  { title: "Frecuencia 432 Hz", sub: "Casa del Cuenco", dur: "25 min" },
  { title: "Mix de Cuencos Nocturno", sub: "Casa del Cuenco", dur: "40 min" },
];

export function SessionList() {
  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: T.muted, fontSize: 13, fontWeight: 500 }}>3 sesiones</span>
        <span style={{ color: T.gold, fontSize: 13, fontWeight: 600 }}>Más recientes</span>
      </div>
      {SESSIONS.map((s) => (
        <div key={s.title} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "linear-gradient(135deg, #2a2418, #4a3a1f)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Play size={18} color={T.accent} fill={T.accent} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: T.fg, fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{s.title}</div>
            <div style={{ color: T.muted, fontSize: 12 }}>{s.sub}</div>
          </div>
          <span style={{ color: T.muted, fontSize: 12, fontWeight: 500 }}>{s.dur}</span>
        </div>
      ))}
    </div>
  );
}
