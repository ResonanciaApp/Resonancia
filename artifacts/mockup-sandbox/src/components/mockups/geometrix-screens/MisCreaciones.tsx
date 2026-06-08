import React from "react";
import { ChevronLeft, Cloud, Heart, MoreHorizontal, Plus } from "lucide-react";
import "./_group.css";

// --- Geometrías SVG Componentes ---

const Toroide = ({ color = "#BE9650", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    {[...Array(12)].map((_, i) => (
      <ellipse
        key={i}
        cx="50"
        cy="50"
        rx="40"
        ry="15"
        fill="none"
        stroke={color}
        strokeWidth="1"
        transform={`rotate(${i * 15} 50 50)`}
        className="opacity-70"
      />
    ))}
  </svg>
);

const Hexagrama = ({ color = "#7FD1C0", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    <polygon
      points="50,15 80,70 20,70"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      className="opacity-80"
    />
    <polygon
      points="50,85 80,30 20,30"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      className="opacity-80"
    />
    <circle cx="50" cy="50" r="38" fill="none" stroke={color} strokeWidth="1" className="opacity-50" />
  </svg>
);

const Merkaba = ({ color = "#B69BE0", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    <polygon points="50,10 85,75 15,75" fill="none" stroke={color} strokeWidth="1.5" className="opacity-90" />
    <polygon points="50,90 85,25 15,25" fill="none" stroke={color} strokeWidth="1.5" className="opacity-90" />
    <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 4" className="opacity-40" />
  </svg>
);

const Metatron = ({ color = "#D6A85B", className = "" }) => {
  const r = 35;
  const cx = 50, cy = 50;
  const nodes = [
    [cx, cy], // center
    [cx, cy - r], // top
    [cx + r * Math.cos(Math.PI / 6), cy - r * Math.sin(Math.PI / 6)],
    [cx + r * Math.cos(Math.PI / 6), cy + r * Math.sin(Math.PI / 6)],
    [cx, cy + r],
    [cx - r * Math.cos(Math.PI / 6), cy + r * Math.sin(Math.PI / 6)],
    [cx - r * Math.cos(Math.PI / 6), cy - r * Math.sin(Math.PI / 6)],
  ];
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
      {nodes.map((n1, i) =>
        nodes.map((n2, j) => {
          if (i < j) {
            return (
              <line key={`${i}-${j}`} x1={n1[0]} y1={n1[1]} x2={n2[0]} y2={n2[1]} stroke={color} strokeWidth="0.5" className="opacity-40" />
            );
          }
          return null;
        })
      )}
      {nodes.map((n, i) => (
        <circle key={i} cx={n[0]} cy={n[1]} r="6" fill="none" stroke={color} strokeWidth="1" className="opacity-80" />
      ))}
    </svg>
  );
};

const Mandala = ({ color = "#E0989B", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    <circle cx="50" cy="50" r="10" fill="none" stroke={color} strokeWidth="1" className="opacity-60" />
    <circle cx="50" cy="50" r="25" fill="none" stroke={color} strokeWidth="1" className="opacity-60" />
    <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="1" className="opacity-60" />
    {[...Array(8)].map((_, i) => (
      <path
        key={i}
        d="M50 10 C60 30, 60 50, 50 50 C40 50, 40 30, 50 10"
        fill="none"
        stroke={color}
        strokeWidth="1"
        transform={`rotate(${i * 45} 50 50)`}
        className="opacity-70"
      />
    ))}
  </svg>
);

const Circulos = ({ color = "#7AA8E0", className = "" }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`}>
    {[10, 20, 30, 40, 48].map((r, i) => (
      <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="1" className="opacity-70" />
    ))}
  </svg>
);


// --- Datos ---

const creaciones = [
  {
    id: 1,
    name: "Flor dorada",
    meta: "3 geometrías · hace 2 días",
    liked: true,
    glyphs: [
      { Comp: Metatron, color: "#BE9650", className: "animate-geo-spin" },
      { Comp: Toroide, color: "#D6A85B", className: "animate-geo-spin-reverse scale-75" }
    ]
  },
  {
    id: 2,
    name: "Calma profunda",
    meta: "1 geometría · hace 5 días",
    liked: false,
    glyphs: [
      { Comp: Circulos, color: "#7FD1C0", className: "animate-geo-breathe" }
    ]
  },
  {
    id: 3,
    name: "Portal de luz",
    meta: "2 geometrías · 1 sem",
    liked: true,
    glyphs: [
      { Comp: Hexagrama, color: "#EDE1D3", className: "animate-geo-pulse" },
      { Comp: Mandala, color: "#B69BE0", className: "scale-125 opacity-50" }
    ]
  },
  {
    id: 4,
    name: "Sueño estelar",
    meta: "3 geometrías · 2 sem",
    liked: false,
    glyphs: [
      { Comp: Merkaba, color: "#7AA8E0", className: "animate-geo-spin" },
      { Comp: Hexagrama, color: "#9BD6A8", className: "scale-50 animate-geo-spin-reverse" }
    ]
  },
  {
    id: 5,
    name: "Respiración",
    meta: "2 geometrías · 1 mes",
    liked: true,
    glyphs: [
      { Comp: Toroide, color: "#E0989B", className: "animate-geo-breathe" },
      { Comp: Metatron, color: "#7AA8E0", className: "scale-50" }
    ]
  },
  {
    id: 6,
    name: "Mandala de cuarzo",
    meta: "3 geometrías · 2 meses",
    liked: false,
    glyphs: [
      { Comp: Mandala, color: "#EDE1D3", className: "animate-geo-spin" },
      { Comp: Hexagrama, color: "#9BD6A8", className: "scale-75 animate-geo-pulse" },
      { Comp: Circulos, color: "#BE9650", className: "scale-50 animate-geo-breathe" }
    ]
  },
];


export function MisCreaciones() {
  return (
    <div 
      className="relative w-full h-[844px] max-w-[390px] overflow-hidden text-[#EDE1D3] font-sans mx-auto"
      style={{
        background: "linear-gradient(180deg, #090D20 0%, #080A18 50%, #06070F 100%)",
      }}
    >
      {/* Header */}
      <div className="pt-[52px] pb-4 px-6 flex items-center justify-between sticky top-0 z-10 bg-[#090D20]/80 backdrop-blur-md border-b border-[#161f33]">
        <div className="flex items-center gap-3">
          <button className="text-[#EDE1D3] hover:text-[#BE9650] transition-colors">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium tracking-wide">Mis creaciones</h1>
            <span className="bg-[rgba(100,142,195,0.14)] border border-[#161f33] text-[#7A8FA8] text-xs px-2 py-0.5 rounded-full font-medium">
              6
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[#7A8FA8]">
          <Cloud size={14} />
          <span className="text-[10px] font-medium tracking-wider uppercase">Sync</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-6 pb-[28px] overflow-y-auto h-[calc(100%-100px)]">
        <div className="grid grid-cols-2 gap-4">
          
          {/* Nueva Composición Card */}
          <button className="flex flex-col items-center justify-center h-[220px] rounded-2xl border border-dashed border-[#BE9650]/40 bg-[#BE9650]/5 hover:bg-[#BE9650]/10 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-[rgba(100,142,195,0.14)] border border-[#BE9650]/30 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Plus size={24} className="text-[#BE9650]" />
            </div>
            <span className="text-sm font-medium text-[#BE9650]">Nueva</span>
            <span className="text-sm font-medium text-[#BE9650]">composición</span>
          </button>

          {/* Creaciones Cards */}
          {creaciones.map((creacion) => (
            <div key={creacion.id} className="flex flex-col group cursor-pointer">
              {/* Preview Box */}
              <div className="relative w-full aspect-square rounded-2xl bg-[rgba(100,142,195,0.14)] border border-[#161f33] overflow-hidden mb-3 flex items-center justify-center p-4">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
                
                {/* Glyphs */}
                <div className="relative w-full h-full flex items-center justify-center mix-blend-screen">
                  {creacion.glyphs.map((g, idx) => (
                    <div key={idx} className={`absolute inset-0 flex items-center justify-center ${g.className}`} style={{ filter: `drop-shadow(0 0 6px ${g.color}40)` }}>
                      <g.Comp color={g.color} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="px-1 flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-medium text-[#EDE1D3] leading-tight mb-1">{creacion.name}</h3>
                  <p className="text-[11px] text-[#7A8FA8] tracking-wide">{creacion.meta}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <button className={`${creacion.liked ? 'text-[#BE9650]' : 'text-[#7A8FA8] hover:text-[#EDE1D3]'} transition-colors`}>
                    <Heart size={14} fill={creacion.liked ? 'currentColor' : 'none'} strokeWidth={2} />
                  </button>
                  <button className="text-[#7A8FA8] hover:text-[#EDE1D3] transition-colors">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
