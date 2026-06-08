import React, { useState } from "react";
import { Heart, Share, Play, CheckCircle2 } from "lucide-react";
import "./_group.css";

// SVG Components for Geometries

const FlorDeLaVida = ({ color = "#BE9650", className = "" }: { color?: string, className?: string }) => {
  // A simplified flower of life pattern
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`} style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}>
      <g stroke={color} strokeWidth="1" fill="none" opacity="0.8">
        <circle cx="50" cy="50" r="20" />
        <circle cx="50" cy="30" r="20" />
        <circle cx="50" cy="70" r="20" />
        <circle cx="32.68" cy="40" r="20" />
        <circle cx="67.32" cy="40" r="20" />
        <circle cx="32.68" cy="60" r="20" />
        <circle cx="67.32" cy="60" r="20" />
        <circle cx="50" cy="50" r="40" strokeWidth="1.5" />
      </g>
    </svg>
  );
};

const CuboMetatron = ({ color = "#BE9650", className = "" }: { color?: string, className?: string }) => {
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`} style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}>
      <g stroke={color} strokeWidth="0.75" fill="none" opacity="0.85">
        <circle cx="50" cy="50" r="30" />
        <polygon points="50,20 76,35 76,65 50,80 24,65 24,35" />
        <polygon points="50,80 76,35 24,35" />
        <polygon points="50,20 76,65 24,65" />
        <line x1="50" y1="20" x2="50" y2="80" />
        <line x1="24" y1="35" x2="76" y2="65" />
        <line x1="24" y1="65" x2="76" y2="35" />
        <circle cx="50" cy="20" r="6" />
        <circle cx="76" cy="35" r="6" />
        <circle cx="76" cy="65" r="6" />
        <circle cx="50" cy="80" r="6" />
        <circle cx="24" cy="65" r="6" />
        <circle cx="24" cy="35" r="6" />
        <circle cx="50" cy="50" r="6" />
      </g>
    </svg>
  );
};

const Hexagrama = ({ color = "#BE9650", className = "" }: { color?: string, className?: string }) => {
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`} style={{ filter: `drop-shadow(0 0 8px ${color}90)` }}>
      <g stroke={color} strokeWidth="1.2" fill="none" opacity="0.9">
        <polygon points="50,15 80,65 20,65" />
        <polygon points="50,85 80,35 20,35" />
        <circle cx="50" cy="50" r="35" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="20" strokeWidth="0.5" strokeDasharray="2 2" />
      </g>
    </svg>
  );
};

const Mandala = ({ color = "#BE9650", className = "" }: { color?: string, className?: string }) => {
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`} style={{ filter: `drop-shadow(0 0 5px ${color}80)` }}>
      <g stroke={color} strokeWidth="1" fill="none" opacity="0.85">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <ellipse key={angle} cx="50" cy="50" rx="35" ry="12" transform={`rotate(${angle} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="15" />
        <circle cx="50" cy="50" r="5" fill={color} opacity="0.3" />
      </g>
    </svg>
  );
};

const Circulos = ({ color = "#BE9650", className = "" }: { color?: string, className?: string }) => {
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`} style={{ filter: `drop-shadow(0 0 5px ${color}70)` }}>
      <g stroke={color} strokeWidth="0.8" fill="none" opacity="0.7">
        <circle cx="50" cy="50" r="45" />
        <circle cx="50" cy="50" r="35" />
        <circle cx="50" cy="50" r="25" />
        <circle cx="50" cy="50" r="15" />
      </g>
    </svg>
  );
};

