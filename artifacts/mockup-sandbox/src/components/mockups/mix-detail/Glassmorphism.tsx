import { ChevronLeft, Play, Heart, Share2, MessageCircle, Send } from "lucide-react";

const GOLD = "#BE9650";
const BG = "#090F17";
const CARD = "#151A23";
const MUTED = "#7A8FA8";
const FG = "#EDE1D3";

const SOUNDS = [
  { id: "lluvia",  name: "Lluvia",  img: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=160&q=70&fit=crop" },
  { id: "arroyo",  name: "Arroyo",  img: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=160&q=70&fit=crop" },
  { id: "fogata",  name: "Fogata",  img: "https://images.unsplash.com/photo-1564227901-6b1d20bebe9d?w=160&q=70&fit=crop" },
  { id: "bosque",  name: "Bosque",  img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=160&q=70&fit=crop" },
  { id: "viento",  name: "Viento",  img: "https://images.unsplash.com/photo-1505816014357-96b5ff457e9a?w=160&q=70&fit=crop" },
  { id: "oceano",  name: "Océano",  img: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=160&q=70&fit=crop" },
  { id: "pajaros", name: "Pájaros", img: "https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=160&q=70&fit=crop" },
];

export function Glassmorphism() {
  return (
    <div className="min-h-screen overflow-y-auto relative" style={{ background: BG, fontFamily: "system-ui, sans-serif" }}>

      {/* Back */}
      <div className="relative flex items-center px-4 pt-12 pb-6">
        <button className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}>
          <ChevronLeft size={22} color={FG} />
        </button>
      </div>

      {/* Grid de sonidos — 4 columnas con imágenes */}
      <div className="relative px-5 mb-6">
        <div className="grid grid-cols-4 gap-2">
          {SOUNDS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <div className="w-full aspect-square rounded-2xl overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                <img
                  src={s.img}
                  alt={s.name}
                  className="w-full h-full"
                  style={{ objectFit: "cover", display: "block" }}
                />
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

        {/* Like + Share — sin borde */}
        <div className="flex gap-3 mb-5">
          <button className="flex-1 h-11 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: FG }}>
            <Heart size={17} color={MUTED} /> Me gusta
          </button>
          <button className="flex-1 h-11 flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: FG }}>
            <Share2 size={17} color={MUTED} /> Compartir
          </button>
        </div>

        {/* Comments — sin borde en el input */}
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={15} color={GOLD} />
          <span className="font-bold text-sm" style={{ color: FG }}>Comentarios</span>
        </div>
        <div className="flex items-end gap-2 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }}>
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
