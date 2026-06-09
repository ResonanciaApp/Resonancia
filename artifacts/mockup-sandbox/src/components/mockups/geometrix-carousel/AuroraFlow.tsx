import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GEOMS, PALETTE } from "./_shared/data";

const AUTO_PLAY_SEQUENCE = [
  { action: "select", id: "flower" },
  { action: "select", id: "metatron" },
  { action: "select", id: "sri" },
  { action: "deselect", id: "metatron" },
  { action: "clear" },
];

export default function AuroraFlow() {
  const [selected, setSelected] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const stepRef = useRef(0);

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const step = AUTO_PLAY_SEQUENCE[stepRef.current];
      
      if (step.action === "select" && step.id) {
        setSelected((prev) => prev.includes(step.id!) ? prev : [...prev, step.id!]);
      } else if (step.action === "deselect" && step.id) {
        setSelected((prev) => prev.filter((id) => id !== step.id));
      } else if (step.action === "clear") {
        setSelected([]);
      }

      stepRef.current = (stepRef.current + 1) % AUTO_PLAY_SEQUENCE.length;
    }, 3000); // Very slow

    return () => clearInterval(interval);
  }, [isPlaying]);

  const displayOrder = [
    ...selected,
    ...GEOMS.filter((g) => !selected.includes(g.id)).map((g) => g.id),
  ];

  const handleTap = (id: string) => {
    setIsPlaying(false);
    toggleSelection(id);
  };

  // Fluid, slow animation transition
  const spring = {
    type: "tween",
    ease: [0.25, 0.1, 0.25, 1],
    duration: 1.5,
  };

  return (
    <div
      className="relative flex flex-col w-full min-h-[100dvh] overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.fg, padding: "16px" }}
    >
      <style>{`
        .aurora-gradient-bg {
          background: linear-gradient(120deg, rgba(190,150,80,0.05), rgba(111,179,199,0.05), rgba(199,125,168,0.05), rgba(190,150,80,0.05));
          background-size: 300% 300%;
          animation: aurora-sweep 15s ease infinite;
        }
        @keyframes aurora-sweep {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 z-10">
        <div>
          <h1 className="text-xl font-light tracking-widest uppercase" style={{ color: PALETTE.gold }}>Geometrix</h1>
          <p className="text-xs tracking-wider opacity-60">Aurora · resplandor</p>
        </div>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-xs tracking-widest uppercase opacity-50 hover:opacity-100 transition-opacity"
        >
          {isPlaying ? "|| Pausa" : "▷ Repetir"}
        </button>
      </div>

      {/* Lienzo */}
      <div
        className="relative flex-grow rounded-3xl overflow-hidden mb-6 aurora-gradient-bg"
        style={{ border: `1px solid ${PALETTE.border}` }}
      >
        {selected.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center opacity-30 text-sm tracking-widest uppercase">
            Selecciona geometrías
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {selected.map((id, index) => {
                const geom = GEOMS.find((g) => g.id === id)!;
                const Glyph = geom.Glyph;
                const isTop = index === 0;
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    animate={{
                      opacity: isTop ? 1 : 0.3 - index * 0.1,
                      scale: 1 - index * 0.05,
                      filter: "blur(0px)",
                      zIndex: selected.length - index,
                    }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                    transition={spring}
                    className="absolute"
                  >
                    <Glyph
                      color={geom.color}
                      size={200}
                      strokeWidth={1.5}
                      style={{
                        filter: isTop ? `drop-shadow(0 0 20px ${geom.color}66)` : "none",
                        transition: "filter 1.5s ease-in-out",
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Carousel */}
      <div className="relative h-[100px] shrink-0 aurora-gradient-bg rounded-2xl flex items-center overflow-hidden" style={{ border: `1px solid ${PALETTE.border}` }}>
        <div className="flex gap-4 items-center overflow-x-auto px-4 w-full h-full">
          <AnimatePresence>
            {displayOrder.map((id) => {
              const geom = GEOMS.find((g) => g.id === id)!;
              const Glyph = geom.Glyph;
              const isSelected = selected.includes(id);

              return (
                <motion.button
                  key={id}
                  layout
                  transition={spring}
                  onClick={() => handleTap(id)}
                  className="relative w-[76px] h-[76px] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{
                    backgroundColor: isSelected ? `${geom.color}15` : 'transparent',
                    border: `1px solid ${isSelected ? `${geom.color}40` : PALETTE.border}`,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isSelected ? 1 : 0.4,
                      scale: isSelected ? 1.1 : 1,
                    }}
                    transition={spring}
                  >
                    <Glyph
                      color={isSelected ? geom.color : PALETTE.muted}
                      size={46}
                      strokeWidth={isSelected ? 1.5 : 1.2}
                    />
                  </motion.div>
                  
                  {isSelected && (
                    <motion.div
                      layoutId={`glow-${id}`}
                      className="absolute inset-0 opacity-20"
                      style={{ background: `radial-gradient(circle at center, ${geom.color}, transparent 70%)` }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.2 }}
                      transition={spring}
                    />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
