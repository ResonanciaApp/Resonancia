import { ChevronLeft, Play, Heart, Share2, CloudRain, Waves, Flame, Leaf, Wind, Droplets, Bird, MessageCircle, Send } from "lucide-react";

const GOLD = "#BE9650";
const BG = "#090F17";
const CARD = "#151A23";
const MUTED = "#7A8FA8";
const FG = "#EDE1D3";

const SOUNDS = [
  { id: "lluvia",  name: "Lluvia",  Icon: CloudRain, color: "#1a3a6a", accent: "#4A90D9" },
  { id: "arroyo",  name: "Arroyo",  Icon: Waves,     color: "#0e3a3a", accent: "#4ABFBF" },
  { id: "fogata",  name: "Fogata",  Icon: Flame,     color: "#4a2010", accent: "#E07040" },
  { id: "bosque",  name: "Bosque",  Icon: Leaf,      color: "#1a3020", accent: "#60AA60" },
  { id: "viento",  name: "Viento",  Icon: Wind,      color: "#1c2a3a", accent: "#80A0C0" },
  { id: "oceano",  name: "Océano",  Icon: Droplets,  color: "#0e2a4a", accent: "#3080C0" },
  { id: "pajaros", name: "Pájaros", Icon: Bird,      color: "#24301a", accent: "#90B050" },
];

export function Glassmorphism() {
  return (
    <div className="min-h-screen overflow-y-auto relative" style={{ background: BG, fontFamily: "system-ui, sans-serif" }}>

      {/* Ambient blobs de fondo */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -80, left: -80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(30,60,120,0.55) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: 60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,58,58,0.45) 0%, transparent 70%)", filter: "blur(35px)" }} />
        <div style={{ position: "absolute", top: 200, left: 50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,32,16,0.35) 0%, transparent 70%)", filter: "blur(30px)" }} />
      </div>

      {/* Back */}
      <div className="relative flex items-center px-4 pt-12 pb-6">
        <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
          <ChevronLeft size={22} color={FG} />
        </button>
      </div>

      {/* Grid de sonidos — 4 columnas */}
      <div className="relative px-5 mb-6">
        <div className="grid grid-cols-4 gap-2">
          {SOUNDS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <div className="w-full aspect-square rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${s.color} 0%, rgba(9,15,23,0.8) 100%)`, border: `1px solid ${s.accent}33` }}>
                <s.Icon size={20} color={s.accent} />
              </div>
              <span className="text-center leading-tight" style={{ fontSize: 9, color: MUTED }}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Glass panel principal */}
      <div className="relative mx-4 rounded-3xl px-5 pt-5 pb-6" style={{ background: "rgba(21,26,35,0.75)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>

        {/* Category + title */}
        <span className="text-xs font-bold tracking-widest uppercase block mb-2" style={{ color: GOLD }}>Enfoque</span>
        <h1 className="text-2xl font-extrabold mb-4" style={{ color: FG, lineHeight: 1.2 }}>Foco Profundo</h1>

        {/* Author */}
        <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: "rgba(190,150,80,0.15)", border: `1px solid ${GOLD}44`, color: GOLD }}>U</div>
          <div>
            <p className="text-xs" style={{ color: MUTED }}>Creada por</p>
            <p className="text-sm font-semibold" style={{ color: FG }}>user_3ectutu7aw</p>
          </div>
        </div>

        {/* Play button — glow */}
        <div className="relative mb-4">
          <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: GOLD, filter: "blur(16px)", opacity: 0.3 }} />
          <button className="relative w-full h-14 rounded-full flex items-center justify-center gap-3 font-bold text-base" style={{ background: `linear-gradient(135deg, ${GOLD}, #D6A85B)`, color: BG }}>
            <Play size={22} fill={BG} />
            Reproducir mezcla
          </button>
        </div>

        {/* Like + Share */}
        <div className="flex gap-3 mb-5">
          <button className="flex-1 h-11 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: FG }}>
            <Heart size={17} color={MUTED} /> Me gusta
          </button>
          <button className="flex-1 h-11 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: FG }}>
            <Share2 size={17} color={MUTED} /> Compartir
          </button>
        </div>

        {/* Comments */}
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={15} color={GOLD} />
          <span className="font-bold text-sm" style={{ color: FG }}>Comentarios</span>
        </div>
        <div className="flex items-end gap-2 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <input className="flex-1 text-sm bg-transparent outline-none" placeholder="Deja un comentario…" style={{ color: FG }} readOnly />
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: CARD }}>
            <Send size={13} color={MUTED} />
          </div>
        </div>
        <p className="text-xs mt-3" style={{ color: MUTED }}>Sé el primero en comentar esta mezcla.</p>
      </div>
      <div className="h-10" />
    </div>
  );
}
