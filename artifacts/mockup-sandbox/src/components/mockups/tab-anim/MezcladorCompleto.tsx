import { useState, useEffect, useRef } from "react";
import {
  TrendingUp, Wind, Bell, SlidersHorizontal, Mic,
  Heart, ChevronRight, ChevronLeft,
} from "lucide-react";

// ── Palette ────────────────────────────────────────────────────────────────
const BG        = "#0B0F14";
const CARD      = "#151A23";
const GOLD      = "#BE9650";
const GOLD_TINT = "rgba(190,150,80,0.11)";
const GOLD_SUB  = "rgba(190,150,80,0.08)";
const GOLD_BORD = "rgba(190,150,80,0.85)";
const FG        = "#EDE1D3";
const MUTED     = "#7A8FA8";
const BORDER    = "rgba(122,143,168,0.14)";
const TAB_WRAP  = "rgba(255,255,255,0.04)";

// ── Data ───────────────────────────────────────────────────────────────────
type MainTabId = "popular" | "naturaleza" | "ancestrales" | "sintetizadores" | "voces";

const MAIN_TABS: { id: MainTabId; label: string; Icon: any; subs: string[] | null }[] = [
  { id: "popular",        label: "Popular",        Icon: TrendingUp,      subs: null },
  { id: "naturaleza",     label: "Naturaleza",     Icon: Wind,            subs: ["Naturaleza", "Agua", "Ruidos"] },
  { id: "ancestrales",    label: "Ancestrales",    Icon: Bell,            subs: ["Cuencos Tibetanos", "Cuencos Cuarzo", "Gongs", "Campanas Viento"] },
  { id: "sintetizadores", label: "Sintetizadores", Icon: SlidersHorizontal, subs: ["Solfeggio", "Frecuencias"] },
  { id: "voces",          label: "Voces",          Icon: Mic,             subs: null },
];

const MIS_CATS = ["Para Dormir", "Tranquilidad", "Concentración", "Meditación"];

// Sound colors per tab for the placeholder image squares
const SOUND_COLORS: Record<MainTabId, string[][]> = {
  popular: [
    ["#2a4a3e","#3e6b5a"],["#1e3a5f","#2d5a8e"],["#4a2a1e","#8e5a3e"],
    ["#1a3a2a","#2d6b4a"],["#2a1e4a","#5a3e8e"],["#3a1e2a","#6b3e5a"],
    ["#1e4a2a","#3e8e5a"],["#2a3a1e","#5a6b3e"],["#1e2a4a","#3e5a8e"],
  ],
  naturaleza: [
    ["#1a3a2a","#2d6b4a"],["#1e3a5f","#2d5a8e"],["#2a4a3e","#3e6b5a"],
    ["#0d2b1a","#1a5e35"],["#0f2d3a","#1a5a7a"],["#1e3a28","#2d6b45"],
    ["#162a1e","#2a5a3a"],["#1a2e40","#2a5a7a"],["#221a35","#4a3a6a"],
  ],
  ancestrales: [
    ["#4a3a1e","#8e6e3e"],["#3a2a1e","#6e5a3e"],["#2a1e3a","#5a3e6e"],
    ["#4a2a2a","#8e5050"],["#1e3a4a","#3e6a8e"],["#3a4a1e","#6e8e3e"],
    ["#2a3a4a","#4a6a8e"],["#4a1e3a","#8e3e6a"],["#1a3a3a","#3a6a6a"],
  ],
  sintetizadores: [
    ["#1e1e4a","#3e3e8e"],["#2a1e4a","#5a3e8e"],["#1a2a4a","#3a5a8e"],
    ["#2a2a4a","#5a5a8e"],["#1e2a3a","#3e5a6a"],["#0d1a3a","#1a3a7a"],
    ["#221a40","#4a3a7a"],["#1a1e3a","#3a3e6a"],["#2a1a3a","#5a3a6a"],
  ],
  voces: [
    ["#3a1a2a","#6e3a5a"],["#2a1a1e","#5a3a3e"],["#1e2a3a","#3e5a6a"],
    ["#3a2a1a","#6e5a3a"],["#1a3a2a","#3a6a5a"],["#2a1e3a","#5a3e6a"],
    ["#3a1e1e","#6e3e3e"],["#1e3a1e","#3e6a3e"],["#1e1e3a","#3e3e6a"],
  ],
};

