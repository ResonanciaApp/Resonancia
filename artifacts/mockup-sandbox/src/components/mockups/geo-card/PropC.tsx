/**
 * Propuesta C — Pulso Luminoso
 * Card "Crear Geometría": borde que pulsa como luz, flor de vida translúcida de fondo,
 * gradiente vertical azul marino profundo.
 */
import { useEffect, useRef } from "react";

const BG     = "#0B0F14";
const BLUE   = "#6584d4";
const BLUE2  = "#c7caec";
const FG     = "#EDE1D3";
const MUTED  = "#7A8FA8";

/** Flor de Vida simplificada como SVG de fondo */
function FlowerBg({ size, color }: { size: number; color: string }) {
  const cx = size / 2, cy = size / 2;
  const r  = size * 0.18;
  const centers: [number,number][] = [
    [cx, cy],
    ...[0,60,120,180,240,300].map((a): [number,number] => [
      cx + r * 2 * Math.cos((a * Math.PI) / 180),
      cy + r * 2 * Math.sin((a * Math.PI) / 180),
    ]),
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", right: -30, top: -20, opacity: 0.07 }}>
      {centers.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={r}
          stroke={color} strokeWidth={0.8} fill="none" />
      ))}
      <circle cx={cx} cy={cy} r={r * 2 * 2}
        stroke={color} strokeWidth={0.5} fill="none" opacity={0.5} />
    </svg>
  );
}

export default function PropC() {
  const borderRef  = useRef<HTMLDivElement>(null);
  const glowRef    = useRef<HTMLDivElement>(null);
  const iconHaloRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let frame = 0;
    let raf: number;
    const tick = () => {
      frame++;
      const t = (frame % 150) / 150; // ~2.5s ciclo
      const pulse = (Math.sin(t * Math.PI * 2) + 1) / 2; // 0→1→0

      // Borde que pulsa
      if (borderRef.current) {
        const opacity = 0.25 + 0.45 * pulse;
        const blur    = 4 + 10 * pulse;
        borderRef.current.style.boxShadow =
          `0 0 0 1px rgba(101,132,212,${opacity}), 0 0 ${blur}px rgba(101,132,212,${opacity * 0.7})`;
      }
      // Glow inferior que respira
      if (glowRef.current) {
        const opacity = 0.08 + 0.14 * pulse;
        glowRef.current.style.opacity = String(opacity);
      }
      // Halo del ícono
      if (iconHaloRef.current) {
        const r = 22 + 4 * pulse;
        iconHaloRef.current.setAttribute("r", String(r));
        iconHaloRef.current.style.opacity = String(0.15 + 0.25 * pulse);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      width: 390, height: 320, background: BG,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Card wrapper con borde pulsante */}
      <div ref={borderRef} style={{
        width: 342,
        borderRadius: 20,
        position: "relative",
        boxShadow: "0 0 0 1px rgba(101,132,212,0.25)",
        transition: "none",
      }}>
        {/* Card interior */}
        <div style={{
          background: "linear-gradient(160deg, #0d1535 0%, #0a1028 50%, #060c1e 100%)",
          borderRadius: 20,
          padding: "18px 18px 20px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Flor de Vida de fondo */}
          <FlowerBg size={180} color={BLUE2} />

          {/* Líneas diagonales sutiles */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
            viewBox="0 0 342 90" preserveAspectRatio="none">
            <line x1={0} y1={0} x2={342} y2={90} stroke={BLUE} strokeWidth={0.4} opacity={0.06} />
            <line x1={0} y1={45} x2={342} y2={0} stroke={BLUE} strokeWidth={0.3} opacity={0.04} />
          </svg>

          {/* Glow inferior */}
          <div ref={glowRef} style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
            background: `linear-gradient(to top, rgba(101,132,212,0.15), transparent)`,
            pointerEvents: "none",
          }} />

          {/* Ícono */}
          <div style={{ position: "relative", width: 58, height: 58, flexShrink: 0 }}>
            <svg width={58} height={58} viewBox="0 0 58 58"
              style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <defs>
                <filter id="halo-blur">
                  <feGaussianBlur stdDeviation="3" />
                </filter>
                <linearGradient id="icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={BLUE2} stopOpacity={0.1} />
                </linearGradient>
              </defs>

              {/* Halo pulsante exterior */}
              <circle ref={iconHaloRef} cx={29} cy={29} r={22}
                fill={BLUE} filter="url(#halo-blur)" opacity={0.2} />

              {/* Fondo del ícono */}
              <circle cx={29} cy={29} r={21}
                fill="url(#icon-grad)"
                stroke={BLUE} strokeWidth={1} opacity={0.8} />

              {/* Anillos concéntricos */}
              {[14, 10, 6].map((r, i) => (
                <circle key={i} cx={29} cy={29} r={r}
                  stroke={BLUE2} strokeWidth={0.5} fill="none"
                  opacity={0.15 + i * 0.1} />
              ))}

              {/* Cruz / plus */}
              <line x1={29} y1={20} x2={29} y2={38}
                stroke={BLUE2} strokeWidth={2} strokeLinecap="round" />
              <line x1={20} y1={29} x2={38} y2={29}
                stroke={BLUE2} strokeWidth={2} strokeLinecap="round" />

              {/* 4 destellos en las diagonales */}
              {[45, 135, 225, 315].map((a, i) => {
                const dist = 16;
                const x = 29 + dist * Math.cos((a * Math.PI) / 180);
                const y = 29 + dist * Math.sin((a * Math.PI) / 180);
                return <circle key={i} cx={x} cy={y} r={1.2} fill={BLUE2} opacity={0.5} />;
              })}
            </svg>
          </div>

          {/* Texto */}
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{
              fontSize: 15, fontWeight: 700, color: FG,
              marginBottom: 3, letterSpacing: 0.3,
              textShadow: `0 0 16px rgba(101,132,212,0.4)`,
            }}>
              Crear Geometría
            </div>
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>
              Comienza desde cero
            </div>
          </div>

          {/* Chevron con glow */}
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "rgba(101,132,212,0.1)",
            border: "1px solid rgba(101,132,212,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <polyline points="3,2 8,6 3,10" stroke={BLUE2} strokeWidth={1.6}
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
