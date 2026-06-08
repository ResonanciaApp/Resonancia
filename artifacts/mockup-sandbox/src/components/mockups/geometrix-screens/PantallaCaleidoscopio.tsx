import { useEffect, useRef, useState, useCallback } from "react";

const NAVY = "#0B0F14";
const GOLD = "#BE9650";
const GOLD_DIM = "rgba(190,150,80,0.18)";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";

const THEMES = [
  { name: "Dorado",  colors: ["#BE9650", "#D6A85B", "#EDE1D3", "#7FD1C0", "#C8A870"] },
  { name: "Violeta", colors: ["#B69BE0", "#9B7FD4", "#D4B0F0", "#7AA8E0", "#C4A8F0"] },
  { name: "Mar",     colors: ["#4B9EFF", "#7FD1C0", "#7AA8E0", "#A0C8F0", "#50D0C0"] },
  { name: "Rosa",    colors: ["#E0989B", "#FF8B9A", "#F0C0C4", "#D670A0", "#FFAABB"] },
  { name: "Jade",    colors: ["#6BC47A", "#9BD6A8", "#7FD1C0", "#A0E0B0", "#50C870"] },
];

const SEG_OPTIONS = [4, 6, 8, 12, 16];

function drawSeed(
  ctx: CanvasRenderingContext2D,
  t: number,
  colors: string[],
  w: number,
  h: number,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  // Animated spiraling arms
  const arms = 6;
  for (let arm = 0; arm < arms; arm++) {
    const armPhase = (arm / arms) * Math.PI * 2;
    ctx.beginPath();
    ctx.strokeStyle = colors[arm % colors.length];
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.55;

    let first = true;
    for (let i = 0; i <= 120; i++) {
      const frac = i / 120;
      const r = frac * Math.min(w, h) * 0.48;
      const theta = armPhase + frac * Math.PI * 4 + t * 0.0006 * (arm % 2 === 0 ? 1 : -1);
      const x = w / 2 + r * Math.cos(theta);
      const y = h / 2 + r * Math.sin(theta);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Floating circles
  const N_CIRCLES = 9;
  for (let i = 0; i < N_CIRCLES; i++) {
    const phase = t * 0.0004 + i * (Math.PI * 2 / N_CIRCLES);
    const drift = t * 0.00025 + i * 1.1;
    const cx = w / 2 + Math.cos(phase * 1.3) * w * 0.38;
    const cy = h / 2 + Math.sin(phase * 0.85) * h * 0.38;
    const r = 5 + Math.abs(Math.sin(drift)) * 16;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = colors[(i + 2) % colors.length];
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
  }

  // Inner web — lines from center
  for (let i = 0; i < 8; i++) {
    const angle = t * 0.0003 + i * (Math.PI / 4);
    const len = Math.min(w, h) * 0.45;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w / 2 + Math.cos(angle) * len, h / 2 + Math.sin(angle) * len);
    ctx.strokeStyle = colors[i % colors.length];
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Polygonal shapes drifting
  const polys = [
    { sides: 6, r: 22, speed: 0.00035, offset: 0 },
    { sides: 4, r: 14, speed: -0.0005, offset: 1.5 },
    { sides: 3, r: 18, speed: 0.00028, offset: 3.0 },
  ];
  for (const p of polys) {
    const angle = t * p.speed + p.offset;
    const px = w / 2 + Math.cos(t * 0.0004 + p.offset) * w * 0.28;
    const py = h / 2 + Math.sin(t * 0.0003 + p.offset) * h * 0.28;
    ctx.beginPath();
    for (let j = 0; j <= p.sides; j++) {
      const a = angle + (j / p.sides) * Math.PI * 2;
      const x = px + Math.cos(a) * p.r;
      const y = py + Math.sin(a) * p.r;
      j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = colors[polys.indexOf(p) % colors.length];
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

function renderKaleidoscope(
  ctx: CanvasRenderingContext2D,
  seed: HTMLCanvasElement,
  N: number,
  cx: number,
  cy: number,
  radius: number,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // Dark background
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const wedge = (Math.PI * 2) / N;

  for (let i = 0; i < N; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(i * wedge);

    // Clip to wedge
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, 0, wedge);
    ctx.closePath();
    ctx.clip();

    // Mirror alternate segments across the shared edge
    if (i % 2 === 1) {
      // Reflect across the bisector of the wedge
      ctx.rotate(wedge / 2);
      ctx.scale(1, -1);
      ctx.rotate(-wedge / 2);
    }

    ctx.drawImage(seed, -cx, -cy);
    ctx.restore();
  }

  // Subtle vignette
  const vig = ctx.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius * 1.05);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function PantallaCaleidoscopio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seedRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const isDragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const seedOffset = useRef({ x: 0, y: 0 });

  const [segments, setSegments] = useState(8);
  const [themeIdx, setThemeIdx] = useState(0);
  const [speed, setSpeed] = useState(0.6);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const pausedRef = useRef(paused);
  const segmentsRef = useRef(segments);
  const speedRef = useRef(speed);
  const themeIdxRef = useRef(themeIdx);

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { segmentsRef.current = segments; }, [segments]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { themeIdxRef.current = themeIdx; }, [themeIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(W, H) * 0.52;

    // Offscreen seed canvas
    const seed = document.createElement("canvas");
    seed.width = W;
    seed.height = H;
    seedRef.current = seed;
    const seedCtx = seed.getContext("2d")!;

    const loop = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 32);
      lastTsRef.current = ts;
      if (!pausedRef.current) {
        tRef.current += dt * speedRef.current;
      }
      const t = tRef.current;
      const theme = THEMES[themeIdxRef.current];
      drawSeed(seedCtx, t + seedOffset.current.x * 0.8 + seedOffset.current.y * 0.4, theme.colors, W, H);
      renderKaleidoscope(ctx, seed, segmentsRef.current, cx, cy, radius);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Drag handlers (shift the seed pattern origin)
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    dragOrigin.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragOrigin.current.x;
    const dy = e.clientY - dragOrigin.current.y;
    seedOffset.current = {
      x: seedOffset.current.x + dx * 0.7,
      y: seedOffset.current.y + dy * 0.7,
    };
    dragOrigin.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onPointerUp = useCallback(() => { isDragging.current = false; }, []);

  const theme = THEMES[themeIdx];

  return (
    <div
      style={{
        width: 390, height: 844,
        background: NAVY,
        borderRadius: 40,
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Inter', sans-serif",
        userSelect: "none",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
      }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={390}
        height={844}
        style={{ position: "absolute", inset: 0, cursor: "crosshair" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={() => setShowControls((v) => !v)}
      />

      {/* Top bar */}
      {showControls && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "52px 20px 16px",
          background: "linear-gradient(to bottom, rgba(11,15,20,0.88) 0%, transparent 100%)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          zIndex: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 18,
            background: "rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            {/* Back arrow */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke={MUTED} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ color: FG, fontSize: 15, fontWeight: 600, letterSpacing: 0.3 }}>
              Caleidoscopio
            </div>
            <div style={{ color: MUTED, fontSize: 11, marginTop: 1 }}>
              {segments} segmentos · {theme.name}
            </div>
          </div>

          {/* Pause/play */}
          <button
            onClick={(e) => { e.stopPropagation(); setPaused((v) => !v); }}
            style={{
              width: 36, height: 36, borderRadius: 18,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {paused ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 2L11 7L3 12V2Z" fill={GOLD}/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="2" width="4" height="10" rx="1" fill={MUTED}/>
                <rect x="8" y="2" width="4" height="10" rx="1" fill={MUTED}/>
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Drag hint (shown briefly) */}
      {showControls && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none", zIndex: 5,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 26,
            border: `1.5px solid ${GOLD_DIM}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2V20M2 11H20M6 6L16 16M16 6L6 16" stroke="rgba(190,150,80,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      {showControls && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "20px 20px 36px",
          background: "linear-gradient(to top, rgba(11,15,20,0.95) 0%, rgba(11,15,20,0.8) 60%, transparent 100%)",
          zIndex: 10,
        }}>

          {/* Segments */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: MUTED, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Segmentos
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {SEG_OPTIONS.map((n) => {
                const on = segments === n;
                return (
                  <button
                    key={n}
                    onClick={(e) => { e.stopPropagation(); setSegments(n); }}
                    style={{
                      flex: 1, height: 36, borderRadius: 10,
                      background: on ? "rgba(190,150,80,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${on ? "rgba(190,150,80,0.6)" : "rgba(255,255,255,0.08)"}`,
                      color: on ? GOLD : MUTED,
                      fontSize: 14, fontWeight: on ? 700 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color themes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: MUTED, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Color
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {THEMES.map((th, i) => {
                const on = themeIdx === i;
                return (
                  <button
                    key={th.name}
                    onClick={(e) => { e.stopPropagation(); setThemeIdx(i); }}
                    style={{
                      flex: 1, height: 32, borderRadius: 8,
                      background: `linear-gradient(135deg, ${th.colors[0]}, ${th.colors[1]})`,
                      border: `2px solid ${on ? "white" : "transparent"}`,
                      cursor: "pointer",
                      boxShadow: on ? "0 0 0 1px rgba(255,255,255,0.2)" : "none",
                      opacity: on ? 1 : 0.55,
                      transition: "all 0.15s",
                    }}
                    title={th.name}
                  />
                );
              })}
            </div>
          </div>

          {/* Speed */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ color: MUTED, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                Velocidad
              </div>
              <div style={{ color: GOLD, fontSize: 11 }}>
                {speed < 0.35 ? "Lenta" : speed < 0.7 ? "Normal" : "Rápida"}
              </div>
            </div>
            {/* Custom track */}
            <div
              style={{ position: "relative", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setSpeed(v);
              }}
            >
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${speed * 100}%`,
                background: `linear-gradient(to right, rgba(190,150,80,0.4), ${GOLD})`,
                borderRadius: 2,
              }} />
              <div style={{
                position: "absolute", top: "50%",
                left: `${speed * 100}%`,
                transform: "translate(-50%, -50%)",
                width: 14, height: 14, borderRadius: 7,
                background: GOLD,
                boxShadow: "0 0 6px rgba(190,150,80,0.6)",
              }} />
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: 18,
              width: "100%", height: 46, borderRadius: 14,
              background: `linear-gradient(135deg, rgba(190,150,80,0.25), rgba(190,150,80,0.12))`,
              border: "1px solid rgba(190,150,80,0.4)",
              color: GOLD, fontSize: 14, fontWeight: 600,
              cursor: "pointer", letterSpacing: 0.3,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 11L7.5 5.5L13 11M7.5 5.5V13.5" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="1.5" y="1.5" width="12" height="3" rx="1" stroke={GOLD} strokeWidth="1.4"/>
            </svg>
            Guardar como fondo
          </button>
        </div>
      )}

      {/* Tap hint */}
      {!showControls && (
        <div style={{
          position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)",
          color: "rgba(237,225,211,0.3)", fontSize: 11, letterSpacing: 0.5,
          pointerEvents: "none", zIndex: 10,
        }}>
          toca para ver controles
        </div>
      )}
    </div>
  );
}
