import { useState } from "react";

const BG = "#0B0F14";
const CARD = "rgba(255,255,255,0.04)";
const GOLD = "#BE9650";
const GOLD2 = "#D6A85B";
const BLUE = "#6584d4";
const BLUE2 = "#c7caec";
const BLUE_DARK = "#2d3f7a";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const PILL_BORDER = "rgba(101,132,212,0.15)";

type Tab = "inicio" | "aprende" | "creaciones" | "comunidad";

function OrbitIcon({ size = 26, color = BLUE2 }: { size?: number; color?: string }) {
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <ellipse cx={cx} cy={cy} rx={r} ry={r*0.4} stroke={color} strokeWidth="0.9" strokeOpacity="0.7" />
      <ellipse cx={cx} cy={cy} rx={r*0.4} ry={r} stroke={color} strokeWidth="0.9" strokeOpacity="0.5" />
      <circle cx={cx} cy={cy} r={size*0.13} fill={color} fillOpacity="0.8" />
    </svg>
  );
}

function SpiralIcon({ size = 26, color = GOLD }: { size?: number; color?: string }) {
  const cx = size / 2, cy = size / 2;
  let d = `M ${cx} ${cy}`;
  for (let i = 0; i <= 60; i++) {
    const a = (i / 60) * Math.PI * 4;
    const r = (i / 60) * size * 0.42;
    d += ` L ${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)}`;
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={d} stroke={color} strokeWidth="1.2" strokeOpacity="0.85" />
    </svg>
  );
}

function HexIcon({ size = 26, color = BLUE }: { size?: number; color?: string }) {
  const cx = size / 2, cy = size / 2, r = size * 0.44;
  const pts = [0,60,120,180,240,300].map(a =>
    `${cx + r*Math.cos((a-30)*Math.PI/180)},${cy + r*Math.sin((a-30)*Math.PI/180)}`
  ).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <polygon points={pts} stroke={color} strokeWidth="1.1" strokeOpacity="0.85" />
      <polygon points={pts} stroke={color} strokeWidth="0.5" strokeOpacity="0.3"
        transform={`rotate(30 ${cx} ${cy})`} />
    </svg>
  );
}

function TorusIcon({ size = 26, color = BLUE2 }: { size?: number; color?: string }) {
  const cx = size/2, cy = size/2, r = size*0.38;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <ellipse cx={cx} cy={cy} rx={r} ry={r*0.55} stroke={color} strokeWidth="0.9" strokeOpacity="0.8" />
      <ellipse cx={cx} cy={cy} rx={r*0.4} ry={r*0.22} stroke={color} strokeWidth="0.9" strokeOpacity="0.5" />
      <path d={`M ${cx-r} ${cy} Q ${cx} ${cy-r*0.55} ${cx+r} ${cy}`} stroke={color} strokeWidth="0.7" strokeOpacity="0.4" />
    </svg>
  );
}

function StarTetrahedron({ size = 26, color = GOLD2 }: { size?: number; color?: string }) {
  const cx = size/2, cy = size/2, r = size*0.42;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <polygon points={`${cx},${cy-r} ${cx+r*0.866},${cy+r*0.5} ${cx-r*0.866},${cy+r*0.5}`}
        stroke={color} strokeWidth="1.1" strokeOpacity="0.9" />
      <polygon points={`${cx},${cy+r} ${cx-r*0.866},${cy-r*0.5} ${cx+r*0.866},${cy-r*0.5}`}
        stroke={color} strokeWidth="1.1" strokeOpacity="0.6" />
    </svg>
  );
}

function GlowDot({ color, size = 6 }: { color: string; size?: number }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color,
      boxShadow:`0 0 ${size*1.5}px ${color}` }} />
  );
}

