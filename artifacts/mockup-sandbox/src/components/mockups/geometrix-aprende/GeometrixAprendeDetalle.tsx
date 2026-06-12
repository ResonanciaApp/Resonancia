/**
 * Geometrix — Aprende: pantalla de detalle de una geometría
 * Ejemplo: Flor de la Vida
 */
import React, { useEffect, useState } from "react";
import { BG, GOLD, FG, MUTED, BORDER, CARD_BG, StatusBar, BackBar, TabBar } from "./shared";

// Animated Flor de la Vida
function FlorDeVidaAnimada({ pulse }: { pulse: number }) {
  const cx = 110, cy = 110, r = 38;
  const petals = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
  const outer12 = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return { x: cx + Math.cos(a) * r * 2, y: cy + Math.sin(a) * r * 2 };
  });

  const glow = 0.3 + pulse * 0.5;

  return (
    <svg width={220} height={220} viewBox="0 0 220 220" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="fvGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GOLD} stopOpacity={0.22 * glow} />
          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
        </radialGradient>
        <filter id="fvBlur"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      {/* Glow bg */}
      <circle cx={cx} cy={cy} r={105} fill="url(#fvGlow)" />

      {/* Outer 12 circles (dim) */}
      {outer12.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={r} fill="none" stroke={GOLD} strokeWidth={0.6} strokeOpacity={0.15} />
      ))}

      {/* 6 petal circles */}
      {petals.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={r} fill="none" stroke={GOLD} strokeWidth={1.1}
          strokeOpacity={0.55 + pulse * 0.2} filter="url(#fvBlur)" />
      ))}

      {/* Center circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={GOLD} strokeWidth={1.4}
        strokeOpacity={0.75 + pulse * 0.25} filter="url(#fvBlur)" />

      {/* Outer bounding circle */}
      <circle cx={cx} cy={cy} r={r * 2} fill="none" stroke={GOLD} strokeWidth={0.8} strokeOpacity={0.25} />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3.5} fill={GOLD} opacity={0.7 + pulse * 0.3} />

      {/* Petal intersection dots */}
      {petals.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={GOLD} opacity={0.4 + pulse * 0.3} />
      ))}
    </svg>
  );
}

const MEANINGS = [
  { label: "Origen", value: "El código maestro de la creación" },
  { label: "Elemento", value: "Todos los elementos · Éter" },
  { label: "Cultura", value: "Egipto, India, China, Mesopotamia" },
  { label: "Número", value: "7 (ciclos de la naturaleza)" },
];

const DESCRIPTION = `La Flor de la Vida es considerada el símbolo geométrico más sagrado e importante de toda la geometría sagrada. Es un patrón de 19 círculos que se entrelazan de manera perfecta, creando una forma que se repite infinitamente en la naturaleza.

Este patrón contiene dentro de sí misma todas las otras formas sagradas, incluyendo la Semilla de la Vida, el Fruto de la Vida y el Cubo de Metatrón. Se ha encontrado en culturas de todo el mundo, desde los templos egipcios hasta los manuscritos medievales europeos.

La estructura matemática de la Flor de la Vida refleja la proporción áurea (φ = 1.618), la misma proporción que aparece en las espirales de los caracoles, el crecimiento de las plantas y la proporción del cuerpo humano.`;

export function GeometrixAprendeDetalle() {
  const [animTime, setAnimTime] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setAnimTime(v => v + 0.03), 60);
    return () => clearInterval(t);
  }, []);
  const pulse = (Math.sin(animTime) + 1) / 2;

  return (
    <div style={{ width: 390, height: 844, background: BG, display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; }`}</style>

      <StatusBar />
      <BackBar title="Geometría Sagrada" right={
        <div style={{ display: "flex", gap: 8 }}>
          {/* Favorite */}
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={1.8} strokeLinecap="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
            </svg>
          </div>
          {/* Share */}
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={1.8} strokeLinecap="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </div>
        </div>
      } />

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Hero glyph */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "10px 0 16px",
          background: `radial-gradient(ellipse at 50% 30%, rgba(190,150,80,${0.06 + pulse * 0.04}), transparent 65%)`,
          position: "relative",
        }}>
          <div style={{ filter: `drop-shadow(0 0 ${10 + pulse * 10}px rgba(190,150,80,0.35))` }}>
            <FlorDeVidaAnimada pulse={pulse} />
          </div>

          {/* Title */}
          <div style={{ textAlign: "center", padding: "0 24px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: FG, letterSpacing: 0.5, marginBottom: 4 }}>
              Flor de la Vida
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
              {["Sagrado", "Creación", "Universal"].map(tag => (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 500, color: GOLD,
                  background: "rgba(190,150,80,0.1)", borderRadius: 6, padding: "2px 8px",
                  border: `1px solid rgba(190,150,80,0.2)`,
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER}, transparent)`, margin: "0 20px 16px" }} />

        {/* Attributes grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 20px 16px" }}>
          {MEANINGS.map(m => (
            <div key={m.label} style={{
              padding: "11px 12px", borderRadius: 12,
              border: `1px solid ${BORDER}`, background: CARD_BG,
            }}>
              <div style={{ fontSize: 10, color: MUTED, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>{m.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: FG, lineHeight: 1.4 }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1, fontSize: 11 }}>
            ✦ Sobre esta geometría
          </div>
          {DESCRIPTION.split("\n\n").map((para, i) => (
            <p key={i} style={{ fontSize: 13, color: MUTED, lineHeight: 1.65, margin: "0 0 12px" }}>
              {para}
            </p>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
          <button style={{
            flex: 1, height: 48, borderRadius: 13,
            background: `linear-gradient(135deg, ${GOLD}, #D6A85B)`,
            border: "none", color: "#0B0F14",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Crear con esta forma
          </button>
          <button style={{
            width: 48, height: 48, borderRadius: 13,
            background: CARD_BG, border: `1px solid ${BORDER}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={1.8} strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          </button>
        </div>
      </div>

      <TabBar activeIdx={3} />
    </div>
  );
}
