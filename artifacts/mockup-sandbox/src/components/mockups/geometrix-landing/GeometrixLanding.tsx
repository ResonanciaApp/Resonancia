/**
 * Geometrix Landing — pantalla de bienvenida antes del modo creación
 * Paleta: navy #0B0F14 + dorado #BE9650
 * Formato: mobile 390×844
 */
import React, { useEffect, useState } from "react";

const BG = "#0B0F14";
const GOLD = "#BE9650";
const GOLD_DIM = "rgba(190,150,80,0.18)";
const GOLD_GLOW = "rgba(190,150,80,0.08)";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const BORDER = "rgba(190,150,80,0.18)";
const CARD_BG = "rgba(190,150,80,0.05)";

// ── Glifo hexagonal animado ──────────────────────────────────────────────────
function HexGlyph({ pulse }: { pulse: number }) {
  const cx = 80, cy = 80, r = 52;
  const inner = r * 0.62;

  // Vertices del hexágono
  const hexPts = (radius: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3 - Math.PI / 6;
      return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
    });

  const outer = hexPts(r);
  const mid = hexPts(inner);

  // Líneas del cubo 3D interno
  const cubeLines = [
    [mid[0], mid[3]], [mid[1], mid[4]], [mid[2], mid[5]], // diagonales largas
    [mid[0], mid[1]], [mid[1], mid[2]], [mid[2], mid[3]],
    [mid[3], mid[4]], [mid[4], mid[5]], [mid[5], mid[0]],
    [cx, cy, mid[0][0], mid[0][1]],
    [cx, cy, mid[2][0], mid[2][1]],
    [cx, cy, mid[4][0], mid[4][1]],
  ];

  const glow = 0.4 + pulse * 0.6;

  return (
    <svg width={160} height={160} viewBox="0 0 160 160" style={{ overflow: "visible" }}>
      {/* Outer glow */}
      <defs>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GOLD} stopOpacity={0.18 * glow} />
          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
        </radialGradient>
        <filter id="blur-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background glow disk */}
      <circle cx={cx} cy={cy} r={70} fill="url(#glowGrad)" />

      {/* Outer hexagon */}
      <polygon
        points={outer.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke={GOLD}
        strokeWidth={1.5}
        strokeOpacity={0.7 + pulse * 0.3}
        filter="url(#blur-glow)"
      />

      {/* Inner hexagon */}
      <polygon
        points={mid.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke={GOLD}
        strokeWidth={1}
        strokeOpacity={0.5}
      />

      {/* Cube edges */}
      {[
        [mid[0], mid[1]], [mid[1], mid[2]], [mid[2], mid[3]],
        [mid[3], mid[4]], [mid[4], mid[5]], [mid[5], mid[0]],
      ].map(([a, b], i) => (
        <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.4} />
      ))}
      {/* Center diagonals */}
      {[[0, 3], [1, 4], [2, 5]].map(([a, b], i) => (
        <line key={i} x1={mid[a][0]} y1={mid[a][1]} x2={mid[b][0]} y2={mid[b][1]} stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.3} />
      ))}

      {/* Inner hub lines */}
      {[0, 2, 4].map((i) => (
        <line key={i} x1={cx} y1={cy} x2={mid[i][0]} y2={mid[i][1]} stroke={GOLD} strokeWidth={1} strokeOpacity={0.6 * glow} filter="url(#blur-glow)" />
      ))}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill={GOLD} opacity={glow} />

      {/* Corner dots */}
      {outer.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill={GOLD} opacity={0.6 + pulse * 0.4} />
      ))}
    </svg>
  );
}

