import React from "react";
import "./_group.css";
import { Play, Heart, Share2, MoreHorizontal, Settings2, Moon, Sun, Wind, Activity, Music, Compass } from "lucide-react";

const PALETTE = {
  bg1: "#090D20",
  bg2: "#080A18",
  bg3: "#06070F",
  gold: "#BE9650",
  goldLight: "#D6A85B",
  cardBg: "#151A23",
  cardBorder: "#161f33",
  textMain: "#EDE1D3",
  textMuted: "#7A8FA8",
};

function FlorDeLaVidaSVG({ color, opacity = 1, className = "" }: { color: string, opacity?: number, className?: string }) {
  // Flor de la vida simple (7 círculos)
  return (
    <svg viewBox="0 0 100 100" className={className} style={{ opacity, filter: `drop-shadow(0 0 8px ${color})` }}>
      <g stroke={color} strokeWidth="1" fill="none">
        <circle cx="50" cy="50" r="16" />
        <circle cx="50" cy="34" r="16" />
        <circle cx="50" cy="66" r="16" />
        <circle cx="36.14" cy="42" r="16" />
        <circle cx="63.86" cy="42" r="16" />
        <circle cx="36.14" cy="58" r="16" />
        <circle cx="63.86" cy="58" r="16" />
        <circle cx="50" cy="50" r="32" strokeWidth="0.5" />
      </g>
    </svg>
  );
}

function SriYantraSVG({ color, opacity = 1, className = "" }: { color: string, opacity?: number, className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={{ opacity, filter: `drop-shadow(0 0 8px ${color})` }}>
      <g stroke={color} strokeWidth="1" fill="none">
        <polygon points="50,15 80,75 20,75" />
        <polygon points="50,85 80,25 20,25" />
        <polygon points="50,30 70,65 30,65" />
        <polygon points="50,70 70,35 30,35" />
        <circle cx="50" cy="50" r="40" strokeWidth="0.5" />
      </g>
    </svg>
  );
}

export function FondoInicio() {
  return (
    <div 
      className="relative overflow-hidden w-full mx-auto"
      style={{ 
        width: '390px', 
        height: '844px',
        background: `linear-gradient(to bottom, ${PALETTE.bg1}, ${PALETTE.bg2}, ${PALETTE.bg3})`,
        color: PALETTE.textMain,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* BACKGROUND GEOMETRIES */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Deep background blur */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] z-0"></div>
        
        <div className="relative z-10 w-[800px] h-[800px] flex items-center justify-center opacity-25">
          <FlorDeLaVidaSVG 
            color="#BE9650" 
            className="absolute w-[600px] h-[600px] animate-geo-spin-reverse opacity-40" 
          />
          <SriYantraSVG 
            color="#7FD1C0" 
            className="absolute w-[500px] h-[500px] animate-geo-spin opacity-50" 
          />
          <FlorDeLaVidaSVG 
            color="#7AA8E0" 
            className="absolute w-[800px] h-[800px] animate-geo-breathe opacity-20" 
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative z-20 h-full flex flex-col px-5 pt-[60px] pb-[32px] overflow-y-auto hide-scrollbar">
        
        {/* Header / Top Bar */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-medium tracking-tight mb-1" style={{ color: PALETTE.textMain }}>Buenas noches</h1>
            <p className="text-base" style={{ color: PALETTE.textMuted }}>¿List@ para descansar?</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border" style={{ borderColor: PALETTE.cardBorder }}>
            <Settings2 size={12} style={{ color: PALETTE.goldLight }} />
            <span className="text-[10px] font-medium tracking-wide uppercase" style={{ color: PALETTE.goldLight }}>Flor dorada</span>
          </div>
        </div>

        {/* Frase del dia */}
        <div 
          className="rounded-2xl p-5 mb-8 backdrop-blur-md relative overflow-hidden group"
          style={{ backgroundColor: 'rgba(21, 26, 35, 0.6)', borderColor: PALETTE.cardBorder, borderWidth: '1px' }}
        >
          <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${PALETTE.gold}, transparent)` }}></div>
          <p className="text-lg italic leading-relaxed mb-3 font-light">"El silencio no está vacío, está lleno de respuestas."</p>
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: PALETTE.gold }}>— Proverbio Zen</p>
        </div>

        {/* Continuar escuchando */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4" style={{ color: PALETTE.textMain }}>Continuar escuchando</h2>
          <div 
            className="flex items-center gap-4 rounded-2xl p-4 backdrop-blur-md"
            style={{ backgroundColor: 'rgba(21, 26, 35, 0.6)', borderColor: PALETTE.cardBorder, borderWidth: '1px' }}
          >
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1c2333] to-[#0f131f] flex items-center justify-center border border-white/5 relative overflow-hidden">
               <Moon size={24} style={{ color: PALETTE.gold }} className="opacity-80" />
               <div className="absolute bottom-0 left-0 h-1 bg-[#BE9650]" style={{ width: '65%' }}></div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium mb-1">Viaje a las estrellas</h3>
              <p className="text-xs mb-2" style={{ color: PALETTE.textMuted }}>Meditación profunda • 45 min</p>
              <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: '65%', backgroundColor: PALETTE.gold }}></div>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 ml-2">
              <Play size={18} fill="currentColor" className="ml-1" />
            </button>
          </div>
        </div>

        {/* Categorías */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4" style={{ color: PALETTE.textMain }}>Explorar</h2>
          <div className="grid grid-cols-2 gap-3">
            <CategoryCard title="Meditaciones" icon={<Compass size={20} />} color="#BE9650" />
            <CategoryCard title="Para dormir" icon={<Moon size={20} />} color="#7FD1C0" />
            <CategoryCard title="Sonidos" icon={<Music size={20} />} color="#7AA8E0" />
            <CategoryCard title="Respiración" icon={<Wind size={20} />} color="#D6A85B" />
          </div>
        </div>

      </div>

      {/* Tab Bar mock */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[88px] flex justify-around items-center px-6 pb-6 pt-2 z-30 backdrop-blur-xl"
        style={{ 
          background: 'linear-gradient(to top, rgba(6,7,15,0.95) 0%, rgba(6,7,15,0.6) 100%)',
          borderTop: `1px solid ${PALETTE.cardBorder}`
        }}
      >
        <div className="flex flex-col items-center gap-1 opacity-100">
          <Activity size={24} style={{ color: PALETTE.gold }} />
          <span className="text-[10px] font-medium" style={{ color: PALETTE.gold }}>Inicio</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50">
          <Compass size={24} />
          <span className="text-[10px]">Explorar</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50">
          <Settings2 size={24} />
          <span className="text-[10px]">Geometrix</span>
        </div>
        <div className="flex flex-col items-center gap-1 opacity-50">
          <Moon size={24} />
          <span className="text-[10px]">Perfil</span>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ title, icon, color }: { title: string, icon: React.ReactNode, color: string }) {
  return (
    <div 
      className="flex flex-col items-start gap-3 p-4 rounded-2xl backdrop-blur-sm relative overflow-hidden"
      style={{ backgroundColor: 'rgba(21, 26, 35, 0.4)', borderColor: PALETTE.cardBorder, borderWidth: '1px' }}
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        {icon}
      </div>
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}
