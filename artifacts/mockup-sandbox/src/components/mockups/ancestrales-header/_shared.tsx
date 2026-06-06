import { ArrowLeft, Search, ChevronRight, Disc, CircleDot, Layers, Bell, Music2, Boxes } from "lucide-react";
import type { ReactNode } from "react";

export const T = {
  bg: "#0B0F14",
  card: "#151A23",
  fg: "#EDE1D3",
  gold: "#BE9650",
  accent: "#D6A85B",
  icon: "#C4956A",
  sub: "#FFFFFF",
  muted: "#7A8FA8",
  border: "rgba(182,149,95,0.08)",
};

export function BowlIcon({ size = 32, color = T.icon }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5a9 5 0 0 0 18 0" />
      <ellipse cx="12" cy="10.5" rx="9" ry="2.6" />
      <path d="M12 4.2v3.6" />
      <circle cx="12" cy="3.2" r="1.1" fill={color} stroke="none" />
    </svg>
  );
}

export const CATS = [
  { tag: "Cuencos Tibetanos", Icon: Disc, count: 8 },
  { tag: "Cuencos de Cuarzo", Icon: CircleDot, count: 5 },
  { tag: "Mix de Cuencos", Icon: Layers, count: 6 },
  { tag: "Gongs", Icon: Bell, count: 4 },
  { tag: "Cuencos y Gongs", Icon: Music2, count: 3 },
  { tag: "Full Instrumentos", Icon: Boxes, count: 7 },
];

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
        paddingTop: 18,
      }}
    >
      {children}
    </div>
  );
}

export function BackBtn() {
  return (
    <div style={{ padding: "0 20px", marginBottom: 14 }}>
      <ArrowLeft size={22} color={T.fg} strokeWidth={2} />
    </div>
  );
}

export function SearchBar({ subtle }: { subtle?: boolean }) {
  return (
    <div style={{ padding: "0 20px", marginTop: 14, marginBottom: 26 }}>
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

export function CatList() {
  return (
    <div style={{ padding: "0 20px" }}>
      {CATS.map((c, i) => (
        <div
          key={c.tag}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 0",
            borderBottom: i < CATS.length - 1 ? `1px solid ${T.border}` : "none",
          }}
        >
          <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <c.Icon size={22} color={T.icon} strokeWidth={1.8} />
          </div>
          <span style={{ flex: 1, color: T.fg, fontSize: 15, fontWeight: 600, letterSpacing: 0.1 }}>{c.tag}</span>
          <span style={{ color: T.fg, fontSize: 13, fontWeight: 500, opacity: 0.85 }}>{c.count}</span>
          <ChevronRight size={17} color={T.fg} strokeWidth={2} style={{ opacity: 0.85 }} />
        </div>
      ))}
    </div>
  );
}
