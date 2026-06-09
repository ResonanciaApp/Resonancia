import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GEOMS, PALETTE } from "./_shared/data";

export default function RippleCascade() {
  const [selected, setSelected] = useState<string[]>([]);
  const [ripples, setRipples] = useState<{ id: string; geomId: string; color: string }[]>([]);
  const rippleIdCounter = useRef(0);
  const selectedRef = useRef<string[]>([]);
  const rippleTimers = useRef<number[]>([]);

  // Keep a live mirror of selection so autoplay/handlers never read stale state
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const toggleSelection = (id: string) => {
    const isSelected = selectedRef.current.includes(id);
    const geom = GEOMS.find((g) => g.id === id);

    if (!isSelected && geom) {
      // Add ripple
      const rId = String(rippleIdCounter.current++);
      setRipples((prev) => [...prev, { id: rId, geomId: id, color: geom.color }]);
      // Clean up ripple after animation (tracked so it can be cancelled on unmount)
      const t = window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rId));
        rippleTimers.current = rippleTimers.current.filter((x) => x !== t);
      }, 1000);
      rippleTimers.current.push(t);
    }

    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Auto-play loop
  useEffect(() => {
    let timeout: number;
    let step = 0;
    const sequence = [
      () => toggleSelection("flower"),
      () => toggleSelection("metatron"),
      () => toggleSelection("sri"),
      () => toggleSelection("metatron"), // deselect
      () => {
        setSelected([]);
        setRipples([]);
      },
    ];

    const run = () => {
      sequence[step]();
      step = (step + 1) % sequence.length;
      timeout = window.setTimeout(run, 2500);
    };

    timeout = window.setTimeout(run, 1000);
    return () => {
      clearTimeout(timeout);
      rippleTimers.current.forEach((t) => clearTimeout(t));
      rippleTimers.current = [];
    };
  }, []);

  const displayOrder = [...selected, ...GEOMS.filter((g) => !selected.includes(g.id)).map((g) => g.id)];

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans relative overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.fg, padding: "16px" }}
    >
      <style>{`
        .ripple-cascade-hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <header className="mb-4 text-center">
        <h1 className="text-xl font-light tracking-widest uppercase mb-1" style={{ color: PALETTE.gold }}>Geometrix</h1>
        <p className="text-xs uppercase tracking-widest opacity-60">Ripple Cascade · wave-like zen</p>
      </header>

      {/* LIENZO */}
      <div
        className="flex-1 rounded-2xl relative flex items-center justify-center overflow-hidden mb-6"
        style={{
          backgroundColor: PALETTE.panel,
          border: `1px solid ${PALETTE.border}`,
          minHeight: "520px"
        }}
      >
        <AnimatePresence>
          {selected.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute text-sm tracking-widest opacity-40 uppercase"
            >
              Selecciona geometrías
            </motion.p>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selected.map((id, index) => {
            const geom = GEOMS.find((g) => g.id === id)!;
            const { Glyph } = geom;
            // First selected = index 0 = top of stack = highest zIndex
            const zIndex = selected.length - index;
            const opacity = 1 - index * 0.15;
            const scale = 1 - index * 0.05;

            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 40 }}
                animate={{ opacity, scale, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                transition={{
                  layout: { type: "spring", bounce: 0, duration: 0.8, delay: index * 0.1 },
                  opacity: { duration: 0.4 },
                  scale: { duration: 0.4 },
                  y: { type: "spring", bounce: 0, duration: 0.8 }
                }}
                className="absolute flex items-center justify-center"
                style={{ zIndex }}
              >
                <Glyph color={geom.color} size={180} strokeWidth={1.5} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* CAROUSEL */}
      <div className="h-[120px] shrink-0 w-full relative">
        <div className="flex gap-4 overflow-x-auto px-2 pb-4 ripple-cascade-hide-scrollbar snap-x snap-mandatory">
          <AnimatePresence>
            {displayOrder.map((id, index) => {
              const geom = GEOMS.find((g) => g.id === id)!;
              const { Glyph } = geom;
              const isSelected = selected.includes(id);

              return (
                <motion.button
                  layout
                  key={id}
                  onClick={() => toggleSelection(id)}
                  transition={{
                    layout: { type: "spring", bounce: 0, duration: 0.8, delay: index * 0.05 },
                  }}
                  className="relative shrink-0 snap-center rounded-2xl flex items-center justify-center focus:outline-none"
                  style={{
                    width: "76px",
                    height: "76px",
                    backgroundColor: isSelected ? `${geom.color}15` : "transparent",
                    border: `1px solid ${isSelected ? geom.color : PALETTE.border}`,
                    boxShadow: isSelected ? `0 0 20px ${geom.color}20` : "none",
                  }}
                >
                  <motion.div
                    animate={{
                      scale: isSelected ? 1 : 0.9,
                      opacity: isSelected ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Glyph color={isSelected ? geom.color : PALETTE.muted} size={40} strokeWidth={1.2} />
                  </motion.div>

                  {/* Ripples for this glyph */}
                  <AnimatePresence>
                    {ripples
                      .filter((r) => r.geomId === id)
                      .map((r) => (
                        <motion.div
                          key={r.id}
                          initial={{ scale: 0.8, opacity: 0.8, borderWidth: "2px" }}
                          animate={{ scale: 2.5, opacity: 0, borderWidth: "0px" }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          style={{
                            borderColor: r.color,
                            borderStyle: "solid",
                          }}
                        />
                      ))}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
