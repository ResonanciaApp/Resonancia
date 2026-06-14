import { useEffect, useState } from "react";

const PLACEHOLDERS = [
  "¿Qué mágico mundo quieres crear hoy?",
  "Diseña tu paisaje sonoro ideal...",
  "Cada sonido, un portal hacia la calma",
  "Combina y crea tu ritual de bienestar",
];

const TABS = ["Todos","Naturales","Sagrados","Digital","Binaurales","Voces","ASMR"];
const TAB_COLORS: Record<string,[string,string]> = {
  Todos:["#5E1E2D","#5E1E2D"], Naturales:["#3B4933","#303E27"],
  Sagrados:["#A3631F","#A3631F"], Digital:["#2C62AB","#2C62AB"],
  Binaurales:["#824EB7","#824EB7"], Voces:["#FF6B6B","#C9184A"],
  ASMR:["#0D9488","#065F4A"],
};
const HEADER_COLORS: Record<string,[string,string,string]> = {
  Todos:["#4A0C0C","#27070E","#1B060F"], Naturales:["#0E2416","#0B1A10","#1B060F"],
  Sagrados:["#2A1A06","#1E1204","#1B060F"], Digital:["#061A2E","#041220","#1B060F"],
  Binaurales:["#130825","#0D0619","#1B060F"], Voces:["#250810","#1A060C","#1B060F"],
  ASMR:["#062018","#041510","#1B060F"],
};

export function ContextoC() {
  const [sel, setSel] = useState("Todos");
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);
  const hc = HEADER_COLORS[sel];

  useEffect(() => {
    const t = setInterval(() => {
      setVis(false);
      setTimeout(() => { setIdx(i => (i+1)%PLACEHOLDERS.length); setVis(true); }, 500);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background:"#1B060F", minHeight:"100vh", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:`linear-gradient(to bottom, ${hc[0]}, ${hc[1]}, ${hc[2]})`, transition:"background 0.4s", padding:"44px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
          <div>
            <div style={{ fontSize:24, fontWeight:700, color:"#F4DAD5", letterSpacing:0.3 }}>Mezclador</div>
            <div style={{ fontSize:12, color:"rgba(244,218,213,0.45)", marginTop:1 }}>Sonidos de la tierra y el universo.</div>
          </div>
          <div style={{ width:36, height:36, borderRadius:10, background:"rgba(0,0,0,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#F4DAD5", fontSize:18 }}>⚙</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, overflowX:"auto", padding:"10px 0", scrollbarWidth:"none" }}>
          {TABS.map(t => {
            const active = t===sel;
            const gc = TAB_COLORS[t];
            return (
              <button key={t} onClick={() => setSel(t)} style={{
                flexShrink:0, padding:"6px 12px", borderRadius:999,
                border: active?"none":"1px solid #DEDEDE",
                background: active ? `linear-gradient(to bottom, ${gc[0]}, ${gc[1]})` : "#F5F4F2",
                color: active?"#fff":"rgba(0,0,0,0.6)", fontSize:12, fontWeight:active?700:400, cursor:"pointer", height:38,
              }}>{t}</button>
            );
          })}
        </div>
        {/* BANNER C — Línea dorada */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
          borderLeft:"2.5px solid #D4AF37", borderRadius:"0 8px 8px 0",
          background:"rgba(212,175,55,0.04)", padding:"9px 14px 9px 12px", margin:"0 0 12px",
        }}>
          <p style={{ margin:0, flex:1, fontSize:12, color:`rgba(255,255,255,${vis?0.9:0})`, transition:"opacity 0.45s ease", lineHeight:1.4, letterSpacing:0.1 }}>
            {PLACEHOLDERS[idx]}
          </p>
          <button style={{ flexShrink:0, fontSize:10, fontWeight:700, color:"#D4AF37", background:"transparent", border:"none", borderBottom:"1px solid rgba(212,175,55,0.5)", borderRadius:0, padding:"2px 0", cursor:"pointer", whiteSpace:"nowrap", letterSpacing:0.3 }}>
            ¿Cómo te sientes? →
          </button>
        </div>
      </div>
      <div style={{ padding:"16px", color:"rgba(255,255,255,0.15)", fontSize:10, textAlign:"center" }}>C — Línea dorada • Toca los tabs para ver el cambio de fondo</div>
    </div>
  );
}