const Loto = ({ color = "#BE9650", className = "" }: { color?: string, className?: string }) => {
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${className}`} style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}>
      <g stroke={color} strokeWidth="1" fill="none" opacity="0.8">
        <path d="M50 80 C 20 60, 20 40, 50 20 C 80 40, 80 60, 50 80" />
        <path d="M50 80 C 35 60, 35 40, 50 20 C 65 40, 65 60, 50 80" />
        <path d="M50 80 C 45 60, 45 40, 50 20 C 55 40, 55 60, 50 80" />
      </g>
    </svg>
  );
};

// Data
const FEED_DATA = [
  {
    id: "1",
    author: "Sofía R.",
    authorAvatar: "S",
    time: "hace 5 h",
    title: "Portal de luz",
    geometries: 2,
    likes: 128,
    isLiked: true,
    isDestacada: true,
    composition: (
      <div className="relative w-full h-full flex items-center justify-center animate-geo-breathe">
        <div className="absolute w-[80%] h-[80%] animate-geo-spin-reverse">
          <Circulos color="#7FD1C0" />
        </div>
        <div className="absolute w-[60%] h-[60%] animate-geo-spin">
          <CuboMetatron color="#BE9650" />
        </div>
      </div>
    )
  },
  {
    id: "2",
    author: "Mateo Luz",
    authorAvatar: "M",
    time: "hace 1 d",
    title: "Respiración del cosmos",
    geometries: 2,
    likes: 84,
    isLiked: false,
    isDestacada: false,
    composition: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute w-[70%] h-[70%] animate-geo-spin">
          <Hexagrama color="#7AA8E0" />
        </div>
        <div className="absolute w-[85%] h-[85%] animate-geo-breathe">
          <FlorDeLaVida color="#EDE1D3" />
        </div>
      </div>
    )
  },
  {
    id: "3",
    author: "Casa del Cuenco",
    authorAvatar: "C",
    time: "hace 2 d",
    title: "Mandala de cuarzo",
    geometries: 2,
    likes: 256,
    isLiked: true,
    isDestacada: true,
    composition: (
      <div className="relative w-full h-full flex items-center justify-center animate-geo-pulse">
        <div className="absolute w-[90%] h-[90%] animate-geo-spin-reverse">
          <Mandala color="#D6A85B" />
        </div>
        <div className="absolute w-[50%] h-[50%] animate-geo-breathe">
          <Loto color="#B69BE0" />
        </div>
      </div>
    )
  }
];


export function MuroComunidad() {
  const [activeTab, setActiveTab] = useState<"destacadas" | "recientes">("destacadas");
  const [likes, setLikes] = useState<Record<string, boolean>>(
    FEED_DATA.reduce((acc, item) => ({ ...acc, [item.id]: item.isLiked }), {})
  );

  const toggleLike = (id: string) => {
    setLikes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-[390px] h-[844px] overflow-hidden flex flex-col font-sans" style={{ background: "linear-gradient(to bottom, #090D20, #080A18, #06070F)", color: "#EDE1D3" }}>
      
      {/* Header */}
      <div className="pt-[52px] pb-4 px-6 flex flex-col gap-6 shrink-0 z-10 bg-gradient-to-b from-[#090D20] to-transparent">
        <h1 className="text-2xl font-medium tracking-wide text-center" style={{ color: "#D6A85B" }}>Comunidad</h1>
        
        <div className="flex bg-[rgba(190,150,80,0.05)] p-1 rounded-full border border-[#161f33]">
          <button 
            onClick={() => setActiveTab("destacadas")}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all duration-300 ${activeTab === "destacadas" ? "bg-[#161f33] text-[#BE9650] shadow-sm" : "text-[#7A8FA8]"}`}
          >
            Destacadas
          </button>
          <button 
            onClick={() => setActiveTab("recientes")}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-all duration-300 ${activeTab === "recientes" ? "bg-[#161f33] text-[#BE9650] shadow-sm" : "text-[#7A8FA8]"}`}
          >
            Recientes
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto pb-[80px] px-4 hide-scrollbar flex flex-col gap-6">
        {FEED_DATA.map((item) => (
          <div key={item.id} className="flex flex-col bg-[rgba(190,150,80,0.05)] rounded-3xl border border-[#161f33] overflow-hidden relative">
            
            {/* Preview Box */}
            <div className="h-[280px] relative w-full overflow-hidden bg-[#06070F] flex items-center justify-center border-b border-[#161f33]">
              {/* Subtle ambient light behind geometry */}
              <div className="absolute inset-0 opacity-30 mix-blend-screen bg-gradient-to-tr from-[#BE965020] to-transparent"></div>
              {item.composition}
              
              {/* Badge Destacada */}
              {item.isDestacada && (
                <div className="absolute top-4 right-4 bg-[#BE9650]/20 backdrop-blur-md border border-[#BE9650]/40 text-[#D6A85B] text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(190,150,80,0.2)]">
                  <CheckCircle2 size={12} className="text-[#D6A85B]" />
                  <span>Destacada</span>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-5 flex flex-col gap-4">
              
              {/* Author Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#161f33] flex items-center justify-center border border-[#7A8FA8]/20 text-xs font-medium text-[#D6A85B]">
                    {item.authorAvatar}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.author}</span>
                    <span className="text-[11px] text-[#7A8FA8]">{item.time}</span>
                  </div>
                </div>
              </div>

              {/* Title & Meta */}
              <div>
                <h3 className="text-lg font-medium tracking-wide mb-1">{item.title}</h3>
                <p className="text-xs text-[#7A8FA8]">{item.geometries} geometrías</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleLike(item.id)}
                    className="flex items-center gap-1.5 transition-colors"
                  >
                    <Heart 
                      size={20} 
                      className={`transition-all duration-300 ${likes[item.id] ? "fill-[#BE9650] text-[#BE9650]" : "text-[#7A8FA8] hover:text-[#EDE1D3]"}`} 
                    />
                    <span className={`text-xs font-medium ${likes[item.id] ? "text-[#BE9650]" : "text-[#7A8FA8]"}`}>
                      {likes[item.id] ? item.likes + 1 : item.likes}
                    </span>
                  </button>
                  <button className="text-[#7A8FA8] hover:text-[#EDE1D3] transition-colors p-1">
                    <Share size={18} />
                  </button>
                </div>
                
                <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#BE9650]/40 text-[#D6A85B] text-sm font-medium hover:bg-[#BE9650]/10 transition-colors">
                  <Play size={14} fill="currentColor" />
                  Abrir en vivo
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Fade Bottom Overlay (optional) */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#06070F] to-transparent pointer-events-none" />

    </div>
  );
}
