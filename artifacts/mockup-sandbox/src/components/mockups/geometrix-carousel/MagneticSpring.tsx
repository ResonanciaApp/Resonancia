import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GEOMS, PALETTE } from "./_shared/data";

export default function MagneticSpring() {
  const [selected, setSelected] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-play loop
  useEffect(() => {
    if (!isPlaying) return;

    const sequence = [
      () => setSelected(["flower"]),
      () => setSelected(["flower", "metatron"]),
      () => setSelected(["flower", "metatron", "sri"]),
      () => setSelected(["flower", "sri"]), // deselect metatron
      () => setSelected([]), // reset
    ];

    let step = 0;
    const interval = setInterval(() => {
      sequence[step]();
      step = (step + 1) % sequence.length;
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleSelection = (id: string) => {
    setIsPlaying(false); // Stop auto-play on manual interaction
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const displayOrder = [
    ...selected,
    ...GEOMS.filter((g) => !selected.includes(g.id)).map((g) => g.id),
  ];

  // Magnetic spring physics
  const springTransition = {
    type: "spring",
    stiffness: 300,
    damping: 20,
    mass: 1,
  };

  // Subtle wobble animation for newly selected items
  const wobbleVariants = {
    selected: {
      rotate: [0, -5, 5, -2, 2, 0],
      transition: { duration: 0.4, ease: "easeInOut" },
    },
    unselected: { rotate: 0 },
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.fg }}
    >
      <style>{`
        .magnetic-scrollbar::-webkit-scrollbar { display: none; }
        .magnetic-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <header className="p-6 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-light tracking-wide">Geometrix</h1>
          <p className="text-sm opacity-60 mt-1" style={{ color: PALETTE.gold }}>
            Magnetic Spring · física táctil
          </p>
        </div>
        <button
          onClick={() => {
            setIsPlaying(true);
            setSelected([]);
          }}
          className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: PALETTE.gold }}
        >
          {isPlaying ? "auto-playing" : "▷ repetir"}
        </button>
      </header>

      {/* Lienzo */}
      <main className="flex-1 px-4 pb-4 flex flex-col relative">
        <div
          className="flex-1 rounded-3xl relative overflow-hidden flex items-center justify-center"
          style={{
            backgroundColor: PALETTE.panel,
            border: "1px solid " + PALETTE.border,
          }}
        >
          {selected.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="text-sm tracking-widest uppercase absolute"
            >
              Selecciona geometrías
            </motion.p>
          ) : (
            <AnimatePresence>
              {selected.map((id, index) => {
                const geom = GEOMS.find((g) => g.id === id)!;
                const { Glyph } = geom;
                const isTop = index === 0;
                
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: isTop ? [1, 1.1, 1] : 1 - index * 0.05, 
                      opacity: 1 - index * 0.2,
                      y: index * 10,
                      zIndex: 100 - index
                    }}
                    exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
                    transition={springTransition}
                    className="absolute"
                  >
                    <Glyph
                      color={geom.color}
                      size={200}
                      strokeWidth={1.5}
                      style={{
                        filter: isTop ? "drop-shadow(0 0 20px " + geom.color + "40)" : "none"
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Carousel */}
      <footer className="h-[140px] pl-4 pb-6 flex items-center">
        <div className="flex gap-4 overflow-x-auto magnetic-scrollbar pr-4 pb-4 items-center w-full">
          <AnimatePresence>
            {displayOrder.map((id) => {
              const geom = GEOMS.find((g) => g.id === id)!;
              const { Glyph } = geom;
              const isSelected = selected.includes(id);

              return (
                <motion.button
                  key={id}
                  layout
                  transition={springTransition}
                  onClick={() => toggleSelection(id)}
                  className="flex-shrink-0 relative rounded-2xl flex items-center justify-center"
                  style={{
                    width: 76,
                    height: 76,
                    backgroundColor: isSelected ? geom.color + "15" : PALETTE.panel,
                    border: "1px solid " + (isSelected ? geom.color + "50" : PALETTE.border),
                    boxShadow: isSelected ? "0 0 15px " + geom.color + "20" : "none",
                  }}
                >
                  <motion.div
                    variants={wobbleVariants}
                    animate={isSelected ? "selected" : "unselected"}
                  >
                    <Glyph
                      color={isSelected ? geom.color : PALETTE.muted}
                      size={44}
                      strokeWidth={1.2}
                    />
                  </motion.div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </footer>
    </div>
  );
}
