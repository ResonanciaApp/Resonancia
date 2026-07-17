import { useEffect, useState } from "react";

// Geometría exacta del botón real (EscenasThemeButton):
// viewBox 0 0 100, círculos r=24, separación en reposo dx=12 (cx 38/62, cy 50)
export const VB = 100;
export const R = 24;
export const REST_DX = 12;

// Tema "Inicio" real (scene-themes.ts): primer y último stop del degradado
const G0 = "#2D1C52";
const G1 = "#2D4082";

export function brighten(hex: string, factor = 1.5): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.min(255, Math.round(v * factor));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export const CRESCENT_TOP = brighten(G0);
export const CRESCENT_BOTTOM = brighten(G1);
export const LENS_TOP = brighten(G0, 1.5 * 1.4);
export const LENS_BOTTOM = brighten(G1, 1.5 * 1.4);

type Pt = { x: number; y: number };

/** Lente (intersección) genérica de dos círculos de igual radio. null = coinciden (círculo pleno). */
export function lensPath(c1: Pt, c2: Pt, r: number): string | null {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.6) return null;
  if (d >= 2 * r) return "";
  const h = Math.sqrt(r * r - (d / 2) * (d / 2));
  const mx = (c1.x + c2.x) / 2;
  const my = (c1.y + c2.y) / 2;
  const ux = dx / d;
  const uy = dy / d;
  const p1x = mx - uy * h;
  const p1y = my + ux * h;
  const p2x = mx + uy * h;
  const p2y = my - ux * h;
  return (
    `M ${p1x} ${p1y} A ${r} ${r} 0 0 1 ${p2x} ${p2y} ` +
    `A ${r} ${r} 0 0 1 ${p1x} ${p1y} Z`
  );
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** t ∈ [0,1] durante `dur` ms, luego pausa `pause` ms en t=1, y repite. */
export function useCycle(dur: number, pause: number): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const e = (now - start) % (dur + pause);
      setT(Math.min(1, e / dur));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dur, pause]);
  return t;
}

/** Marco oscuro común (fondo de Inicio) con el glifo centrado. */
export function Frame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8"
      style={{ background: "#1B060F" }}
    >
      <svg width={220} height={220} viewBox={`0 0 ${VB} ${VB}`}>
        {children}
      </svg>
      <div className="text-center px-6">
        <div style={{ color: "#F7CB6B", fontSize: 15, fontWeight: 600 }}>{title}</div>
        <div style={{ color: "#F4DAD5", opacity: 0.6, fontSize: 12, marginTop: 6, maxWidth: 320 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/** Defs de degradados compartidos (mismos ids en todas las variantes). */
export function VesicaDefs() {
  return (
    <defs>
      <linearGradient id="vCrescent" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={CRESCENT_TOP} />
        <stop offset="1" stopColor={CRESCENT_BOTTOM} />
      </linearGradient>
      <linearGradient id="vLens" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={LENS_TOP} />
        <stop offset="1" stopColor={LENS_BOTTOM} />
      </linearGradient>
      <radialGradient id="vGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Dibuja la vesica completa para dos centros dados, con brillo central opcional. */
export function VesicaGlyph({
  c1,
  c2,
  glow = 0,
  lensOpacity = 1,
  strokeOpacity = 0.5,
}: {
  c1: Pt;
  c2: Pt;
  glow?: number;
  lensOpacity?: number;
  strokeOpacity?: number;
}) {
  const lens = lensPath(c1, c2, R);
  const strokeW = 1 * (VB / 45); // 1 px a escala del botón real (45 px)
  return (
    <g>
      <circle cx={c1.x} cy={c1.y} r={R} fill="url(#vCrescent)" fillOpacity={0.35} />
      <circle cx={c2.x} cy={c2.y} r={R} fill="url(#vCrescent)" fillOpacity={0.35} />
      {lens === null ? (
        <circle cx={(c1.x + c2.x) / 2} cy={(c1.y + c2.y) / 2} r={R} fill="url(#vLens)" fillOpacity={lensOpacity} />
      ) : lens !== "" ? (
        <path d={lens} fill="url(#vLens)" fillOpacity={lensOpacity} />
      ) : null}
      {glow > 0 && (
        <circle
          cx={(c1.x + c2.x) / 2}
          cy={(c1.y + c2.y) / 2}
          r={R * 0.9}
          fill="url(#vGlow)"
          opacity={glow}
        />
      )}
      <circle cx={c1.x} cy={c1.y} r={R} stroke="#FFFFFF" strokeWidth={strokeW} fill="none" opacity={strokeOpacity} />
      <circle cx={c2.x} cy={c2.y} r={R} stroke="#FFFFFF" strokeWidth={strokeW} fill="none" opacity={strokeOpacity} />
    </g>
  );
}
