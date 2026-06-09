import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GEOMS, PALETTE } from "./data";

export type MagnetConfig = {
  label: string;
  subtitle: string;
  glide: { duration: number; bounce: number };
  glowAlpha: string;
  glowBlur: number;
  rippleCount: number;
  rippleScale: number;
  activatePulse: number;
  lienzoGlow: number;
};

const HOLD_MS = 1000;
const GEOM_IDS = GEOMS.map((g) => g.id);

type Ripple = { id: string; geomId: string; color: string };

export default function MagnetBase({ config }: { config: MagnetConfig }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>(GEOM_IDS);
  const [activating, setActivating] = useState<string | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [runId, setRunId] = useState(0);

  const selectedRef = useRef<string[]>([]);
  const pendingRef = useRef<Set<string>>(new Set());
  const pausedRef = useRef(false);
  const timers = useRef<number[]>([]);
  const rippleCounter = useRef(0);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const addRipple = (id: string, color: string) => {
    const rId = String(rippleCounter.current++);
    setRipples((prev) => [...prev, { id: rId, geomId: id, color }]);
    const t = window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rId));
      timers.current = timers.current.filter((x) => x !== t);
    }, 1200);
    timers.current.push(t);
  };

  const selectGeom = (id: string) => {
    if (pendingRef.current.has(id) || selectedRef.current.includes(id)) return;
    const geom = GEOMS.find((g) => g.id === id);
    if (!geom) return;

    pendingRef.current.add(id);
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActivating(id);
    addRipple(id, geom.color);

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
    setRipples([]);
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
      }, 2600);
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

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans relative overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.fg, padding: "16px" }}
    >
      <style>{`
        .magnet-hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <header className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-light tracking-widest uppercase mb-1" style={{ color: PALETTE.gold }}>
            Geometrix
          </h1>
          <p className="text-xs uppercase tracking-widest opacity-60">{config.subtitle}</p>
        </div>
        <button
          onClick={handleReplay}
          className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shrink-0"
          style={{ background: "transparent", border: `1px solid ${PALETTE.border}`, color: PALETTE.muted }}
        >
          ▷ Repetir
        </button>
      </header>

      {/* CAROUSEL (arriba) */}
      <div className="shrink-0 w-full relative mb-5">
        <div className="flex gap-3 overflow-x-auto px-1 py-2 magnet-hide-scrollbar">
          <AnimatePresence>
            {order.map((id) => {
              const geom = GEOMS.find((g) => g.id === id)!;
              const { Glyph } = geom;
              const isSelected = selected.includes(id);
              const isActivating = activating === id;
              const theseRipples = ripples.filter((r) => r.geomId === id);

              return (
                <motion.button
                  layout
                  key={id}
                  onClick={() => handleTap(id)}
                  transition={{
                    layout: { type: "spring", bounce: config.glide.bounce, duration: config.glide.duration },
                  }}
                  animate={{
                    backgroundColor: isSelected ? `${geom.color}18` : "rgba(0,0,0,0)",
                    borderColor: isSelected ? geom.color : PALETTE.border,
                    boxShadow: isSelected
                      ? `0 0 ${config.glowBlur}px ${geom.color}${config.glowAlpha}`
                      : "0 0 0px rgba(0,0,0,0)",
                  }}
                  className="relative shrink-0 rounded-2xl flex items-center justify-center focus:outline-none"
                  style={{ width: "72px", height: "72px", borderWidth: "1px", borderStyle: "solid" }}
                >
                  <motion.div
                    animate={
                      isActivating
                        ? { scale: [1, config.activatePulse, 1], opacity: 1 }
                        : { scale: isSelected ? 1 : 0.9, opacity: isSelected ? 1 : 0.5 }
                    }
                    transition={
                      isActivating
                        ? { duration: 1.0, times: [0, 0.4, 1], ease: "easeInOut" }
                        : { duration: 0.4 }
                    }
                  >
                    <Glyph color={isSelected ? geom.color : PALETTE.muted} size={38} strokeWidth={1.2} />
                  </motion.div>

                  <AnimatePresence>
                    {theseRipples.map((r) =>
                      Array.from({ length: config.rippleCount }).map((_, k) => (
                        <motion.div
                          key={`${r.id}-${k}`}
                          initial={{ scale: 0.7, opacity: 0.7 }}
                          animate={{ scale: config.rippleScale, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.95, ease: "easeOut", delay: k * 0.18 }}
                          className="absolute inset-0 rounded-2xl pointer-events-none"
                          style={{ border: `2px solid ${r.color}` }}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
        <p className="text-[10px] tracking-widest uppercase opacity-30 mt-1 px-1">Carrusel · toca para seleccionar</p>
      </div>

      {/* LIENZO (abajo) */}
      <div
        className="flex-1 rounded-2xl relative flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: PALETTE.panel, border: `1px solid ${PALETTE.border}`, minHeight: "440px" }}
      >
        <AnimatePresence>
          {lienzoOrder.length === 0 && (
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
          {lienzoOrder.map((id, index) => {
            const geom = GEOMS.find((g) => g.id === id)!;
            const { Glyph } = geom;
            const zIndex = lienzoOrder.length - index;
            const opacity = Math.max(0.25, 1 - index * 0.14);
            const scale = 1 - index * 0.05;

            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity, scale, y: 0 }}
                exit={{ opacity: 0, scale: 1.08, filter: "blur(8px)" }}
                transition={{
                  layout: { type: "spring", bounce: config.glide.bounce, duration: config.glide.duration },
                  opacity: { duration: 0.5 },
                  scale: { duration: 0.5 },
                  y: { type: "spring", bounce: config.glide.bounce, duration: config.glide.duration },
                }}
                className="absolute flex items-center justify-center"
                style={{ zIndex }}
              >
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 240,
                    height: 240,
                    background: `radial-gradient(circle, ${geom.color} 0%, rgba(0,0,0,0) 68%)`,
                    opacity: config.lienzoGlow * opacity,
                  }}
                />
                <Glyph color={geom.color} size={180} strokeWidth={1.5} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
