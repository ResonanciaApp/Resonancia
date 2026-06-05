import { ChevronLeft, Play, Heart, Share2, CloudRain, Waves, Flame, Leaf, Wind, Droplets, Bird, MessageCircle, Send, Music2 } from "lucide-react";

const GOLD = "#BE9650";
const BG = "#090F17";
const CARD = "#151A23";
const MUTED = "#7A8FA8";
const FG = "#EDE1D3";
const BORDER = "rgba(255,255,255,0.07)";

const SOUNDS = [
  { id: "lluvia",  name: "Lluvia",  Icon: CloudRain, bg: "#1a3a6a" },
  { id: "arroyo",  name: "Arroyo",  Icon: Waves,     bg: "#0e3a3a" },
  { id: "fogata",  name: "Fogata",  Icon: Flame,     bg: "#4a2010" },
  { id: "bosque",  name: "Bosque",  Icon: Leaf,      bg: "#1a3020" },
  { id: "viento",  name: "Viento",  Icon: Wind,      bg: "#1c2a3a" },
  { id: "oceano",  name: "Océano",  Icon: Droplets,  bg: "#0e2a4a" },
  { id: "pajaros", name: "Pájaros", Icon: Bird,      bg: "#24301a" },
];

export function AutorDestacado() {
  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: BG, color: FG, fontFamily: "system-ui, sans-serif" }}>

      {/* Back */}
      <div className="flex items-center px-4 pt-12 pb-2">
        <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <ChevronLeft size={22} color={FG} />
        </button>
      </div>

      {/* AUTOR — sección prominente */}
      <div className="flex flex-col items-center pt-4 pb-6 px-5">
        {/* Avatar grande con aro dorado */}
        <div className="relative mb-3">
          <div style={{ position: "absolute", inset: -3, borderRadius: "50%", background: `conic-gradient(${GOLD}, #D6A85B, transparent, ${GOLD})`, opacity: 0.6 }} />
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold" style={{ background: CARD, border: `2px solid ${CARD}`, color: GOLD }}>
            U
          </div>
        </div>
        <p className="text-base font-bold mb-0.5" style={{ color: FG }}>user_3ectutu7aw</p>
        <p className="text-xs" style={{ color: MUTED }}>Creador de mezclas</p>
      </div>

      {/* Mix info */}
      <div className="px-5 mb-5 text-center">
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: GOLD }}>Enfoque</p>
        <h1 className="text-2xl font-extrabold mb-4" style={{ color: FG }}>Foco Profundo</h1>

        {/* Stats row */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-extrabold" style={{ color: FG }}>7</span>
            <span className="text-xs" style={{ color: MUTED }}>Sonidos</span>
          </div>
          <div style={{ width: 1, background: BORDER }} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-extrabold" style={{ color: FG }}>2</span>
            <span className="text-xs" style={{ color: MUTED }}>Me gusta</span>
          </div>
          <div style={{ width: 1, background: BORDER }} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-extrabold" style={{ color: FG }}>0</span>
            <span className="text-xs" style={{ color: MUTED }}>Comentarios</span>
          </div>
        </div>

        {/* Play button */}
        <button className="w-full h-14 rounded-full flex items-center justify-center gap-3 font-bold text-base mb-4" style={{ background: GOLD, color: BG }}>
          <Play size={22} fill={BG} />
          Reproducir mezcla
        </button>

        {/* Like + Share */}
        <div className="flex gap-3 mb-6">
          <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold" style={{ background: "rgba(190,150,80,0.10)", border: `1px solid rgba(190,150,80,0.22)`, color: FG }}>
            <Heart size={17} color={MUTED} /> Me gusta
          </button>
          <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold" style={{ background: "rgba(190,150,80,0.10)", border: `1px solid rgba(190,150,80,0.22)`, color: FG }}>
            <Share2 size={17} color={MUTED} /> Compartir
          </button>
        </div>
      </div>

      {/* Sonidos — fila horizontal con chips */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Music2 size={14} color={GOLD} />
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: MUTED }}>Sonidos de la mezcla</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SOUNDS.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: s.bg, border: `1px solid rgba(255,255,255,0.08)` }}>
              <s.Icon size={11} color="rgba(255,255,255,0.65)" />
              <span className="text-xs font-medium" style={{ color: FG }}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={15} color={GOLD} />
          <span className="font-bold text-base" style={{ color: FG }}>Comentarios</span>
        </div>
        <div className="flex items-end gap-3 p-3 rounded-2xl mb-2" style={{ background: "rgba(190,150,80,0.06)", border: `1px solid rgba(190,150,80,0.16)` }}>
          <input className="flex-1 text-sm bg-transparent outline-none" placeholder="Deja un comentario…" style={{ color: FG }} readOnly />
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: CARD }}>
            <Send size={15} color={MUTED} />
          </div>
        </div>
        <p className="text-sm mt-3" style={{ color: MUTED }}>Sé el primero en comentar esta mezcla.</p>
      </div>
      <div className="h-10" />
    </div>
  );
}
