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

type RippleEntry = { id: number };

export default function RespiracionSonora() {
  const [active, setActive] = useState("todos");
  const [ripples, setRipples] = useState<Record<string, RippleEntry[]>>({});
  const [breathing, setBreathing] = useState<string | null>(null);
  const counter = useRef(0);

  const handleSelect = (id: string) => {
    setActive(id);
    // Respiración de la card
    setBreathing(id);
    setTimeout(() => setBreathing(null), 900);
    // Anillo único muy sutil
    const rId = counter.current++;
    setRipples(prev => ({ ...prev, [id]: [...(prev[id] ?? []), { id: rId }] }));
    setTimeout(() => {
      setRipples(prev => ({
        ...prev,
        [id]: (prev[id] ?? []).filter(r => r.id !== rId),
      }));
    }, 1500);
  };

  useEffect(() => {
    let i = 0;
    const ids = TABS.map(t => t.id);
    const t = setInterval(() => {
      i = (i + 1) % ids.length;
      handleSelect(ids[i]);
    }, 2100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      style={{ backgroundColor: BG }}>
      <p style={{ color: GOLD, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.8 }}>
        Respiración Sonora · card respira + anillo suave
      </p>
      <div className="flex gap-3">
        {TABS.map(tab => {
          const sel = active === tab.id;
          const isBreathing = breathing === tab.id;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              animate={isBreathing
                ? { scale: [1, 1.045, 1] }
                : { scale: 1 }
              }
              transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
              style={{
                position: "relative",
                width: 92,
                height: 92,
                borderRadius: 16,
                border: `1px solid ${sel ? GOLD + "66" : BORDER}`,
                backgroundColor: sel ? GOLD + "12" : PANEL,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
                overflow: "visible",
                transition: "border-color 0.4s, background-color 0.4s",
              }}
            >
              <span style={{ fontSize: 22, opacity: sel ? 1 : 0.4, transition: "opacity 0.4s" }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize: 11,
                color: sel ? FG : MUTED,
                letterSpacing: "0.05em",
                fontWeight: sel ? 600 : 400,
                transition: "color 0.4s",
              }}>
                {tab.label}
              </span>

              {/* Anillo único, sutil */}
              <AnimatePresence>
                {(ripples[tab.id] ?? []).map(r => (
                  <motion.div
                    key={r.id}
                    initial={{ scale: 1.0, opacity: 0.45 }}
                    animate={{ scale: 1.85, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.1, ease: [0.1, 0.5, 0.2, 1] }}
                    style={{
                      position: "absolute", inset: 0, borderRadius: 16,
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
      <p style={{ color: MUTED, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        toca una card
      </p>
    </div>
  );
}
