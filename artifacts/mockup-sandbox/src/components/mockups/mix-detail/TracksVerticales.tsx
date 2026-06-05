import { ChevronLeft, Play, Pause, Heart, Share2, CloudRain, Waves, Flame, Leaf, Wind, Droplets, Bird, MessageCircle, Send } from "lucide-react";

const GOLD = "#BE9650";
const BG = "#090F17";
const CARD = "#151A23";
const MUTED = "#7A8FA8";
const FG = "#EDE1D3";
const BORDER = "rgba(255,255,255,0.07)";

const SOUNDS = [
  { id: "lluvia",  name: "Lluvia",  Icon: CloudRain, color: "#1E3A5F" },
  { id: "arroyo",  name: "Arroyo",  Icon: Waves,     color: "#163D3D" },
  { id: "fogata",  name: "Fogata",  Icon: Flame,     color: "#4A2010" },
  { id: "bosque",  name: "Bosque",  Icon: Leaf,      color: "#1A3020" },
  { id: "viento",  name: "Viento",  Icon: Wind,      color: "#1C2A3A" },
  { id: "oceano",  name: "Océano",  Icon: Droplets,  color: "#0E2A4A" },
  { id: "pajaros", name: "Pájaros", Icon: Bird,      color: "#24301A" },
];

export function TracksVerticales() {
  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: BG, color: FG, fontFamily: "system-ui, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <ChevronLeft size={22} color={FG} />
        </button>
        <div className="flex-1" />
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: GOLD }}>Enfoque</span>
      </div>

      {/* Title + author */}
      <div className="px-5 pb-4">
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: FG }}>Foco Profundo</h1>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: CARD, border: `1px solid ${BORDER}`, color: GOLD }}>U</div>
          <span className="text-sm" style={{ color: MUTED }}>Creada por user_3ectutu7aw</span>
        </div>
      </div>

      {/* Track list — al estilo MixerSheet */}
      <div className="px-5 mb-5">
        <p className="text-xs font-semibold tracking-widest mb-3 uppercase" style={{ color: MUTED }}>Sonidos · {SOUNDS.length}</p>
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          {SOUNDS.map((s, i) => (
            <div key={s.id}>
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Thumb */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.color }}>
                  <s.Icon size={16} color="rgba(255,255,255,0.7)" />
                </div>
                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold mb-1.5" style={{ color: FG }}>{s.name}</p>
                  {/* Nivel de volumen (read-only) */}
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${55 + i * 6}%`, background: `linear-gradient(90deg, ${GOLD}88, ${GOLD})` }} />
                  </div>
                </div>
              </div>
              {i < SOUNDS.length - 1 && <div style={{ height: 1, background: BORDER, marginLeft: 56 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Play button */}
      <div className="px-5 mb-4">
        <button className="w-full h-14 rounded-full flex items-center justify-center gap-3 font-bold text-base" style={{ background: GOLD, color: BG }}>
          <Play size={22} fill={BG} />
          Reproducir mezcla
        </button>
      </div>

      {/* Like + Share */}
      <div className="flex gap-3 px-5 mb-6">
        <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold" style={{ background: "rgba(190,150,80,0.10)", border: `1px solid rgba(190,150,80,0.22)`, color: FG }}>
          <Heart size={18} color={MUTED} /> Me gusta
        </button>
        <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold" style={{ background: "rgba(190,150,80,0.10)", border: `1px solid rgba(190,150,80,0.22)`, color: FG }}>
          <Share2 size={18} color={MUTED} /> Compartir
        </button>
      </div>

      {/* Comments */}
      <div className="px-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={16} color={GOLD} />
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
