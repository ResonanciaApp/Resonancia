/**
 * Geometrix — Aprende: pantalla principal con listado de categorías
 */
import React, { useState } from "react";
import { BG, GOLD, FG, MUTED, BORDER, CARD_BG, StatusBar, BackBar, TabBar, GoldDivider } from "./shared";

const CATEGORIES = [
  {
    id: "sagradas",
    label: "Geometría Sagrada",
    count: 20,
    desc: "Patrones universales que conectan la naturaleza con lo divino",
    color: "#BE9650",
    icon: (
      // Flor de la Vida simplificada
      <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
        <circle cx={18} cy={18} r={7} stroke="#BE9650" strokeWidth={1.2} />
        <circle cx={18} cy={9} r={7} stroke="#BE9650" strokeWidth={1.2} opacity={0.7} />
        <circle cx={25.06} cy={13.5} r={7} stroke="#BE9650" strokeWidth={1.2} opacity={0.7} />
        <circle cx={25.06} cy={22.5} r={7} stroke="#BE9650" strokeWidth={1.2} opacity={0.7} />
        <circle cx={18} cy={27} r={7} stroke="#BE9650" strokeWidth={1.2} opacity={0.7} />
        <circle cx={10.94} cy={22.5} r={7} stroke="#BE9650" strokeWidth={1.2} opacity={0.7} />
        <circle cx={10.94} cy={13.5} r={7} stroke="#BE9650" strokeWidth={1.2} opacity={0.7} />
      </svg>
    ),
  },
  {
    id: "poliedros",
    label: "Poliedros 3D",
    count: 9,
    desc: "Los cinco sólidos de Platón y sus extensiones dimensionales",
    color: "#7A8FA8",
    icon: (
      // Cubo 3D
      <svg width={36} height={36} viewBox="0 0 36 36" fill="none" stroke="#BE9650" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 10l12-6 12 6v16l-12 6L6 26z" opacity={0.7} />
        <path d="M6 10l12 6 12-6M18 16v16" />
        <path d="M18 16L6 10" opacity={0.5} />
      </svg>
    ),
  },
  {
    id: "formas",
    label: "Formas y Estrellas",
    count: 15,
    desc: "Polígonos, espirales y patrones que revelan el orden matemático",
    color: "#D6A85B",
    icon: (
      // Pentagrama + espiral
      <svg width={36} height={36} viewBox="0 0 36 36" fill="none" stroke="#BE9650" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="18,4 21.5,14 32,14 23.5,20.5 26.5,31 18,25 9.5,31 12.5,20.5 4,14 14.5,14" opacity={0.7} />
        <circle cx={18} cy={18} r={4} strokeWidth={1} />
      </svg>
    ),
  },
];

export function GeometrixAprende() {
  const [search, setSearch] = useState(false);

  return (
    <div style={{ width: 390, height: 844, background: BG, display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; }`}</style>

      <StatusBar />
      <BackBar
        title="Aprende"
        right={
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round">
              <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        }
      />

      {/* Intro */}
      <div style={{ padding: "0 22px 18px" }}>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
          Descubre el significado y origen de cada forma sagrada. Elige una categoría para comenzar.
        </div>
      </div>

      <GoldDivider />

      {/* Category cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 12px" }}>
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "16px 16px",
              borderRadius: 16,
              border: `1px solid ${BORDER}`,
              background: CARD_BG,
              marginBottom: 12,
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glow accent corner */}
            <div style={{
              position: "absolute", top: -20, right: -20, width: 80, height: 80,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(190,150,80,0.1), transparent 70%)`,
              pointerEvents: "none",
            }} />

            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              border: `1px solid rgba(190,150,80,0.25)`,
              background: "rgba(190,150,80,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {cat.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: FG }}>{cat.label}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: GOLD,
                  background: "rgba(190,150,80,0.12)", borderRadius: 8,
                  padding: "2px 8px", border: `1px solid rgba(190,150,80,0.2)`,
                }}>
                  {cat.count}
                </span>
              </div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{cat.desc}</div>
            </div>

            {/* Chevron */}
            <div style={{ flexShrink: 0, alignSelf: "center" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        ))}

        {/* Coming soon teaser */}
        <div style={{
          padding: "14px 16px", borderRadius: 16,
          border: `1px dashed rgba(190,150,80,0.15)`,
          background: "rgba(190,150,80,0.02)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(190,150,80,0.05)", border: `1px dashed rgba(190,150,80,0.15)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(190,150,80,0.3)" strokeWidth={1.8} strokeLinecap="round">
              <circle cx={12} cy={12} r={10} /><path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(237,225,211,0.4)" }}>Más categorías próximamente</div>
            <div style={{ fontSize: 11, color: "rgba(122,143,168,0.5)" }}>Mandalas, Espirales, Fractales…</div>
          </div>
        </div>
      </div>

      <TabBar activeIdx={3} />
    </div>
  );
}
