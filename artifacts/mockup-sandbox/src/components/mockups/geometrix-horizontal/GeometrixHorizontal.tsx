/**
 * Geometrix Horizontal — mockup de la app en formato horizontal
 * Inspirado en el diseño de ChatGPT: barra superior, sidebar izquierdo,
 * canvas central con geometría sagrada, y panel derecho de ajustes.
 */
import React, { useEffect, useState } from "react";
import { SacredGlyph } from "./SacredGlyphMock";
import { baseOf } from "./geometries-mock";

// ── Colores de la marca ──
const BG = "#0B0F14";
const BG_PANEL = "#12182E";
const BG_CARD = "rgba(190,150,80,0.05)";
const GOLD = "#BE9650";
const GOLD_LIGHT = "#D6A85B";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const BORDER = "#1E2733";

// ── Categorías ──
const CATEGORIES = [
  { id: "all", label: "Todas", count: 128, icon: "grid" },
  { id: "circulos", label: "Círculos", count: 24, icon: "circle" },
  { id: "poligonos", label: "Polígonos", count: 18, icon: "hexagon" },
  { id: "flores", label: "Flores de la Vida", count: 16, icon: "flower" },
  { id: "solidos", label: "Sólidos Sagrados", count: 14, icon: "box" },
  { id: "mandalas", label: "Mandálas", count: 20, icon: "aperture" },
  { id: "espirales", label: "Espirales", count: 12, icon: "rotate-ccw" },
  { id: "fractales", label: "Fractales", count: 8, icon: "triangle" },
  { id: "simbolos", label: "Símbolos", count: 16, icon: "star" },
];

// ── Geometrías visibles (miniaturas) ──
const GEOMETRIES = [
  { id: "flor-vida", name: "Flor de la Vida" },
  { id: "semilla-vida", name: "Semilla de la Vida" },
  { id: "metatron", name: "Cubo de Metatrón" },
  { id: "merkaba", name: "Merkaba" },
  { id: "sri-yantra", name: "Sri Yantra" },
  { id: "toroide", name: "Toroide" },
  { id: "vesica", name: "Vesica Piscis" },
  { id: "triquetra", name: "Triquetra" },
  { id: "more", name: "Más" },
];

// ── Panel derecho: ajustes ──
const SETTINGS = [
  { icon: "sliders", label: "Ajustes generales" },
  { icon: "image", label: "Mis creaciones" },
  { icon: "users", label: "Creaciones comunidad" },
  { icon: "save", label: "Guardar" },
];

const VIEW_SETTINGS = [
  { icon: "eye", label: "Visión inmersiva" },
  { icon: "maximize", label: "Pantalla completa" },
  { icon: "grid", label: "Guías", toggle: true },
];

const CREATION = [
  { icon: "shuffle", label: "Aleatorio" },
];

const SYSTEM = [
  { icon: "folder", label: "Cerrar proyecto" },
  { icon: "log-out", label: "Salir" },
  { icon: "x", label: "Cerrar" },
];

function Icon({ name, size = 16, color = FG }: { name: string; size?: number; color?: string }) {
  // Simple SVG icons
  const icons: Record<string, string> = {
    grid: "M3 3h7v7H3zm0 11h7v7H3zm11-11h7v7h-7zm0 11h7v7h-7",
    circle: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z",
    hexagon: "M12 2l8.66 5v10L12 22l-8.66-5V7L12 2z",
    flower: "M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z",
    box: "M12 2l-9 4.5v11l9 4.5 9-4.5v-11L12 2zm0 2.2l6.5 3.2-6.5 3.2L5.5 7.4 12 4.2zm-7 5.5l6.5 3.2v7.5l-6.5-3.2v-7.5zm8 10.7v-7.5l6.5-3.2v7.5l-6.5 3.2z",
    aperture: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z",
    "rotate-ccw": "M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19c1.76 0 3.38-.5 4.78-1.34l-1.24-1.83c-1.04.66-2.27 1.06-3.54 1.06-3.58 0-6.5-2.92-6.5-6.5s2.92-6.5 6.5-6.5 6.5 2.92 6.5 6.5h-2l3 4 3-4h-2c0-4.14-3.36-7.5-7.5-7.5z",
    triangle: "M12 2L2 22h20L12 2z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    sliders: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
    image: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
    users: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z",
    save: "M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z",
    eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
    maximize: "M3 3h7v2H5v5H3V3zm7 16H3v-7h2v5h5v2zm11-7h-2v5h-5v2h7v-7zm-2-9h-5V3h7v7h-2V5z",
    shuffle: "M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
    folder: "M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z",
    "log-out": "M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z",
    x: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  };
  const d = icons[name] || icons.grid;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} fill={color} stroke="none" />
    </svg>
  );
}