function TabBar({ active, onTab }: { active: Tab; onTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: (c: string) => React.ReactNode }[] = [
    { id:"inicio", label:"Inicio", icon: c => <SpiralIcon size={20} color={c} /> },
    { id:"aprende", label:"Aprende", icon: c => <HexIcon size={20} color={c} /> },
    { id:"creaciones", label:"Creaciones", icon: c => <OrbitIcon size={20} color={c} /> },
    { id:"comunidad", label:"Comunidad", icon: c => <TorusIcon size={20} color={c} /> },
  ];
  return (
    <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center",
      padding:"10px 4px 20px", background:"rgba(6,10,15,0.97)",
      borderTop:"1px solid rgba(255,255,255,0.04)" }}>
      {tabs.map(t => {
        const isActive = t.id === active;
        const color = isActive
          ? (t.id==="inicio"||t.id==="comunidad" ? GOLD : BLUE2)
          : `${MUTED}80`;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} style={{
            background:"none", border:"none", cursor:"pointer",
            display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"4px 12px",
            position:"relative"
          }}>
            {isActive && (
              <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)",
                width:24, height:2, borderRadius:2,
                background:t.id==="inicio"||t.id==="comunidad" ? GOLD : BLUE }} />
            )}
            {t.icon(color)}
            <span style={{ fontSize:9, fontFamily:"system-ui", color, fontWeight: isActive?600:400 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Inicio() {
  return (
    <div style={{ overflowY:"auto", flex:1 }}>
      {/* Hero section — full bleed */}
      <div style={{ position:"relative", padding:"20px 20px 24px",
        background:`linear-gradient(175deg, rgba(37,54,130,0.22) 0%, transparent 60%)` }}>
        <div style={{ position:"absolute", top:10, right:16, opacity:0.12,
          width:160, height:160, borderRadius:"50%",
          background:`radial-gradient(circle, ${BLUE} 0%, transparent 70%)` }} />

        <p style={{ color:BLUE2, fontSize:10, letterSpacing:"0.2em", fontFamily:"system-ui",
          textTransform:"uppercase", margin:"0 0 6px", fontWeight:500 }}>Geometrix — El Lienzo</p>
        <h1 style={{ color:FG, fontSize:26, fontWeight:700, fontFamily:"Georgia, serif",
          margin:"0 0 4px", lineHeight:1.15 }}>Geometría<br />
          <span style={{ background:`linear-gradient(90deg, ${GOLD} 0%, ${GOLD2} 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Sagrada</span>
        </h1>
        <p style={{ color:MUTED, fontSize:12, fontFamily:"system-ui", margin:"8px 0 20px", lineHeight:1.5 }}>
          Crea, aprende y comparte geometría viva
        </p>

        <div style={{ display:"flex", gap:10 }}>
          <button style={{ background:`linear-gradient(135deg, ${GOLD} 0%, ${GOLD2} 100%)`,
            border:"none", borderRadius:50, padding:"11px 24px", cursor:"pointer",
            color:"#060A0F", fontWeight:700, fontSize:12, fontFamily:"system-ui" }}>+ Nueva creación</button>
          <button style={{ background:CARD, border:`1px solid ${PILL_BORDER}`,
            borderRadius:50, padding:"11px 18px", cursor:"pointer",
            color:BLUE2, fontSize:12, fontFamily:"system-ui" }}>Explorar</button>
        </div>
      </div>

      {/* Stats band */}
      <div style={{ display:"flex", gap:0, margin:"0 20px 16px",
        background:CARD, borderRadius:16, overflow:"hidden" }}>
        {[
          { label:"Creaciones", val:"12", color:GOLD },
          { label:"En comunidad", val:"3", color:BLUE },
          { label:"Aprende", val:"47%", color:BLUE2 },
        ].map((s,i) => (
          <div key={i} style={{ flex:1, padding:"12px 8px", textAlign:"center",
            borderRight: i<2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <p style={{ color:s.color, fontSize:17, fontWeight:700, fontFamily:"Georgia, serif", margin:"0 0 2px" }}>{s.val}</p>
            <p style={{ color:MUTED, fontSize:9, fontFamily:"system-ui", margin:0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Horizontal scroll — recientes */}
      <div style={{ padding:"0 20px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ color:FG, fontSize:13, fontWeight:600, fontFamily:"system-ui" }}>Recientes</span>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <GlowDot color={GOLD} size={5} />
            <span style={{ color:GOLD, fontSize:10, fontFamily:"system-ui" }}>Ver todas</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
          {[
            { name:"Mandala Solar", icon:<SpiralIcon size={36} color={GOLD} />, bg:"rgba(190,150,80,0.1)" },
            { name:"Toro Azul", icon:<TorusIcon size={36} color={BLUE} />, bg:"rgba(101,132,212,0.1)" },
            { name:"Hexatón", icon:<HexIcon size={36} color={BLUE2} />, bg:"rgba(199,202,236,0.08)" },
          ].map((c,i) => (
            <div key={i} style={{ background:CARD, borderRadius:16, padding:"14px 12px",
              minWidth:100, flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
              <div style={{ width:60, height:60, borderRadius:14, background:c.bg,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {c.icon}
              </div>
              <span style={{ color:FG, fontSize:10, fontFamily:"system-ui", textAlign:"center" }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Destacado comunidad */}
      <div style={{ padding:"0 20px 8px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ color:FG, fontSize:13, fontWeight:600, fontFamily:"system-ui" }}>Destacado</span>
          <span style={{ color:MUTED, fontSize:10, fontFamily:"system-ui" }}>Comunidad</span>
        </div>
        <div style={{ background:CARD, borderRadius:16, padding:"16px 14px",
          display:"flex", gap:14, alignItems:"center",
          borderLeft:`3px solid ${GOLD}` }}>
          <div style={{ width:64, height:64, background:"rgba(190,150,80,0.1)", borderRadius:14,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <StarTetrahedron size={40} color={GOLD} />
          </div>
          <div>
            <p style={{ color:MUTED, fontSize:9, margin:"0 0 4px", fontFamily:"system-ui" }}>@cosmica_luz · Hoy</p>
            <p style={{ color:FG, fontSize:13, fontWeight:600, fontFamily:"Georgia, serif", margin:"0 0 6px", lineHeight:1.3 }}>
              Tetraedro Estelar — versión dorada
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <span style={{ color:GOLD, fontSize:10, fontFamily:"system-ui" }}>♥ 84</span>
              <span style={{ color:MUTED, fontSize:10, fontFamily:"system-ui" }}>↗ 12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Aprende() {
  const [cat, setCat] = useState(0);
  const cats = ["Todo","Sagrada","Poliedros","Fractales","Física"];
  const paths = [
    { title:"Geometría Sagrada", desc:"6 lecciones", pct:60, color:GOLD, icon:<StarTetrahedron size={32} color={GOLD} /> },
    { title:"Poliedros Platónicos", desc:"4 lecciones", pct:20, color:BLUE, icon:<HexIcon size={32} color={BLUE} /> },
    { title:"Fractales y Cosmos", desc:"5 lecciones", pct:0, color:BLUE2, icon:<OrbitIcon size={32} color={BLUE2} /> },
  ];
  return (
    <div style={{ overflowY:"auto", flex:1 }}>
      <div style={{ padding:"20px 20px 14px",
        background:`linear-gradient(175deg, rgba(37,54,130,0.18) 0%, transparent 60%)` }}>
        <p style={{ color:BLUE2, fontSize:10, letterSpacing:"0.2em", fontFamily:"system-ui",
          textTransform:"uppercase", margin:"0 0 4px" }}>Geometrix</p>
        <h1 style={{ color:FG, fontSize:24, fontWeight:700, fontFamily:"Georgia, serif", margin:0 }}>Aprende</h1>
      </div>

      <div style={{ padding:"0 20px" }}>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:12 }}>
          {cats.map((c,i) => (
            <button key={i} onClick={() => setCat(i)} style={{
              background: i===cat ? "rgba(101,132,212,0.15)" : CARD,
              border: `1px solid ${i===cat ? PILL_BORDER : "transparent"}`,
              borderRadius:50, padding:"6px 14px", cursor:"pointer",
              color: i===cat ? BLUE2 : MUTED, fontSize:11, fontFamily:"system-ui",
              fontWeight: i===cat?600:400, flexShrink:0,
            }}>{c}</button>
          ))}
        </div>

        <p style={{ color:MUTED, fontSize:11, fontFamily:"system-ui", marginBottom:12 }}>Tus rutas de aprendizaje</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {paths.map((p,i) => (
            <div key={i} style={{ background:CARD, borderRadius:16, padding:"14px 14px" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:10 }}>
                <div style={{ width:52, height:52, borderRadius:13, flexShrink:0,
                  background:`rgba(${p.color===GOLD?"190,150,80":p.color===BLUE?"101,132,212":"199,202,236"},0.1)`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {p.icon}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ color:FG, fontSize:13, fontWeight:600, fontFamily:"system-ui", margin:"0 0 2px" }}>{p.title}</p>
                  <p style={{ color:MUTED, fontSize:10, fontFamily:"system-ui", margin:0 }}>{p.desc}</p>
                </div>
                <span style={{ color:p.color, fontSize:13, fontWeight:700, fontFamily:"Georgia, serif" }}>{p.pct}%</span>
              </div>
              <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                <div style={{ height:3, width:`${p.pct}%`, background:p.color, borderRadius:2 }} />
              </div>
            </div>
          ))}
        </div>

        <p style={{ color:FG, fontSize:13, fontWeight:600, fontFamily:"system-ui", marginBottom:10 }}>Lección del día</p>
        <div style={{ background:CARD, borderRadius:16, padding:"16px 14px",
          borderLeft:`3px solid ${GOLD2}` }}>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ width:56, height:56, background:"rgba(190,150,80,0.1)", borderRadius:14,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <SpiralIcon size={36} color={GOLD2} />
            </div>
            <div>
              <span style={{ color:GOLD, fontSize:9, fontFamily:"system-ui",
                background:"rgba(190,150,80,0.12)", padding:"2px 8px", borderRadius:50, fontWeight:600 }}>HOY</span>
              <p style={{ color:FG, fontSize:13, fontWeight:600, fontFamily:"Georgia, serif", margin:"6px 0 3px" }}>
                La sección áurea φ
              </p>
              <p style={{ color:MUTED, fontSize:10, fontFamily:"system-ui", margin:0 }}>Proporción · 12 min</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Creaciones() {
  const items = [
    { name:"Mandala Solar", tag:"Sagrada", icon:<SpiralIcon size={30} color={GOLD} />, bg:"rgba(190,150,80,0.1)", color:GOLD },
    { name:"Toro Azul", tag:"Poliedros", icon:<TorusIcon size={30} color={BLUE} />, bg:"rgba(101,132,212,0.1)", color:BLUE },
    { name:"Hexatón", tag:"Formas", icon:<HexIcon size={30} color={BLUE2} />, bg:"rgba(199,202,236,0.08)", color:BLUE2 },
    { name:"Órbita Cósmica", tag:"Fractales", icon:<OrbitIcon size={30} color={GOLD2} />, bg:"rgba(214,168,91,0.1)", color:GOLD2 },
    { name:"Tetraedro Estelar", tag:"Sagrada", icon:<StarTetrahedron size={30} color={GOLD} />, bg:"rgba(190,150,80,0.1)", color:GOLD },
  ];
  return (
    <div style={{ overflowY:"auto", flex:1 }}>
      <div style={{ padding:"20px 20px 14px",
        background:`linear-gradient(175deg, rgba(37,54,130,0.18) 0%, transparent 60%)`,
        display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <p style={{ color:BLUE2, fontSize:10, letterSpacing:"0.2em", fontFamily:"system-ui",
            textTransform:"uppercase", margin:"0 0 4px" }}>Geometrix</p>
          <h1 style={{ color:FG, fontSize:24, fontWeight:700, fontFamily:"Georgia, serif", margin:0 }}>Mis Creaciones</h1>
        </div>
        <button style={{ background:`linear-gradient(135deg, ${GOLD} 0%, ${GOLD2} 100%)`,
          border:"none", borderRadius:50, width:36, height:36, cursor:"pointer",
          color:"#060A0F", fontSize:18, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
      </div>

      <div style={{ padding:"0 20px" }}>
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          {["Recientes","Favoritas","Compartidas"].map((f,i) => (
            <button key={i} style={{
              background: i===0 ? "rgba(101,132,212,0.15)" : CARD,
              border: `1px solid ${i===0 ? PILL_BORDER : "transparent"}`,
              borderRadius:50, padding:"6px 14px", cursor:"pointer",
              color: i===0 ? BLUE2 : MUTED, fontSize:10, fontFamily:"system-ui", fontWeight: i===0?600:400
            }}>{f}</button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {items.map((item,i) => (
            <div key={i} style={{ background:CARD, borderRadius:16, padding:"14px 14px",
              display:"flex", gap:14, alignItems:"center" }}>
              <div style={{ width:56, height:56, borderRadius:14, background:item.bg, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {item.icon}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ color:FG, fontSize:13, fontWeight:600, fontFamily:"system-ui", margin:"0 0 3px" }}>{item.name}</p>
                <span style={{ background:`rgba(${item.color===GOLD?"190,150,80":item.color===BLUE?"101,132,212":"199,202,236"},0.12)`,
                  color:item.color, fontSize:9, padding:"2px 8px", borderRadius:50, fontFamily:"system-ui", fontWeight:600 }}>
                  {item.tag}
                </span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                <span style={{ color:MUTED, fontSize:9, fontFamily:"system-ui" }}>Hoy</span>
                <span style={{ color:MUTED, fontSize:16, opacity:0.4 }}>…</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Comunidad() {
  const posts = [
    { user:"cosmica_luz", title:"Tetraedro Estelar dorado", likes:84, shares:12, icon:<StarTetrahedron size={34} color={GOLD} />, bg:"rgba(190,150,80,0.1)", color:GOLD },
    { user:"geometra_87", title:"Sri Yantra expandido azul", likes:51, shares:8, icon:<HexIcon size={34} color={BLUE} />, bg:"rgba(101,132,212,0.1)", color:BLUE },
    { user:"aura_fractal", title:"Espiral cósmica doble", likes:38, shares:5, icon:<SpiralIcon size={34} color={GOLD2} />, bg:"rgba(214,168,91,0.1)", color:GOLD2 },
    { user:"toro_infinito", title:"Campo toroidal en reposo", likes:27, shares:3, icon:<TorusIcon size={34} color={BLUE2} />, bg:"rgba(199,202,236,0.08)", color:BLUE2 },
  ];
  return (
    <div style={{ overflowY:"auto", flex:1 }}>
      <div style={{ padding:"20px 20px 14px",
        background:`linear-gradient(175deg, rgba(37,54,130,0.18) 0%, transparent 60%)` }}>
        <p style={{ color:BLUE2, fontSize:10, letterSpacing:"0.2em", fontFamily:"system-ui",
          textTransform:"uppercase", margin:"0 0 4px" }}>Geometrix</p>
        <h1 style={{ color:FG, fontSize:24, fontWeight:700, fontFamily:"Georgia, serif", margin:0 }}>Comunidad</h1>
      </div>

      <div style={{ padding:"0 20px" }}>
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          {["Tendencias","Nuevas","Seguidos"].map((f,i) => (
            <button key={i} style={{
              background: i===0 ? "rgba(101,132,212,0.15)" : CARD,
              border: `1px solid ${i===0 ? PILL_BORDER : "transparent"}`,
              borderRadius:50, padding:"6px 14px", cursor:"pointer",
              color: i===0 ? BLUE2 : MUTED, fontSize:10, fontFamily:"system-ui", fontWeight: i===0?600:400
            }}>{f}</button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {posts.map((p,i) => (
            <div key={i} style={{ background:CARD, borderRadius:16, padding:"14px 14px",
              borderLeft: i===0 ? `3px solid ${GOLD}` : "none" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:8 }}>
                <div style={{ width:56, height:56, borderRadius:14, background:p.bg, flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {p.icon}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ color:MUTED, fontSize:9, margin:"0 0 3px", fontFamily:"system-ui" }}>@{p.user}</p>
                  <p style={{ color:FG, fontSize:13, fontWeight:600, fontFamily:"Georgia, serif", margin:0, lineHeight:1.3 }}>{p.title}</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:14,
                paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.04)" }}>
                <button style={{ background:"none", border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:13, color:p.color }}>♥</span>
                  <span style={{ color:p.color, fontSize:11, fontFamily:"system-ui", fontWeight:600 }}>{p.likes}</span>
                </button>
                <button style={{ background:"none", border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ color:MUTED, fontSize:11, fontFamily:"system-ui" }}>↗ {p.shares}</span>
                </button>
                <div style={{ flex:1 }} />
                {i===0 && (
                  <span style={{ background:"rgba(190,150,80,0.15)", color:GOLD, fontSize:9,
                    padding:"2px 8px", borderRadius:50, fontFamily:"system-ui", fontWeight:600 }}>
                    🔥 TOP
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PropuestaB() {
  const [tab, setTab] = useState<Tab>("inicio");
  return (
    <div style={{ background:BG, width:390, height:844, display:"flex", flexDirection:"column",
      fontFamily:"system-ui", overflow:"hidden" }}>
      <div style={{ height:44, background:"transparent", display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"0 20px", flexShrink:0 }}>
        <span style={{ color:FG, fontSize:12, fontWeight:600 }}>9:41</span>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <span style={{ color:FG, fontSize:10, opacity:0.5 }}>●●●</span>
        </div>
      </div>

      {tab === "inicio" && <Inicio />}
      {tab === "aprende" && <Aprende />}
      {tab === "creaciones" && <Creaciones />}
      {tab === "comunidad" && <Comunidad />}

      <div style={{ flexShrink:0 }}>
        <TabBar active={tab} onTab={setTab} />
      </div>
    </div>
  );
}
