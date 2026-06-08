import React, { useState } from "react";
import "./_group.css";

const COLORS = {
  bgTop: "#090D20",
  bgMid: "#080A18",
  bgBot: "#06070F",
  gold: "#BE9650",
  goldLight: "#D6A85B",
  card: "rgba(190,150,80,0.05)",
  cardBorder: "#161f33",
  text: "#EDE1D3",
  textMuted: "#7A8FA8",
};

const GLYPH_COLORS = [
  "#BE9650",
  "#EDE1D3",
  "#7FD1C0",
  "#7AA8E0",
  "#B69BE0",
  "#E0989B",
  "#9BD6A8",
];

// SVGs
const FlorDeLaVida = ({ color, opacity = 1, size = 100 }: { color: string; opacity?: number; size?: number }) => {
  const r = 16;
  const circles = [];
  const addCircle = (x: number, y: number) => {
    circles.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={r} />);
  };
  addCircle(50, 50);
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    addCircle(50 + r * Math.cos(angle), 50 + r * Math.sin(angle));
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x1 = 50 + r * 2 * Math.cos(angle);
    const y1 = 50 + r * 2 * Math.sin(angle);
    addCircle(x1, y1);
    const angle2 = angle + Math.PI / 3;
    const x2 = 50 + r * Math.cos(angle) + r * Math.cos(angle2);
    const y2 = 50 + r * Math.sin(angle) + r * Math.sin(angle2);
    addCircle(x2, y2);
  }

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="1" strokeOpacity={opacity}>
      <circle cx="50" cy="50" r="48" strokeWidth="0.5" />
      <circle cx="50" cy="50" r="50" strokeWidth="1" />
      {circles}
    </svg>
  );
};

const SriYantra = ({ color, opacity = 1, size = 100 }: { color: string; opacity?: number; size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="1" strokeOpacity={opacity}>
      <circle cx="50" cy="50" r="48" strokeWidth="0.5" />
      <polygon points="50,10 80,70 20,70" />
      <polygon points="50,90 80,30 20,30" />
      <polygon points="50,20 70,60 30,60" />
      <polygon points="50,80 70,40 30,40" />
      <polygon points="50,30 60,55 40,55" />
      <polygon points="50,70 60,45 40,45" />
      <circle cx="50" cy="50" r="5" fill={color} fillOpacity={opacity * 0.5} stroke="none" />
    </svg>
  );
};

const Toroide = ({ color, opacity = 1, size = 100 }: { color: string; opacity?: number; size?: number }) => {
  const ellipses = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 180) / 12;
    ellipses.push(
      <ellipse key={i} cx="50" cy="50" rx="45" ry="15" transform={`rotate(${angle} 50 50)`} />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="1" strokeOpacity={opacity}>
      {ellipses}
      <circle cx="50" cy="50" r="45" strokeWidth="0.5" />
    </svg>
  );
};

const Hexagrama = ({ color, opacity = 1, size = 100 }: { color: string; opacity?: number; size?: number }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="1" strokeOpacity={opacity}>
      <circle cx="50" cy="50" r="48" strokeWidth="0.5" />
      <polygon points="50,15 80,67 20,67" />
      <polygon points="50,85 80,33 20,33" />
      <circle cx="50" cy="50" r="30" strokeWidth="0.5" />
    </svg>
  );
};

const Loto = ({ color, opacity = 1, size = 100 }: { color: string; opacity?: number; size?: number }) => {
  const petals = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * 360) / 8;
    petals.push(
      <path
        key={i}
        d="M50,50 Q65,15 50,5 Q35,15 50,50"
        transform={`rotate(${angle} 50 50)`}
      />
    );
    petals.push(
      <path
        key={`inner-${i}`}
        d="M50,50 Q58,25 50,15 Q42,25 50,50"
        transform={`rotate(${angle + 22.5} 50 50)`}
        strokeOpacity={opacity * 0.7}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="1" strokeOpacity={opacity}>
      <circle cx="50" cy="50" r="48" strokeWidth="0.5" />
      {petals}
      <circle cx="50" cy="50" r="8" strokeWidth="0.5" />
    </svg>
  );
};

const fondos = [
  { id: 1, name: "Flor dorada", Component: FlorDeLaVida, c1: COLORS.gold, c2: GLYPH_COLORS[2] },
  { id: 2, name: "Respiración", Component: Toroide, c1: GLYPH_COLORS[3], c2: GLYPH_COLORS[5] },
  { id: 3, name: "Portal de luz", Component: SriYantra, c1: COLORS.goldLight, c2: GLYPH_COLORS[1] },
  { id: 4, name: "Armonía", Component: Hexagrama, c1: GLYPH_COLORS[6], c2: COLORS.gold },
  { id: 5, name: "Loto cristal", Component: Loto, c1: GLYPH_COLORS[4], c2: GLYPH_COLORS[1] },
];

