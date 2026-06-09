import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GEOMS, PALETTE } from "./_shared/data";

const bloomEasing = [0.2, 0.8, 0.2, 1];

export function ExpansiveBloom() {
  const [selected, setSelected] = useState<string[]>([]);
  const isPlayingRef = useRef(true);

  useEffect(() => {
    let step = 0;
    const sequence = [
      () => setSelected(["flower"]),
      () => setSelected(["flower", "metatron"]),
      () => setSelected(["flower", "metatron", "sri"]),
      () => setSelected(["flower", "sri"]),
      () => setSelected([]),
    ];

    const timer = setInterval(() => {
      if (!isPlayingRef.current) return;
      step = (step + 1) % sequence.length;
      sequence[step]();
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const toggleSelection = (id: string) => {
    isPlayingRef.current = false;
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((g) => g !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const displayOrder = [
    ...selected,
    ...GEOMS.filter((g) => !selected.includes(g.id)).map((g) => g.id),
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.fg, padding: 16 }}
    >
      <header className="flex flex-col items-center justify-center mb-6 mt-4">
        <h1 className="text-xl tracking-widest font-light" style={{ color: PALETTE.gold }}>
          GEOMETRIX
        </h1>
        <p className="text-xs uppercase tracking-widest mt-1 opacity-60">
          Expansive Bloom · Blossom
        </p>
      </header>

      <div
        className="flex-1 rounded-3xl relative overflow-hidden flex items-center justify-center mb-6"
        style={{
          backgroundColor: PALETTE.panel,
          border: `1px solid ${PALETTE.border}`,
        }}
      >
        <AnimatePresence>
          {selected.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="text-sm tracking-widest uppercase"
              style={{ color: PALETTE.muted }}
            >
              Selecciona geometrías
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {selected.map((id, index) => {
            const geom = GEOMS.find((g) => g.id === id);
            if (!geom) return null;
            
            const zIndex = 100 - index;
            const baseScale = Math.max(0.7, 1 - index * 0.1);
            const baseOpacity = Math.max(0.1, 0.9 - index * 0.2);

            return (
              <motion.div
                key={id}
                layout
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{
                  scale: baseScale,
                  opacity: baseOpacity,
                  filter: index === 0 ? `drop-shadow(0 0 30px ${geom.color}40)` : "none",
                }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ duration: 0.8, ease: bloomEasing }}
                className="absolute flex items-center justify-center"
                style={{ zIndex }}
              >
                <geom.Glyph color={geom.color} size={220} strokeWidth={1.5} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="h-[140px] flex items-center shrink-0">
        <div className="flex gap-4 overflow-x-auto overflow-y-hidden w-full px-2 items-center justify-start pb-4 hide-scrollbar">
          <AnimatePresence mode="popLayout">
            {displayOrder.map((id) => {
              const geom = GEOMS.find((g) => g.id === id);
              if (!geom) return null;
              
              const isSelected = selected.includes(id);

              return (
                <motion.div
                  layout
                  key={id}
                  onClick={() => toggleSelection(id)}
                  className="flex flex-col items-center gap-3 relative cursor-pointer flex-shrink-0"
                  style={{ zIndex: isSelected ? 10 : 1 }}
                  initial={false}
                  animate={{
                    scale: isSelected ? 1.05 : 1,
                    y: isSelected ? -8 : 0,
                  }}
                  transition={{
                    layout: { type: "spring", bounce: 0.2, duration: 0.8 },
                    scale: { duration: 0.5, ease: bloomEasing },
                    y: { duration: 0.5, ease: bloomEasing },
                  }}
                >
                  <motion.div
                    className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      backgroundColor: isSelected ? `${geom.color}15` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isSelected ? `${geom.color}50` : "transparent"}`,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1.5, opacity: 0.3 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.8, ease: bloomEasing }}
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `radial-gradient(circle, ${geom.color} 0%, transparent 70%)`,
                          }}
                        />
                      )}
                    </AnimatePresence>

                    <motion.div
                      animate={{
                        rotate: isSelected ? 45 : 0,
                      }}
                      transition={{ duration: 1.2, ease: bloomEasing }}
                    >
                      <geom.Glyph
                        color={isSelected ? geom.color : PALETTE.muted}
                        size={48}
                        strokeWidth={1.2}
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default ExpansiveBloom;
