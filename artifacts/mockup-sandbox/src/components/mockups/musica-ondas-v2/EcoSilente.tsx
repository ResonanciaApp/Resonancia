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
const DELAYS = [0, 0.38];

export default function EcoSilente() {
  const [active, setActive] = useState("todos");
  const [ripples, setRipples] = useState<Record<string, Ripple[]>>({});
  const counter = useRef(0);

  const handleSelect = (id: string) => {
    setActive(id);
    const rId = counter.current++;
    setRipples(prev => ({ ...prev, [id]: [...(prev[id] ?? []), { id: rId }] }));
    setTimeout(() => {
      setRipples(prev => ({ ...prev, [id]: (prev[id] ?? []).filter(r => r.id !== rId) }));
    }, 2400);
  };

  useEffect(() => {
    let i = 0;
    const ids = TABS.map(t => t.id);
    const t = setInterval(() => { i = (i + 1) % ids.length; handleSelect(ids[i]); }, 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      style={{ backgroundColor: BG }}>
      <p style={{ color: GOLD, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.7 }}>
        Eco Silente · dos anillos con eco suave
      </p>
      <div className="flex gap-4">
        {TABS.map(tab => {
          const sel = active === tab.id;
          return (
            <button key={tab.id} onClick={() => handleSelect(tab.id)}
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

              <AnimatePresence>
                {(ripples[tab.id] ?? []).map(r =>
                  DELAYS.map((delay, i) => (
                    <motion.div key={`${r.id}-${i}`}
                      initial={{ scale: 0.97, opacity: 0.26 - i * 0.08 }}
                      animate={{ scale: 1.5 + i * 0.18, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.6, delay, ease: [0.08, 0.4, 0.12, 1] }}
                      style={{
                        position: "absolute", inset: 0, borderRadius: 999,
                        border: `1px solid ${GOLD}`,
                        pointerEvents: "none",
                      }}
                    />
                  ))
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
      <p style={{ color: MUTED, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>toca una card</p>
    </div>
  );
}
