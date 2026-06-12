/**
 * Geometrix — Aprende: pantalla de lista de geometrías de una categoría
 * Ejemplo: Geometría Sagrada
 */
import React from "react";
import { BG, GOLD, FG, MUTED, BORDER, CARD_BG, StatusBar, BackBar, TabBar, GoldDivider } from "./shared";

const GEOMETRIAS = [
  { id: "flor-vida",    name: "Flor de la Vida",       tag: "Origen",     desc: "Patrón de 19 círculos que representa la creación del universo" },
  { id: "semilla-vida", name: "Semilla de la Vida",    tag: "Base",       desc: "7 círculos que conforman el inicio de toda geometría sagrada" },
  { id: "metatron",     name: "Cubo de Metatrón",      tag: "Arquetipo",  desc: "Contiene los 5 sólidos platónicos dentro de su estructura" },
  { id: "merkaba",      name: "Merkaba",                tag: "Energía",    desc: "Vehículo de luz que fusiona el cuerpo físico con el espiritual" },
  { id: "vesica",       name: "Vesica Piscis",         tag: "Dualidad",   desc: "La intersección de dos círculos iguales, símbolo de creación" },
  { id: "sri-yantra",   name: "Sri Yantra",            tag: "Meditación", desc: "9 triángulos entrelazados que representan los 85.000 mantras" },
  { id: "toroide",      name: "Toroide",               tag: "Campo",      desc: "El campo energético universal en forma de donut continuo" },
  { id: "mandala",      name: "Mandala",               tag: "Totalidad",  desc: "Representación circular del universo y el ser interior" },
  { id: "triquetra",    name: "Triquetra",             tag: "Trinidad",   desc: "Tres arcos entrelazados, símbolo de lo eterno y sin fin" },
  { id: "arbol-vida",   name: "Árbol de la Vida",      tag: "Kabbalah",   desc: "10 sefirot que mapean la conciencia cósmica y el alma" },
];

// Mini SVG icons per geometry
const MINI_ICONS: Record<string, React.ReactNode> = {
  "flor-vida": (
    <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      {[0,1,2,3,4,5].map(i => {
        const a = (i * Math.PI) / 3;
        const x = 14 + Math.cos(a) * 6, y = 14 + Math.sin(a) * 6;
        return <circle key={i} cx={x} cy={y} r={6} stroke={GOLD} strokeWidth={0.9} opacity={0.7} />;
      })}
      <circle cx={14} cy={14} r={6} stroke={GOLD} strokeWidth={0.9} />
    </svg>
  ),
  "semilla-vida": (
    <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <circle cx={14} cy={14} r={4.5} stroke={GOLD} strokeWidth={0.9} />
      {[0,1,2,3,4,5].map(i => {
        const a = (i * Math.PI) / 3 - Math.PI/6;
        const x = 14 + Math.cos(a) * 4.5, y = 14 + Math.sin(a) * 4.5;
        return <circle key={i} cx={x} cy={y} r={4.5} stroke={GOLD} strokeWidth={0.9} opacity={0.6} />;
      })}
    </svg>
  ),
  "metatron": (
    <svg width={28} height={28} viewBox="0 0 28 28" fill="none" stroke={GOLD} strokeWidth={0.9} strokeLinecap="round">
      {[0,1,2,3,4,5].map(i => {
        const a = (i * Math.PI) / 3;
        const x = 14 + Math.cos(a) * 8, y = 14 + Math.sin(a) * 8;
        return <circle key={i} cx={x} cy={y} r={4} opacity={0.5} />;
      })}
      <circle cx={14} cy={14} r={4} />
      <circle cx={14} cy={14} r={12} opacity={0.3} />
    </svg>
  ),
};

function MiniGlyph({ id }: { id: string }) {
  if (MINI_ICONS[id]) return <>{MINI_ICONS[id]}</>;
  return (
    <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <circle cx={14} cy={14} r={9} stroke={GOLD} strokeWidth={1} opacity={0.6} />
      <circle cx={14} cy={14} r={5} stroke={GOLD} strokeWidth={0.8} opacity={0.4} />
      <circle cx={14} cy={14} r={2} fill={GOLD} opacity={0.5} />
    </svg>
  );
}

const TAG_COLORS: Record<string, string> = {
  Origen: "rgba(190,150,80,0.15)",
  Base: "rgba(122,143,168,0.15)",
  Arquetipo: "rgba(190,150,80,0.12)",
  Energía: "rgba(200,120,80,0.12)",
  Dualidad: "rgba(122,143,168,0.15)",
  Meditación: "rgba(190,150,80,0.12)",
  Campo: "rgba(122,143,168,0.12)",
  Totalidad: "rgba(190,150,80,0.12)",
  Trinidad: "rgba(190,150,80,0.12)",
  Kabbalah: "rgba(122,143,168,0.12)",
};

export function GeometrixAprendeCategoria() {
  return (
    <div style={{ width: 390, height: 844, background: BG, display: "flex", flexDirection: "column", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; }`}</style>

      <StatusBar />
      <BackBar title="Geometría Sagrada" right={
        <div style={{ fontSize: 12, color: MUTED, background: "rgba(190,150,80,0.08)", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "4px 10px" }}>
          {GEOMETRIAS.length} formas
        </div>
      } />

      {/* Category hero strip */}
      <div style={{
        margin: "0 20px 14px",
        padding: "12px 14px",
        borderRadius: 12,
        background: "rgba(190,150,80,0.06)",
        border: `1px solid rgba(190,150,80,0.2)`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <svg width={40} height={40} viewBox="0 0 40 40" fill="none">
          {[0,1,2,3,4,5].map(i => {
            const a = (i * Math.PI) / 3;
            return <circle key={i} cx={20 + Math.cos(a)*8} cy={20 + Math.sin(a)*8} r={8} stroke={GOLD} strokeWidth={1.1} opacity={0.6} />;
          })}
          <circle cx={20} cy={20} r={8} stroke={GOLD} strokeWidth={1.2} />
        </svg>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: FG, marginBottom: 2 }}>Geometría Sagrada</div>
          <div style={{ fontSize: 11, color: MUTED }}>Patrones universales que conectan la naturaleza con lo divino</div>
        </div>
      </div>

      <GoldDivider />

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 10px" }}>
        {GEOMETRIAS.map((geo, i) => (
          <div
            key={geo.id}
            style={{
              display: "flex", alignItems: "center", gap: 13,
              padding: "13px 14px",
              borderRadius: 13,
              border: `1px solid ${BORDER}`,
              background: CARD_BG,
              marginBottom: 9,
              cursor: "pointer",
            }}
          >
            {/* Mini glyph */}
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: "rgba(190,150,80,0.06)",
              border: `1px solid rgba(190,150,80,0.18)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <MiniGlyph id={geo.id} />
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: FG }}>{geo.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 500, color: GOLD,
                  background: TAG_COLORS[geo.tag] ?? "rgba(190,150,80,0.1)",
                  borderRadius: 6, padding: "1px 6px",
                  border: `1px solid rgba(190,150,80,0.15)`,
                }}>
                  {geo.tag}
                </span>
              </div>
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{geo.desc}</div>
            </div>

            {/* Arrow */}
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        ))}
      </div>

      <TabBar activeIdx={3} />
    </div>
  );
}