// ── Animated sparkles around the central geometry ──
function Sparkles() {
  const [positions] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 60,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    }))
  );

  return (
    <>
      {positions.map((s) => (
        <div
          key={s.id}
          className="sparkle"
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: GOLD,
            boxShadow: `0 0 6px 2px ${GOLD}`,
            animation: `pulse ${s.duration}s ease-in-out ${s.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </>
  );
}

// ── Toggle switch ──
function Toggle({ on }: { on: boolean }) {
  return (
    <div style={{
      width: 36, height: 20, borderRadius: 10,
      background: on ? GOLD : "rgba(255,255,255,0.15)",
      position: "relative", transition: "background 0.2s",
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff",
        position: "absolute", top: 2, left: on ? 18 : 2,
        transition: "left 0.2s",
      }} />
    </div>
  );
}

// ── Main component ──
export function GeometrixHorizontal() {
  const [activeCat, setActiveCat] = useState("all");
  const [activeGeo, setActiveGeo] = useState("flor-vida");
  const [zoom, setZoom] = useState(100);
  const [guidesOn, setGuidesOn] = useState(true);
  const [animTime, setAnimTime] = useState(0);

  // Subtle animation loop
  useEffect(() => {
    const t = setInterval(() => setAnimTime((t) => t + 0.02), 50);
    return () => clearInterval(t);
  }, []);

  const rotation = Math.sin(animTime) * 3;
  const scale = 1 + Math.sin(animTime * 0.7) * 0.02;

  return (
    <div className="geometrix-horizontal" style={{ width: "100%", height: "100%", background: BG, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "Inter, system-ui, sans-serif" }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .geo-thumb:hover { transform: scale(1.05); border-color: ${GOLD}; }
        .menu-item:hover { background: rgba(255,255,255,0.06); }
        .cat-item:hover { background: rgba(255,255,255,0.06); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 20px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 40 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={1.5}>
              <circle cx={12} cy={12} r={10} />
              <circle cx={12} cy={12} r={4} />
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: FG, letterSpacing: 1 }}>GEOMETRIX</div>
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 2 }}>SACRED GEOMETRY</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, flex: 1, justifyContent: "center" }}>
          {["CATEGORÍAS", "GEOMETRÍAS"].map((tab, i) => (
            <button key={tab} style={{
              padding: "8px 20px", borderRadius: 20, border: "none",
              background: i === 1 ? "rgba(190,150,80,0.15)" : "transparent",
              color: i === 1 ? GOLD : MUTED, fontSize: 12, fontWeight: 600,
              letterSpacing: 1, cursor: "pointer",
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Zoom + Preview */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 12 }}>
            <button style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }} onClick={() => setZoom((z) => Math.max(50, z - 10))}>-</button>
            <span style={{ minWidth: 36, textAlign: "center" }}>{zoom}%</span>
            <button style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }} onClick={() => setZoom((z) => Math.min(200, z + 10))}>+</button>
          </div>
          <button style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
            borderRadius: 20, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.04)",
            color: FG, fontSize: 12, cursor: "pointer",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={FG} strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx={12} cy={12} r={3}/></svg>
            Vista previa
          </button>
        </div>

        {/* Menu hamburger */}
        <button style={{ background: "none", border: "none", color: FG, cursor: "pointer" }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={FG} strokeWidth={2}><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── Left sidebar: Categories ── */}
        <div style={{ width: 210, borderRight: `1px solid ${BORDER}`, padding: "16px 12px", overflowY: "auto" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>CATEGORÍAS</div>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="cat-item"
              onClick={() => setActiveCat(cat.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                background: activeCat === cat.id ? "rgba(190,150,80,0.12)" : "transparent",
                marginBottom: 2,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                border: `1px solid ${activeCat === cat.id ? GOLD : BORDER}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={cat.icon} size={14} color={activeCat === cat.id ? GOLD : MUTED} />
              </div>
              <div style={{ flex: 1, fontSize: 12, color: activeCat === cat.id ? FG : MUTED, fontWeight: activeCat === cat.id ? 600 : 400 }}>
                {cat.label}
              </div>
              <div style={{ fontSize: 11, color: activeCat === cat.id ? GOLD : MUTED }}>{cat.count}</div>
            </div>
          ))}
        </div>

        {/* ── Center: Canvas + geometries ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
          {/* Geometries row */}
          <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, overflowX: "auto" }}>
            {GEOMETRIES.map((g) => (
              <div
                key={g.id}
                className="geo-thumb"
                onClick={() => g.id !== "more" && setActiveGeo(g.id)}
                style={{
                  width: 72, height: 72, borderRadius: 10,
                  border: `1px solid ${activeGeo === g.id ? GOLD : BORDER}`,
                  background: activeGeo === g.id ? "rgba(190,150,80,0.08)" : BG_CARD,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 4, cursor: "pointer", transition: "all 0.2s", flexShrink: 0,
                }}
              >
                {g.id === "more" ? (
                  <div style={{ color: MUTED, fontSize: 16 }}>...</div>
                ) : (
                  <div style={{ width: 32, height: 32, opacity: activeGeo === g.id ? 1 : 0.6 }}>
                    <SacredGlyph id={g.id as any} color={GOLD} size={32} strokeWidth={1} />
                  </div>
                )}
                <div style={{ fontSize: 9, color: activeGeo === g.id ? FG : MUTED, textAlign: "center", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {g.name}
                </div>
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {/* Grid background */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`,
              backgroundSize: "40px 40px", opacity: 0.3,
            }} />

            {/* Center geometry */}
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 380, height: 380,
                transform: `rotate(${rotation}deg) scale(${scale})`,
                transition: "transform 0.1s linear",
              }}>
                <SacredGlyph id={activeGeo as any} color={GOLD} size={380} strokeWidth={0.8} />
              </div>
              {/* Glow ring */}
              <div style={{
                position: "absolute", width: 420, height: 420, borderRadius: "50%",
                border: `1px solid ${GOLD}`, opacity: 0.15 + Math.sin(animTime * 0.5) * 0.05,
              }} />
              <div style={{
                position: "absolute", width: 460, height: 460, borderRadius: "50%",
                border: `1px solid ${GOLD}`, opacity: 0.08 + Math.sin(animTime * 0.3) * 0.03,
              }} />
            </div>

            {/* Sparkles */}
            <Sparkles />

            {/* Bottom controls */}
            <div style={{
              position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: 8, alignItems: "center",
              background: "rgba(11,15,20,0.85)", backdropFilter: "blur(10px)",
              padding: "8px 16px", borderRadius: 12, border: `1px solid ${BORDER}`,
            }}>
              <button style={{
                width: 32, height: 32, borderRadius: 8, border: "none",
                background: "rgba(255,255,255,0.06)", color: FG, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={FG} strokeWidth={2}><path d="M3 7v10l7-4 7 4V7l-7 4-7-4z"/></svg>
              </button>
              <button style={{
                width: 32, height: 32, borderRadius: 8, border: "none",
                background: "rgba(255,255,255,0.06)", color: FG, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={FG} strokeWidth={2}><path d="M3 7v10l7-4 7 4V7l-7 4-7-4z" transform="rotate(180 12 12)"/></svg>
              </button>
              <button style={{
                padding: "6px 14px", borderRadius: 8, border: "none",
                background: "rgba(190,150,80,0.15)", color: GOLD,
                fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth={2}><circle cx={12} cy={12} r={10}/><path d="M12 8v8M8 12h8"/></svg>
                Centrar
              </button>
              <button style={{
                width: 32, height: 32, borderRadius: 8, border: "none",
                background: "rgba(255,255,255,0.06)", color: FG, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={FG} strokeWidth={2}><rect x={3} y={11} width={18} height={11} rx={2} ry={2}/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Right sidebar: Settings ── */}
        <div style={{ width: 220, borderLeft: `1px solid ${BORDER}`, padding: "16px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Proyecto */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>PROYECTO</div>
            {SETTINGS.map((s) => (
              <div key={s.label} className="menu-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 6, cursor: "pointer" }}>
                <Icon name={s.icon} size={15} color={MUTED} />
                <span style={{ fontSize: 12, color: FG }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Vista */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>VISTA</div>
            {VIEW_SETTINGS.map((s) => (
              <div key={s.label} className="menu-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 8px", borderRadius: 6, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name={s.icon} size={15} color={MUTED} />
                  <span style={{ fontSize: 12, color: FG }}>{s.label}</span>
                </div>
                {s.toggle && <Toggle on={guidesOn} />}
              </div>
            ))}
          </div>

          {/* Creación */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>CREACIÓN</div>
            {CREATION.map((s) => (
              <div key={s.label} className="menu-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 6, cursor: "pointer" }}>
                <Icon name={s.icon} size={15} color={MUTED} />
                <span style={{ fontSize: 12, color: FG }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Sistema */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>SISTEMA</div>
            {SYSTEM.map((s) => (
              <div key={s.label} className="menu-item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 6, cursor: "pointer" }}>
                <Icon name={s.icon} size={15} color={MUTED} />
                <span style={{ fontSize: 12, color: FG }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ height: 54, borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SacredGlyph id="flor-vida" color={GOLD} size={24} strokeWidth={1} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: FG }}>Bienvenido, Creador</div>
            <div style={{ fontSize: 10, color: MUTED }}>Que tu geometría inspire al universo.</div>
          </div>
          <div style={{ color: GOLD, fontSize: 10, marginLeft: 4 }}>&gt;</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <button style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1={12} y1={15} x2={12} y2={3}/></svg>
          </button>
          <button style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${GOLD}`, background: "rgba(190,150,80,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <SacredGlyph id="merkaba" color={GOLD} size={28} strokeWidth={1} />
          </button>
          <button style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><circle cx={18} cy={5} r={3}/><circle cx={6} cy={12} r={3}/><circle cx={18} cy={19} r={3}/><line x1={8.59} y1={13.51} x2={15.42} y2={17.49"/><line x1={15.41} y1={6.51} x2={8.59} y2={10.49"/></svg>
          </button>
          <button style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><circle cx={12} cy={12} r={1}/><circle cx={19} cy={12} r={1}/><circle cx={5} cy={12} r={1}/></svg>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 11 }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Guardado automático
          <span style={{ color: FG }}>10:45</span>
        </div>
      </div>
    </div>
  );
}
