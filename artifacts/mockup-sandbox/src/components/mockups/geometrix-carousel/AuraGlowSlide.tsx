import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GEOMS, PALETTE } from "./_shared/data";

export default function AuraGlowSlide() {
  const [selected, setSelected] = useState<string[]>([]);
  const [runId, setRunId] = useState(0);
  const pausedRef = useRef(false);

  // Auto-play loop — restarts whenever runId changes (e.g. "Repetir")
  useEffect(() => {
    pausedRef.current = false;
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;

    const sequence = [
      () => setSelected(["flower"]),
      () => setSelected(["flower", "metatron"]),
      () => setSelected(["flower", "metatron", "sri"]),
      () => setSelected(["flower", "sri"]), // deselect metatron
      () => setSelected([]), // reset
    ];

    const runLoop = () => {
      if (pausedRef.current) return;
      sequence[step]();
      step = (step + 1) % sequence.length;
      timer = setTimeout(runLoop, 2500);
    };

    timer = setTimeout(runLoop, 1000);
    return () => clearTimeout(timer);
  }, [runId]);

  const handleToggle = (id: string) => {
    pausedRef.current = true;
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const handleReplay = () => {
    setSelected([]);
    setRunId((n) => n + 1); // re-runs the effect → fresh timer chain
  };

  const unselected = GEOMS.filter((g) => !selected.includes(g.id)).map((g) => g.id);
  const displayOrder = [...selected, ...unselected];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center"
      style={{
        background: PALETTE.bg,
        color: PALETTE.fg,
        padding: "16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        .aura-glow-pulse {
          animation: aura-pulse 2s ease-in-out;
        }
        @keyframes aura-pulse {
          0% { filter: drop-shadow(0 0 0px var(--aura-color)) brightness(1); transform: scale(0.95); }
          50% { filter: drop-shadow(0 0 40px var(--aura-color)) brightness(1.2); transform: scale(1.05); }
          100% { filter: drop-shadow(0 0 10px var(--aura-color)) brightness(1); transform: scale(1); }
        }
      `}</style>

      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-light tracking-wide m-0" style={{ color: PALETTE.gold }}>
            Geometrix
          </h1>
          <p className="text-xs tracking-widest uppercase opacity-60 m-0 mt-1">
            Aura · resplandor
          </p>
        </div>
        <button
          onClick={handleReplay}
          className="text-xs uppercase tracking-widest px-3 py-1.5 rounded-full"
          style={{
            background: "transparent",
            border: `1px solid ${PALETTE.border}`,
            color: PALETTE.muted,
            opacity: 0.8,
            cursor: "pointer",
          }}
        >
          ▷ Repetir
        </button>
      </div>

      {/* Lienzo */}
      <div
        className="w-full max-w-md flex-1 relative rounded-3xl overflow-hidden flex items-center justify-center mb-6"
        style={{
          background: PALETTE.panel,
          border: `1px solid ${PALETTE.border}`,
          minHeight: "520px",
        }}
      >
        <AnimatePresence>
          {selected.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="absolute text-sm tracking-widest uppercase"
              style={{ color: PALETTE.muted }}
            >
              Selecciona geometrías
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selected.map((id, index) => {
            const geom = GEOMS.find((g) => g.id === id)!;
            const isTop = index === 0;
            // The first selected is on top
            const zIndex = selected.length - index;
            const baseOpacity = isTop ? 1 : Math.max(0.1, 1 - index * 0.25);
            const scale = 1 - index * 0.1;
            const yOffset = index * 20;

            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{
                  opacity: baseOpacity,
                  scale,
                  y: yOffset,
                }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                transition={{
                  duration: 1.2,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className={`absolute flex items-center justify-center ${
                  isTop ? "aura-glow-pulse" : ""
                }`}
                style={{
                  zIndex,
                  "--aura-color": geom.color,
                } as React.CSSProperties}
              >
                <geom.Glyph color={geom.color} size={180} strokeWidth={1.5} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Carousel */}
      <div className="w-full max-w-md h-[120px] relative">
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar items-center h-full snap-x">
          <AnimatePresence>
            {displayOrder.map((id) => {
              const geom = GEOMS.find((g) => g.id === id)!;
              const isSelected = selected.includes(id);

              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    boxShadow: isSelected
                      ? `0 0 30px -5px ${geom.color}60, inset 0 0 20px -5px ${geom.color}40`
                      : `0 0 0px transparent, inset 0 0 0px transparent`,
                  }}
                  transition={{
                    layout: {
                      duration: 0.8,
                      ease: [0.25, 0.1, 0.25, 1],
                    },
                    boxShadow: { duration: 0.8 },
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleToggle(id)}
                  className="flex-shrink-0 w-[76px] h-[76px] rounded-2xl flex items-center justify-center cursor-pointer snap-center relative overflow-hidden"
                  style={{
                    background: isSelected ? `${geom.color}15` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSelected ? `${geom.color}50` : PALETTE.border}`,
                  }}
                >
                  <motion.div
                    animate={{
                      scale: isSelected ? [1, 1.12, 1] : 1,
                    }}
                    transition={{
                      duration: 1.5,
                      ease: "easeInOut",
                    }}
                  >
                    <geom.Glyph
                      color={isSelected ? geom.color : PALETTE.muted}
                      size={44}
                      strokeWidth={isSelected ? 1.5 : 1.2}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