// ── Separador decorativo ─────────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28, paddingHorizontal: 24 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${BORDER})` }} />
      <div style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD, opacity: 0.5 }} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${BORDER})` }} />
    </div>
  );
}

// ── Card de menú ─────────────────────────────────────────────────────────────
function MenuCard({
  icon,
  title,
  subtitle,
  primary,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  primary?: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 18px",
        borderRadius: 14,
        border: `1px solid ${primary ? "rgba(190,150,80,0.4)" : BORDER}`,
        background: primary ? "rgba(190,150,80,0.1)" : CARD_BG,
        cursor: "pointer",
        transition: "all 0.15s",
        transform: pressed ? "scale(0.98)" : "scale(1)",
        opacity: pressed ? 0.85 : 1,
        marginBottom: 10,
      }}
    >
      {/* Icon container */}
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        border: `1px solid ${primary ? "rgba(190,150,80,0.5)" : "rgba(190,150,80,0.2)"}`,
        background: primary ? "rgba(190,150,80,0.12)" : "rgba(190,150,80,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: primary ? FG : FG, marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: MUTED }}>{subtitle}</div>
      </div>

      {/* Chevron */}
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={primary ? GOLD : MUTED} strokeWidth={2}>
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
}

// ── Íconos SVG ──────────────────────────────────────────────────────────────
function PlusIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round">
      <circle cx={12} cy={12} r={9} />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={1.8} strokeLinecap="round">
      <rect x={3} y={3} width={18} height={18} rx={3} />
      <rect x={7} y={3} width={10} height={7} rx={1} />
      <circle cx={12} cy={15} r={2.5} />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={1.8} strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={1.8} strokeLinecap="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

// ── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar() {
  const tabs = [
    { icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", active: false },
    { icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z", active: false },
    { icon: "M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12 8L16 12L12 16L8 12L12 8Z", active: true },
    { icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", active: false },
  ];
  return (
    <div style={{
      height: 74, borderTop: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(11,15,20,0.95)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "space-around",
      padding: "0 8px 8px",
    }}>
      {tabs.map((t, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 16px", cursor: "pointer" }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={t.active ? GOLD : MUTED} strokeWidth={1.8} strokeLinecap="round">
            <path d={t.icon} />
          </svg>
          {t.active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD }} />}
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export function GeometrixLanding() {
  const [animTime, setAnimTime] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setAnimTime((v) => v + 0.04), 50);
    return () => clearInterval(t);
  }, []);

  const pulse = (Math.sin(animTime) + 1) / 2; // 0..1

  return (
    <div style={{
      width: 390, height: 844, background: BG, display: "flex", flexDirection: "column",
      fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden", position: "relative",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Status bar */}
      <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 0 24px", flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* Signal bars */}
          <svg width={15} height={11} viewBox="0 0 15 11" fill={FG}>
            <rect x={0} y={6} width={3} height={5} rx={0.5} />
            <rect x={4} y={4} width={3} height={7} rx={0.5} />
            <rect x={8} y={2} width={3} height={9} rx={0.5} />
            <rect x={12} y={0} width={3} height={11} rx={0.5} />
          </svg>
          {/* WiFi */}
          <svg width={14} height={11} viewBox="0 0 14 11" fill="none" stroke={FG} strokeWidth={1.5}>
            <path d="M1 3.5C3.2 1.3 5.5 0 7 0s3.8 1.3 6 3.5" />
            <path d="M3 6C4.2 4.8 5.5 4 7 4s2.8.8 4 2" />
            <circle cx={7} cy={9} r={1.5} fill={FG} stroke="none" />
          </svg>
          {/* Battery */}
          <svg width={22} height={12} viewBox="0 0 22 12" fill="none">
            <rect x={0} y={1} width={19} height={10} rx={2} stroke={FG} strokeWidth={1} />
            <rect x={1.5} y={2.5} width={16} height={7} rx={1} fill={FG} />
            <path d="M20 4v4" stroke={FG} strokeWidth={1.5} strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Back button */}
      <div style={{ padding: "0 20px 0", marginBottom: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={FG} strokeWidth={2} strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </div>
      </div>

      {/* Hero: logo + title */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, paddingBottom: 20, position: "relative" }}>
        {/* Radial glow behind logo */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 260, height: 200,
          background: `radial-gradient(ellipse at 50% 40%, rgba(190,150,80,${0.08 + pulse * 0.07}), transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{ marginBottom: 12, filter: `drop-shadow(0 0 ${8 + pulse * 8}px rgba(190,150,80,0.5))` }}>
          <HexGlyph pulse={pulse} />
        </div>

        {/* Name */}
        <div style={{ fontSize: 28, fontWeight: 700, color: FG, letterSpacing: 6, marginBottom: 4 }}>
          GEOMETRIX
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: MUTED, letterSpacing: 4 }}>
          SACRED GEOMETRY
        </div>

        {/* Subtle line under */}
        <div style={{ width: 50, height: 1, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`, marginTop: 16, opacity: 0.5 }} />
      </div>

      {/* Menu cards */}
      <div style={{ flex: 1, padding: "0 22px", overflowY: "auto" }}>

        <MenuCard
          icon={<PlusIcon />}
          title="Crear Geometría"
          subtitle="Comienza desde cero"
          primary
        />
        <MenuCard
          icon={<SaveIcon />}
          title="Mis Creaciones"
          subtitle="Tus obras guardadas"
        />
        <MenuCard
          icon={<UsersIcon />}
          title="Comunidad"
          subtitle="Explora y comparte"
        />
        <MenuCard
          icon={<BookIcon />}
          title="Aprende"
          subtitle="Descubre y profundiza"
        />

        {/* Footer hint */}
        <div style={{ textAlign: "center", paddingTop: 10, paddingBottom: 8 }}>
          <div style={{ fontSize: 11, color: "rgba(122,143,168,0.5)", letterSpacing: 0.3 }}>
            Explora la geometría del universo
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <TabBar />
    </div>
  );
}