const SOUND_NAMES: Record<MainTabId, string[]> = {
  popular:        ["Lluvia suave","Cuencos tibetan.","Brisa marina","Om 432Hz","Cascada","Campanas","Delta binaural","Bosque noche","Mantras om"],
  naturaleza:     ["Lluvia suave","Brisa marina","Cascada","Bosque nocturno","Olas del mar","Tormenta lejana","Río cristal","Viento pinos","Lluvia selva"],
  ancestrales:    ["Cuenco tib. grande","Cuenco cuarzo","Gong grande","Campanas viento","Cuenco med.","Cuarzo 432","Gong pequeño","Campana Tingsha","Cuenco H."],
  sintetizadores: ["Om 432Hz","852Hz Intuic.","Drone delta","528Hz ADN","396Hz Miedo","741Hz Exp.","174Hz Dolor","285Hz Campo","963Hz Corona"],
  voces:          ["Mantra Om","Gayatri Mantra","Sa Ta Na Ma","Ham-Sa","So Hum","Om Namah","Lokah","Prana","Ong Namo"],
};

// ── Component ──────────────────────────────────────────────────────────────
export function MezcladorCompleto() {
  const [mainTab, setMainTab]     = useState<MainTabId>("popular");
  const [subTab, setSubTab]       = useState<string | null>(null);
  const [contentKey, setContentKey] = useState(0);
  const [dir, setDir]             = useState<"right" | "left">("right");
  const [misOpen, setMisOpen]     = useState(false);
  const [misKey, setMisKey]       = useState(0);
  const [subKey, setSubKey]       = useState(0);
  const prevTabRef                = useRef<MainTabId>("popular");

  // Auto-cycle main tabs
  useEffect(() => {
    const ids = MAIN_TABS.map(t => t.id);
    const t = setInterval(() => {
      setMainTab(prev => {
        const ci = ids.indexOf(prev);
        const next = ids[(ci + 1) % ids.length] as MainTabId;
        setDir(ci + 1 > ci ? "right" : "left");
        prevTabRef.current = prev;
        setContentKey(k => k + 1);
        setSubTab(null);
        setSubKey(k => k + 1);
        return next;
      });
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const switchMain = (id: MainTabId) => {
    if (id === mainTab) return;
    const ids = MAIN_TABS.map(t => t.id);
    setDir(ids.indexOf(id) > ids.indexOf(mainTab) ? "right" : "left");
    prevTabRef.current = mainTab;
    setContentKey(k => k + 1);
    setSubTab(null);
    setSubKey(k => k + 1);
    setMainTab(id);
  };

  const switchSub = (label: string | null) => {
    setSubTab(prev => prev === label ? null : label);
    setContentKey(k => k + 1);
  };

  const toggleMis = () => {
    setMisKey(k => k + 1);
    setMisOpen(v => !v);
  };

  const curDef = MAIN_TABS.find(t => t.id === mainTab)!;
  const subs   = curDef.subs;
  const names  = SOUND_NAMES[mainTab];
  const colors = SOUND_COLORS[mainTab];

  return (
    <div style={{ minHeight:"100vh", background:"#060A0F", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`
        @keyframes shr { from{opacity:0;transform:translateX(48px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shl { from{opacity:0;transform:translateX(-48px)} to{opacity:1;transform:translateX(0)} }
        @keyframes sfu { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes sfsubIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        .anim-shr  { animation: shr 230ms cubic-bezier(0.25,0.46,0.45,0.94) both }
        .anim-shl  { animation: shl 230ms cubic-bezier(0.25,0.46,0.45,0.94) both }
        .anim-mis  { animation: sfu 220ms cubic-bezier(0.25,0.46,0.45,0.94) both }
        .anim-sub  { animation: sfsubIn 200ms cubic-bezier(0.25,0.46,0.45,0.94) both }
        .mtab:hover { opacity:.85; cursor:pointer }
        .stab:hover { opacity:.85; cursor:pointer }
        .scard:hover { opacity:.8; cursor:pointer }
        .mispill:hover { opacity:.8; cursor:pointer }
      `}</style>

      <div style={{ width:390, background:BG, borderRadius:28, overflow:"hidden", border:`1px solid ${BORDER}`, boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ padding:"22px 20px 0" }}>
          <div style={{ color:FG, fontSize:26, fontWeight:700, fontFamily:"system-ui", letterSpacing:-0.5 }}>
            Mezclador
          </div>

          {/* Mis ♥ row */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:12, minHeight:36 }}>
            <button className="mtab" onClick={toggleMis}
              style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", padding:"4px 0" }}>
              <span style={{ color:FG, fontSize:15, fontWeight:700, fontFamily:"system-ui" }}>Mis</span>
              <Heart size={15} color="#ffffff" fill="#ffffff" />
              {misOpen
                ? <ChevronLeft size={14} color={MUTED} />
                : <ChevronRight size={14} color={MUTED} />}
            </button>

            {misOpen && (
              <div key={misKey} className="anim-mis"
                style={{ flex:1, display:"flex", gap:6, overflow:"hidden" }}>
                {MIS_CATS.map((cat, i) => (
                  <button key={cat} className="mispill"
                    style={{
                      flex:1, padding:"7px 4px", borderRadius:12, border:`1px solid rgba(190,150,80,0.35)`,
                      background:"rgba(255,255,255,0.06)", cursor:"pointer",
                      color:FG, fontSize:10, fontWeight:600, fontFamily:"system-ui", whiteSpace:"nowrap",
                      animationDelay:`${i * 35}ms`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky bar ─────────────────────────────────────────── */}
        <div style={{ background:BG, borderTop:`1px solid ${BORDER}`, marginTop:16, paddingTop:20, paddingBottom:0 }}>

          {/* Main tabs — segmented pill */}
          <div style={{ margin:"0 20px", background:TAB_WRAP, borderRadius:18, padding:"3px" }}>
            <div style={{ display:"flex", gap:1 }}>
              {MAIN_TABS.map(tab => {
                const sel = tab.id === mainTab;
                return (
                  <button key={tab.id} className="mtab" onClick={() => switchMain(tab.id)}
                    style={{
                      flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                      padding:"8px 4px", borderRadius:13, border:"none", cursor:"pointer",
                      background: sel ? GOLD_TINT : "transparent",
                      transition:"background 200ms",
                    }}
                  >
                    <tab.Icon size={18} color={sel ? GOLD : MUTED} strokeWidth={sel ? 2.2 : 1.8} />
                    <span style={{ fontSize:10, fontFamily:"system-ui", fontWeight: sel ? 600 : 400, color: sel ? FG : MUTED, letterSpacing:0.2, transition:"color 200ms" }}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-tabs */}
          {subs && subs.length > 1 ? (
            <div key={subKey} style={{ display:"flex", gap:6, padding:"10px 20px", overflowX:"auto" }}>
              {subs.map((s, i) => {
                const sel = subTab === s;
                return (
                  <button key={s} className="stab anim-sub" onClick={() => switchSub(s)}
                    style={{
                      padding:"7px 14px", borderRadius:10, border:"none", cursor:"pointer", flexShrink:0,
                      borderLeft:`2px solid ${sel ? GOLD_BORD : "transparent"}`,
                      background: sel ? GOLD_SUB : "rgba(255,255,255,0.05)",
                      color: sel ? FG : MUTED,
                      fontSize:12, fontWeight:600, fontFamily:"system-ui",
                      transition:"background 180ms, color 180ms",
                      animationDelay:`${i * 35}ms`,
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ height:10 }} />
          )}
        </div>

        {/* ── Sound grid — 3 × 3 ────────────────────────────────── */}
        <div style={{ padding:"14px 20px 20px", background:BG }}>
          <div key={contentKey} className={dir === "right" ? "anim-shr" : "anim-shl"}
            style={{ display:"flex", flexWrap:"wrap", gap:"0 10px", rowGap:22 }}>
            {names.slice(0, 9).map((name, i) => {
              const [c1, c2] = colors[i] ?? ["#1a2a3a","#2a4a6a"];
              const isActive = i === 0 || i === 3;
              return (
                <div key={i} className="scard"
                  style={{ width:"calc(33.333% - 7px)", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                  {/* Square image placeholder */}
                  <div style={{
                    width:"76%", aspectRatio:"1/1",
                    borderRadius:18, overflow:"hidden",
                    border: isActive ? "3px solid #ffffff" : "3px solid transparent",
                    background:`linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                    transform: isActive ? `rotate(${i % 2 === 0 ? -5 : 5}deg) scale(1.05)` : "none",
                    boxShadow: isActive ? "0 6px 20px rgba(0,0,0,0.5)" : "none",
                    transition:"transform 200ms",
                    position:"relative",
                  }}>
                    {/* Subtle texture overlay */}
                    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.1)" }} />
                  </div>
                  <span style={{ color:FG, fontSize:11, fontWeight:600, fontFamily:"system-ui", textAlign:"center", lineHeight:1.3, letterSpacing:0.1 }}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom label */}
        <div style={{ textAlign:"center", padding:"6px 0 16px", color:MUTED, fontSize:10, fontFamily:"system-ui", opacity:0.6, background:BG }}>
          Slide + Fade · 230ms ease · auto-cicla cada 2.8s
        </div>

      </div>
    </div>
  );
}
