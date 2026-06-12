/**
 * Propuesta B — Crystal Nebula
 * Card "Crear Geometría": borde cristalino doble, nebulosa animada, estrella de 6 puntas como ícono.
 */
import { useEffect, useRef } from "react";

const BG     = "#0B0F14";
const BLUE   = "#6584d4";
const BLUE2  = "#c7caec";
const GOLD   = "#BE9650";
const FG     = "#EDE1D3";
const MUTED  = "#7A8FA8";

export default function PropB() {
  const nebulaRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let frame = 0;
    let raf: number;
    const tick = () => {
      frame++;
      const t = frame / 180; // ciclo lento ~3s
      // Nebulosa que respira
      if (nebulaRef.current) {
        const scale = 1 + 0.12 * Math.sin(t * Math.PI * 2);
        const opacity = 0.22 + 0.1 * Math.sin(t * Math.PI * 2);
        nebulaRef.current.style.transform = `scale(${scale})`;
        nebulaRef.current.style.opacity = String(opacity);
      }
      // Estrella giratoria lenta
      if (starRef.current) {
        const angle = (frame * 0.2) % 360;
        starRef.current.style.transform = `rotate(${angle}deg)`;
        starRef.current.style.transformOrigin = "29px 29px";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Estrella de 6 puntas (2 triángulos)
  const starPoints = (r: number, ri: number) => {
    return Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 - 90) * Math.PI / 180;
      const rad = i % 2 === 0 ? r : ri;
      return `${29 + rad * Math.cos(a)},${29 + rad * Math.sin(a)}`;
    }).join(" ");
  };

  return (
    <div style={{
      width: 390, height: 320, background: BG,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Card */}
      <div style={{
        width: 342,
        background: "rgba(8,14,36,0.95)",
        borderRadius: 20,
        padding: "18px 18px 20px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        position: "relative",
        overflow: "hidden",
        // Borde cristalino doble
        boxShadow: `
          0 0 0 1px rgba(101,132,212,0.5),
          0 0 0 3px rgba(101,132,212,0.08),
          inset 0 0 0 1px rgba(199,202,236,0.05),
          0 4px 40px rgba(101,132,212,0.18),
          0 8px 24px rgba(0,0,0,0.6)
        `,
      }}>
        {/* Nebulosa animada */}
        <div ref={nebulaRef} style={{
          position: "absolute", top: "50%", left: "55%",
          width: 200, height: 160,
          transform: "translate(-50%,-50%)",
          background: `radial-gradient(ellipse 100% 80% at 50% 50%, rgba(101,132,212,0.28) 0%, rgba(101,132,212,0.08) 45%, transparent 70%)`,
          pointerEvents: "none",
          transformOrigin: "center",
          filter: "blur(8px)",
        }} />

        {/* Líneas de cuadrícula sutil en el fondo */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          viewBox="0 0 342 90" preserveAspectRatio="none">
          {[0,1,2,3,4].map(i => (
            <line key={i} x1={i*86} y1={0} x2={i*86} y2={90}
              stroke={BLUE} strokeWidth={0.3} opacity={0.07} />
          ))}
          {[0,1,2].map(i => (
            <line key={i} x1={0} y1={i*45} x2={342} y2={i*45}
              stroke={BLUE} strokeWidth={0.3} opacity={0.07} />
          ))}
        </svg>

        {/* Partículas de luz */}
        {[
          { x: 220, y: 18, r: 1.5, op: 0.6 },
          { x: 290, y: 40, r: 1,   op: 0.4 },
          { x: 180, y: 60, r: 1.2, op: 0.5 },
          { x: 310, y: 65, r: 0.9, op: 0.3 },
        ].map((p, i) => (
          <div key={i} style={{
            position: "absolute", left: p.x, top: p.y,
            width: p.r * 2, height: p.r * 2, borderRadius: "50%",
            background: BLUE2, opacity: p.op,
            boxShadow: `0 0 4px ${BLUE2}`,
          }} />
        ))}

        {/* Ícono con estrella giratoria */}
        <div style={{ position: "relative", width: 58, height: 58, flexShrink: 0 }}>
          <svg width={58} height={58} viewBox="0 0 58 58"
            style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <filter id="star-glow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <radialGradient id="icon-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={BLUE} stopOpacity={0.25} />
                <stop offset="100%" stopColor={BLUE} stopOpacity={0.05} />
              </radialGradient>
            </defs>
            {/* Fondo del ícono */}
            <circle cx={29} cy={29} r={26} fill="url(#icon-bg)"
              stroke={BLUE} strokeWidth={0.8} opacity={0.6} />

            {/* Estrella giratoria */}
            <g ref={starRef} style={{ transformOrigin: "29px 29px" }}>
              <polygon points={starPoints(16, 8)}
                fill="none" stroke={BLUE} strokeWidth={0.7} opacity={0.5}
                filter="url(#star-glow)" />
            </g>

            {/* Plus estático encima */}
            <line x1={29} y1={21} x2={29} y2={37} stroke={BLUE2} strokeWidth={2.2} strokeLinecap="round" />
            <line x1={21} y1={29} x2={37} y2={29} stroke={BLUE2} strokeWidth={2.2} strokeLinecap="round" />

            {/* Punto dorado central */}
            <circle cx={29} cy={29} r={2.5} fill={GOLD} opacity={0.9} />
          </svg>
        </div>

        {/* Texto */}
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: FG, marginBottom: 4, letterSpacing: 0.2 }}>
            Crear Geometría
          </div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>
            Comienza desde cero
          </div>
          {/* Tag de acento */}
          <div style={{
            display: "inline-flex", marginTop: 6,
            background: "rgba(101,132,212,0.12)",
            border: "1px solid rgba(101,132,212,0.2)",
            borderRadius: 20, padding: "2px 8px",
          }}>
            <span style={{ fontSize: 10, color: BLUE2, letterSpacing: 0.5 }}>LIENZO VACÍO</span>
          </div>
        </div>

        {/* Chevron */}
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
          <polyline points="5,3 11,8 5,13" stroke={BLUE2} strokeWidth={1.8}
            strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
        </svg>
      </div>
    </div>
  );
}
