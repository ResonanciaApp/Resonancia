import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BG = "#0B0F14";
const GOLD = "#BE9650";
const MUTED = "#3A4A5C";
const FG = "#EDE1D3";
const PANEL = "#111822";
const BORDER = "#1C2740";

const TABS = [
  { id: "todos",   label: "Todos",    icon: "♩" },
  { id: "natural", label: "Naturales",icon: "🌿" },
  { id: "sagrado", label: "Sagrados", icon: "◯" },
  { id: "digital", label: "Digital",  icon: "∿" },
];

type Ripple = { id: number };

export default function Suspiro() {
  const [active, setActive] = useState("todos");
  const [ripples, setRipples] = useState<Record<string, Ripple[]>>({});
  const [breathing, setBreathing] = useState<string | null>(null);
  const counter = useRef(0);

  const handleSelect = (id: string) => {
    setActive(id);
    setBreathing(id);
    setTimeout(() => setBreathing(null), 1000);
    const rId = counter.current++;
    setRipples(prev => ({ ...prev, [id]: [...(prev[id] ?? []), { id: rId }] }));
    setTimeout(() => {
      setRipples(prev => ({ ...prev, [id]: (prev[id] ?? []).filter(r => r.id !== rId) }));
    }, 1800);
  };

  useEffect(() => {
    let i = 0;
    const ids = TABS.map(t => t.id);
    const t = setInterval(() => { i = (i + 1) % ids.length; handleSelect(ids[i]); }, 2100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      style={{ backgroundColor: BG }}>
      <p style={{ color: GOLD, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.7 }}>
        Suspiro · card respira + anillo tenue
      </p>
      <div className="flex gap-4">
        {TABS.map(tab => {
          const sel = active === tab.id;
          const isBreathing = breathing === tab.id;
          return (
            <motion.button key={tab.id} onClick={() => handleSelect(tab.id)}
              animate={isBreathing ? { scale: [1, 1.028, 1] } : { scale: 1 }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: "relative", width: 88, height: 88,
                borderRadius: 999,
                border: `1px solid ${sel ? GOLD + "55" : BORDER}`,
                backgroundColor: sel ? GOLD + "0E" : PANEL,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 5,
                cursor: "pointer", overflow: "visible",
                transition: "border-color 0.5s, background-color 0.5s",
              }}>
              <span style={{ fontSize: 20, opacity: sel ? 1 : 0.35, transition: "opacity 0.5s" }}>
                {tab.icon}
              </span>
              <span style={{ fontSize: 10, color: sel ? FG : MUTED, letterSpacing: "0.05em",
                fontWeight: sel ? 600 : 400, transition: "color 0.5s" }}>
                {tab.label}
              </span>

              {/* Anillo muy sutil */}
              <AnimatePresence>
                {(ripples[tab.id] ?? []).map(r => (
                  <motion.div key={r.id}
                    initial={{ scale: 0.98, opacity: 0.25 }}
                    animate={{ scale: 1.48, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: [0.1, 0.45, 0.15, 1] }}
                    style={{
                      position: "absolute", inset: 0, borderRadius: 999,
                      border: `1px solid ${GOLD}`,
                      pointerEvents: "none",
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
      <p style={{ color: MUTED, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>toca una card</p>
    </div>
  );
}
