import { useState, useEffect, useRef } from "react";
import { TrendingUp, Wind, Bell, SlidersHorizontal, Mic } from "lucide-react";

const BG = "#0B0F14";
const CARD = "#151A23";
const GOLD = "#BE9650";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const BORDER = "#1E2733";
const TAB_ACTIVE_BG = "#1E2733";

const TABS = [
  { id: "popular",        label: "Popular",        Icon: TrendingUp },
  { id: "naturaleza",     label: "Naturaleza",     Icon: Wind },
  { id: "ancestrales",    label: "Ancestrales",    Icon: Bell },
  { id: "sintetizadores", label: "Sintetizadores", Icon: SlidersHorizontal },
  { id: "voces",          label: "Voces",          Icon: Mic },
];

const CONTENT: Record<string, { name: string; tag: string; active?: boolean }[]> = {
  popular: [
    { name: "Lluvia suave", tag: "Naturaleza", active: true },
    { name: "Cuencos tibetanos", tag: "Ancestral" },
    { name: "Brisa marina", tag: "Naturaleza" },
    { name: "Om 432Hz", tag: "Frecuencia", active: true },
    { name: "Cascada", tag: "Naturaleza" },
    { name: "Campanas viento", tag: "Ancestral" },
  ],
  naturaleza: [
    { name: "Lluvia suave", tag: "Agua", active: true },
    { name: "Brisa marina", tag: "Viento" },
    { name: "Cascada", tag: "Agua" },
    { name: "Bosque nocturno", tag: "Ambiente" },
    { name: "Olas del mar", tag: "Agua" },
    { name: "Tormenta lejana", tag: "Ambiente" },
  ],
  ancestrales: [
    { name: "Cuencos tibetanos", tag: "Cuenco" },
    { name: "Campanas viento", tag: "Campana" },
    { name: "Gong grande", tag: "Gong", active: true },
    { name: "Cuenco cuarzo", tag: "Cuenco" },
  ],
  sintetizadores: [
    { name: "Om 432Hz", tag: "Solfeggio", active: true },
    { name: "852Hz Intuición", tag: "Solfeggio" },
    { name: "Drone delta", tag: "Frecuencia" },
    { name: "528Hz ADN", tag: "Solfeggio" },
  ],
  voces: [
    { name: "Mantra Om", tag: "Mantra" },
    { name: "Gayatri", tag: "Mantra" },
    { name: "Sa Ta Na Ma", tag: "Kundalini", active: true },
  ],
};

export function SlideHorizontal() {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [dir, setDir] = useState<"right" | "left">("right");
  const prevRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((a) => {
        const next = (a + 1) % TABS.length;
        setDir(next > a ? "right" : "left");
        prevRef.current = a;
        setAnimKey((k) => k + 1);
        return next;
      });
    }, 2400);
    return () => clearInterval(t);
  }, []);

  const handleTab = (i: number) => {
    if (i === active) return;
    setDir(i > active ? "right" : "left");
    prevRef.current = active;
    setAnimKey((k) => k + 1);
    setActive(i);
  };

  const sounds = CONTENT[TABS[active].id];

  return (
    <div style={{ minHeight: "100vh", background: "#060A0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(52px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInLeft  { from { opacity:0; transform:translateX(-52px);} to { opacity:1; transform:translateX(0); } }
        .shr { animation: slideInRight 230ms cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .shl { animation: slideInLeft  230ms cubic-bezier(0.25,0.46,0.45,0.94) both; }
        .sz-card:hover { background: #212b3a !important; cursor:pointer; }
      `}</style>

      <div style={{ width: 390, background: BG, borderRadius: 28, overflow: "hidden", border: `1px solid ${BORDER}`, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ padding: "22px 20px 16px" }}>
          <div style={{ color: FG, fontSize: 20, fontWeight: 700, fontFamily: "system-ui", letterSpacing: -0.4 }}>
            Mi Música
          </div>
          <div style={{ color: MUTED, fontSize: 13, fontFamily: "system-ui", marginTop: 3 }}>
            Mezclador de sonidos
          </div>
        </div>

        {/* Tab bar — icon + label */}
        <div style={{ display: "flex", gap: 4, padding: "0 12px 12px", overflowX: "auto" }}>
          {TABS.map((tab, i) => {
            const isActive = i === active;
            return (
              <button key={tab.id} onClick={() => handleTab(i)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  padding: "10px 10px 8px",
                  borderRadius: 14, border: "none", cursor: "pointer", minWidth: 62,
                  background: isActive ? TAB_ACTIVE_BG : "transparent",
                  transition: "background 200ms",
                }}
              >
                <tab.Icon size={20} color={isActive ? GOLD : MUTED} strokeWidth={isActive ? 2.2 : 1.8} />
                <span style={{
                  fontSize: 10, fontFamily: "system-ui", fontWeight: isActive ? 700 : 400,
                  color: isActive ? FG : MUTED, whiteSpace: "nowrap",
                  transition: "color 200ms",
                }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ height: 1, background: BORDER, margin: "0 16px" }} />

        {/* Content grid */}
        <div style={{ padding: "14px 14px 4px", minHeight: 310, overflow: "hidden" }}>
          <div key={animKey} className={dir === "right" ? "shr" : "shl"}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {sounds.map((s, i) => (
              <div key={i} className="sz-card"
                style={{
                  background: s.active ? `${GOLD}18` : CARD,
                  borderRadius: 14, padding: "14px 12px",
                  border: `1px solid ${s.active ? GOLD + "50" : BORDER}`,
                  transition: "background 150ms",
                }}
              >
                <div style={{ color: FG, fontFamily: "system-ui", fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{s.name}</div>
                <div style={{ color: s.active ? GOLD : MUTED, fontFamily: "system-ui", fontSize: 11, marginTop: 5 }}>{s.tag}</div>
                {s.active && (
                  <div style={{ marginTop: 8, width: "100%", height: 2, borderRadius: 1, background: `${GOLD}60` }}>
                    <div style={{ width: "60%", height: "100%", background: GOLD, borderRadius: 1 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "12px 0 16px", color: MUTED, fontSize: 11, fontFamily: "system-ui", opacity: 0.7 }}>
          A — Slide Horizontal + Fade · 230ms ease
        </div>
      </div>
    </div>
  );
}
