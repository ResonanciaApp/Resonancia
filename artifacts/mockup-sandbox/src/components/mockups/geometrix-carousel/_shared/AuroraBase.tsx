import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GEOMS, PALETTE } from "./data";

export type AuroraConfig = {
  label: string;
  subtitle: string;
  flow: number;
  glowBlur: number;
  glowAlpha: string;
  entryBlur: number;
  auroraSpeed: number;
  auroraOpacity: number;
  carouselGlow: number;
};

const HOLD_MS = 1000;
const GEOM_IDS = GEOMS.map((g) => g.id);

const EASE = [0.25, 0.1, 0.25, 1] as const;

export default function AuroraBase({ config }: { config: AuroraConfig }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>(GEOM_IDS);
  const [activating, setActivating] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);

  const selectedRef = useRef<string[]>([]);
  const pendingRef = useRef<Set<string>>(new Set());
  const pausedRef = useRef(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const selectGeom = (id: string) => {
    if (pendingRef.current.has(id) || selectedRef.current.includes(id)) return;
    if (!GEOMS.find((g) => g.id === id)) return;

    pendingRef.current.add(id);
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActivating(id);

    const t = window.setTimeout(() => {
      setOrder((prev) => {
        const rest = prev.filter((x) => x !== id);
        let insertAt = 0;
        while (insertAt < rest.length && selectedRef.current.includes(rest[insertAt])) {
          insertAt++;
        }
        rest.splice(insertAt, 0, id);
        return rest;
      });
      setActivating((a) => (a === id ? null : a));
      timers.current = timers.current.filter((x) => x !== t);
    }, HOLD_MS);
    timers.current.push(t);
  };

  const reset = () => {
    pendingRef.current.clear();
    setSelected([]);
    setOrder(GEOM_IDS);
    setActivating(null);
  };

  useEffect(() => {
    pausedRef.current = false;
    let step = 0;
    const sequence: Array<() => void> = [
      () => selectGeom("seed"),
      () => selectGeom("merkaba"),
      () => selectGeom("metatron"),
      () => reset(),
    ];

    const run = () => {
      if (pausedRef.current) return;
      sequence[step]();
      step = (step + 1) % sequence.length;
      let t = 0;
      t = window.setTimeout(() => {
        timers.current = timers.current.filter((x) => x !== t);
        run();
      }, 3000);
      timers.current.push(t);
    };

    let start = 0;
    start = window.setTimeout(() => {
      timers.current = timers.current.filter((x) => x !== start);
      run();
    }, 1200);
    timers.current.push(start);
    return () => clearTimers();
  }, [runId]);

  const handleTap = (id: string) => {
    pausedRef.current = true;
    selectGeom(id);
  };

  const handleReplay = () => {
    pausedRef.current = true;
    clearTimers();
    reset();
    setRunId((n) => n + 1);
  };

  const lienzoOrder = order.filter((id) => selected.includes(id));
  const flow = { type: "tween" as const, ease: EASE, duration: config.flow };

  const a = (base: number) => (base * config.auroraOpacity).toFixed(3);
  const auroraBg = `linear-gradient(120deg, rgba(190,150,80,${a(0.05)}), rgba(111,179,199,${a(0.05)}), rgba(199,125,168,${a(0.05)}), rgba(190,150,80,${a(0.05)}))`;
  const auroraStyle: React.CSSProperties = {
    backgroundImage: auroraBg,
    backgroundSize: "300% 300%",
    animation: `aurora-sweep ${config.auroraSpeed}s ease infinite`,
  };

  return (
    <div
      className="relative flex flex-col w-full min-h-screen overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.fg, padding: "16px" }}
    >
      <style>{`
        @keyframes aurora-sweep {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .aurora-hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-start mb-5 z-10">
        <div>
          <h1 className="text-xl font-light tracking-widest uppercase" style={{ color: PALETTE.gold }}>
            Geometrix
          </h1>
          <p className="text-xs tracking-wider opacity-60">{config.subtitle}</p>
        </div>
        <button
          onClick={handleReplay}
          className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shrink-0"
          style={{ background: "transparent", border: `1px solid ${PALETTE.border}`, color: PALETTE.muted }}
        >
          ▷ Repetir
        </button>
      </div>

      {/* CAROUSEL (arriba) */}
      <div
        className="relative h-[96px] shrink-0 rounded-2xl flex items-center overflow-hidden mb-5"
        style={{ ...auroraStyle, border: `1px solid ${PALETTE.border}` }}
      >
        <div className="flex gap-3 items-center overflow-x-auto px-3 w-full h-full aurora-hide-scrollbar">
          <AnimatePresence>
            {order.map((id) => {
              const geom = GEOMS.find((g) => g.id === id)!;
              const Glyph = geom.Glyph;
              const isSelected = selected.includes(id);
              const isActivating = activating === id;

              return (
                <motion.button
                  key={id}
                  layout
                  transition={flow}
                  onClick={() => handleTap(id)}
                  className="relative w-[68px] h-[68px] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                  style={{
                    backgroundColor: isSelected ? `${geom.color}15` : "transparent",
                    border: `1px solid ${isSelected ? `${geom.color}40` : PALETTE.border}`,
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isSelected ? 1 : 0.4,
                      scale: isActivating ? 1.18 : isSelected ? 1.1 : 1,
                    }}
                    transition={flow}
                    style={{
                      filter: isSelected
                        ? `drop-shadow(0 0 ${config.glowBlur * 0.5}px ${geom.color}${config.glowAlpha})`
                        : "none",
                    }}
                  >
                    <Glyph
                      color={isSelected ? geom.color : PALETTE.muted}
                      size={42}
                      strokeWidth={isSelected ? 1.5 : 1.2}
                    />
                  </motion.div>

                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: `radial-gradient(circle at center, ${geom.color}, transparent 70%)` }}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: isActivating
                          ? [0, config.carouselGlow * 2.2, config.carouselGlow]
                          : config.carouselGlow,
                      }}
                      transition={isActivating ? { duration: 1.0, ease: "easeInOut" } : flow}
                    />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* LIENZO (abajo) */}
      <div
        className="relative flex-grow rounded-3xl overflow-hidden aurora-gradient-bg"
        style={{ ...auroraStyle, border: `1px solid ${PALETTE.border}`, minHeight: "440px" }}
      >
        {lienzoOrder.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center opacity-30 text-sm tracking-widest uppercase">
            Selecciona geometrías
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence>
              {lienzoOrder.map((id, index) => {
                const geom = GEOMS.find((g) => g.id === id)!;
                const Glyph = geom.Glyph;
                const isTop = index === 0;
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, filter: `blur(${config.entryBlur}px)` }}
                    animate={{
                      opacity: isTop ? 1 : Math.max(0.18, 0.4 - index * 0.1),
                      scale: 1 - index * 0.05,
                      filter: "blur(0px)",
                      zIndex: lienzoOrder.length - index,
                    }}
                    exit={{ opacity: 0, scale: 1.1, filter: `blur(${config.entryBlur}px)` }}
                    transition={flow}
                    className="absolute"
                  >
                    <Glyph
                      color={geom.color}
                      size={196}
                      strokeWidth={1.5}
                      style={{
                        filter: isTop ? `drop-shadow(0 0 ${config.glowBlur}px ${geom.color}${config.glowAlpha})` : "none",
                        transition: `filter ${config.flow}s ease-in-out`,
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
