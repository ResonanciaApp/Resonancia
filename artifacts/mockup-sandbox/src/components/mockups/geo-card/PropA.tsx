/**
 * Propuesta A — Azul Sólido + Ring Glow
 * Card "Crear Geometría": fondo azul intenso con anillo pulsante y glow exterior.
 */
import { useEffect, useRef } from "react";

const BG     = "#0B0F14";
const BLUE   = "#6584d4";
const BLUE2  = "#c7caec";
const FG     = "#EDE1D3";
const MUTED  = "#7A8FA8";

export default function PropA() {
  const ringRef = useRef<SVGCircleElement>(null);
  const ring2Ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    let frame = 0;
    let raf: number;
    const tick = () => {
      frame++;
      const t = (frame % 120) / 120; // 0→1 en ~2s a 60fps
      const scale = 0.85 + 0.15 * Math.sin(t * Math.PI * 2);
      const opacity = 0.35 + 0.35 * Math.sin(t * Math.PI * 2);
      const scale2 = 0.75 + 0.25 * Math.sin(t * Math.PI * 2 + Math.PI);
      const opacity2 = 0.2 + 0.2 * Math.sin(t * Math.PI * 2 + Math.PI);
      if (ringRef.current) {
        ringRef.current.style.transform = `scale(${scale})`;
        ringRef.current.style.opacity = String(opacity);
      }
      if (ring2Ref.current) {
        ring2Ref.current.style.transform = `scale(${scale2})`;
        ring2Ref.current.style.opacity = String(opacity2);
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
      {/* Card */}
      <div style={{
        width: 342,
        background: `linear-gradient(135deg, #1a2660 0%, #1e2e7a 60%, #2a3a8a 100%)`,
        borderRadius: 20,
        padding: "18px 18px 20px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 0 0 1px rgba(101,132,212,0.35), 0 0 32px rgba(101,132,212,0.25), 0 8px 32px rgba(0,0,0,0.5)`,
      }}>
        {/* Glow difuso fondo */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 140% 120% at 50% 110%, rgba(101,132,212,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Destellos de esquina */}
        <div style={{
          position: "absolute", top: -30, right: -30, width: 100, height: 100,
          background: "radial-gradient(circle, rgba(199,202,236,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Ícono con rings pulsantes */}
        <div style={{ position: "relative", width: 58, height: 58, flexShrink: 0 }}>
          {/* SVG de anillos */}
          <svg width={58} height={58} viewBox="0 0 58 58"
            style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <defs>
              <filter id="ring-blur">
                <feGaussianBlur stdDeviation="2" />
              </filter>
            </defs>
            {/* Anillo exterior pulsante */}
            <circle ref={ring2Ref} cx={29} cy={29} r={34}
              stroke={BLUE} strokeWidth={1} fill="none"
              filter="url(#ring-blur)"
              style={{ transformOrigin: "29px 29px", opacity: 0.2 }} />
            {/* Anillo medio pulsante */}
            <circle ref={ringRef} cx={29} cy={29} r={26}
              stroke={BLUE2} strokeWidth={1.2} fill="none"
              filter="url(#ring-blur)"
              style={{ transformOrigin: "29px 29px", opacity: 0.35 }} />
            {/* Hexágono de fondo */}
            {[0,60,120,180,240,300].map((a,i) => {
              const r = 18, cx2 = 29+r*Math.cos((a-90)*Math.PI/180), cy2 = 29+r*Math.sin((a-90)*Math.PI/180);
              const nx = 29+r*Math.cos(((a+60)-90)*Math.PI/180), ny = 29+r*Math.sin(((a+60)-90)*Math.PI/180);
              return <line key={i} x1={cx2} y1={cy2} x2={nx} y2={ny} stroke={BLUE2} strokeWidth={0.8} opacity={0.5} />;
            })}
            {/* Círculo interior icono */}
            <circle cx={29} cy={29} r={20}
              fill="rgba(101,132,212,0.15)"
              stroke={BLUE2} strokeWidth={0.8} opacity={0.7} />
          </svg>
          {/* Plus */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <line x1={10} y1={3} x2={10} y2={17} stroke={BLUE2} strokeWidth={2} strokeLinecap="round" />
              <line x1={3} y1={10} x2={17} y2={10} stroke={BLUE2} strokeWidth={2} strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Texto */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: FG, marginBottom: 4, letterSpacing: 0.2 }}>
            Crear Geometría
          </div>
          <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>
            Comienza desde cero
          </div>
        </div>

        {/* Chevron */}
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
          <polyline points="5,3 11,8 5,13" stroke={BLUE2} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
        </svg>
      </div>
    </div>
  );
}
