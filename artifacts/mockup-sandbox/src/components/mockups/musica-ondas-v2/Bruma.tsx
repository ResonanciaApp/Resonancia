import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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

export default function Bruma() {
  const [active, setActive] = useState("todos");
  const [glowing, setGlowing] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    setActive(id);
    setGlowing(id);
    setTimeout(() => setGlowing(null), 1400);
  };

  useEffect(() => {
    let i = 0;
    const ids = TABS.map(t => t.id);
    const t = setInterval(() => { i = (i + 1) % ids.length; handleSelect(ids[i]); }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6"
      style={{ backgroundColor: BG }}>
      <p style={{ color: GOLD, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.7 }}>
        Bruma · halo dorado sin anillo
      </p>
      <div className="flex gap-4">
        {TABS.map(tab => {
          const sel = active === tab.id;
          const isGlowing = glowing === tab.id;
          return (
            <motion.button key={tab.id} onClick={() => handleSelect(tab.id)}
              animate={isGlowing ? {
                boxShadow: [
                  `0 0 0px 0px ${GOLD}00`,
                  `0 0 14px 5px ${GOLD}33`,
                  `0 0 6px 2px ${GOLD}18`,
                  `0 0 0px 0px ${GOLD}00`,
                ],
              } : {
                boxShadow: sel
                  ? `0 0 6px 2px ${GOLD}18`
                  : `0 0 0px 0px ${GOLD}00`,
              }}
              transition={{ duration: 1.3, ease: "easeOut" }}
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
              <motion.span
                animate={isGlowing ? { scale: [1, 1.1, 1], opacity: [sel ? 1 : 0.35, 1, sel ? 1 : 0.35] }
                  : { scale: 1, opacity: sel ? 1 : 0.35 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ fontSize: 20, display: "block" }}>
                {tab.icon}
              </motion.span>
              <span style={{ fontSize: 10, color: sel ? FG : MUTED, letterSpacing: "0.05em",
                fontWeight: sel ? 600 : 400, transition: "color 0.5s" }}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
      <p style={{ color: MUTED, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>toca una card</p>
    </div>
  );
}