export function FondoReproductor() {
  const [selectedFondo, setSelectedFondo] = useState(fondos[0]);

  return (
    <div
      style={{
        width: "390px",
        height: "844px",
        background: `linear-gradient(180deg, ${COLORS.bgTop} 0%, ${COLORS.bgMid} 50%, ${COLORS.bgBot} 100%)`,
        fontFamily: "Inter, sans-serif",
        color: COLORS.text,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Animated Geometries */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <div className="absolute animate-geo-spin-reverse animate-geo-breathe">
          <selectedFondo.Component color={selectedFondo.c2} opacity={0.3} size={420} />
        </div>
        <div className="absolute animate-geo-spin animate-geo-pulse" style={{ filter: `drop-shadow(0 0 15px ${selectedFondo.c1}40)` }}>
          <selectedFondo.Component color={selectedFondo.c1} opacity={0.6} size={320} />
        </div>
        <div className="absolute animate-geo-spin-reverse">
          <div className="rounded-full w-[200px] h-[200px] border border-opacity-20" style={{ borderColor: selectedFondo.c1 }}></div>
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col justify-between pt-[52px] pb-[28px] px-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: COLORS.textMuted }}>Reproduciendo</div>
            <div className="text-sm font-medium mt-1">Geometrix</div>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>

        {/* Player Controls Area */}
        <div className="flex flex-col gap-8 mb-6">
          {/* Track Info */}
          <div className="text-center flex flex-col items-center">
            <h1 className="text-3xl font-light mb-2 text-white drop-shadow-md">Meditación para dormir</h1>
            <p className="text-lg" style={{ color: COLORS.goldLight }}>Casa del Cuenco</p>
          </div>

          {/* Progress */}
          <div className="w-full">
            <div className="h-1 bg-white/10 rounded-full mb-3 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-[40%] rounded-full shadow-[0_0_8px_rgba(214,168,91,0.8)]" style={{ backgroundColor: COLORS.goldLight }}></div>
            </div>
            <div className="flex justify-between text-xs font-medium" style={{ color: COLORS.textMuted }}>
              <span>12:34</span>
              <span>30:00</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between px-2">
            <button className="p-2" style={{ color: COLORS.textMuted }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </button>
            <button className="p-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="19 20 9 12 19 4 19 20" />
                <line x1="5" x2="5" y1="19" y2="5" />
              </svg>
            </button>
            <button className="w-[84px] h-[84px] flex items-center justify-center rounded-full relative group">
              <div className="absolute inset-0 rounded-full blur-md opacity-50" style={{ backgroundColor: COLORS.gold }}></div>
              <div className="absolute inset-[2px] rounded-full border border-white/20" style={{ backgroundColor: COLORS.gold }}></div>
              <svg className="relative z-10 ml-2" width="36" height="36" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>
            <button className="p-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4" />
                <line x1="19" x2="19" y1="5" y2="19" />
              </svg>
            </button>
            <button className="p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Visual Selector Strip */}
        <div className="flex flex-col gap-3 -mx-6 px-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium px-2 py-1 rounded bg-white/10 uppercase tracking-widest text-white/80">Fondo</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
            {fondos.map((fondo) => (
              <button
                key={fondo.id}
                onClick={() => setSelectedFondo(fondo)}
                className="snap-start shrink-0 relative w-[80px] h-[100px] rounded-xl overflow-hidden flex flex-col items-center justify-center bg-[#0d121c] border transition-colors"
                style={{
                  borderColor: selectedFondo.id === fondo.id ? COLORS.gold : "rgba(255,255,255,0.05)"
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60"></div>
                <div className="relative z-10 mb-2">
                  <fondo.Component color={fondo.c1} size={40} opacity={selectedFondo.id === fondo.id ? 1 : 0.6} />
                </div>
                <span className="relative z-10 text-[10px] text-center px-1 leading-tight" style={{ color: selectedFondo.id === fondo.id ? COLORS.text : COLORS.textMuted }}>
                  {fondo.name}
                </span>
                {selectedFondo.id === fondo.id && (
                  <div className="absolute inset-0 shadow-[inset_0_0_12px_rgba(190,150,80,0.3)] pointer-events-none rounded-xl"></div>
                )}
              </button>
            ))}
            <div className="w-2 shrink-0"></div>
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
