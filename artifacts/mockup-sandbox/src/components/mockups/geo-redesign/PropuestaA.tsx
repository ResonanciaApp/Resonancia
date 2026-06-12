import { useState } from "react";

const BG = "#0B0F14";
const CARD = "rgba(255,255,255,0.04)";
const GOLD = "#BE9650";
const GOLD2 = "#D6A85B";
const BLUE = "#6584d4";
const BLUE2 = "#c7caec";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const PILL_BORDER = "rgba(101,132,212,0.15)";

type Tab = "inicio" | "aprende" | "creaciones" | "comunidad";

function GeoIcon({ size = 28, color = BLUE2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" stroke={color} strokeWidth="1" strokeOpacity="0.6" />
      <circle cx="14" cy="14" r="7" stroke={color} strokeWidth="1" strokeOpacity="0.9" />
      {[0,60,120,180,240,300].map(a => (
        <line key={a}
          x1={14 + 12*Math.cos(a*Math.PI/180)}
          y1={14 + 12*Math.sin(a*Math.PI/180)}
          x2={14 + 12*Math.cos((a+60)*Math.PI/180)}
          y2={14 + 12*Math.sin((a+60)*Math.PI/180)}
          stroke={color} strokeWidth="0.7" strokeOpacity="0.5" />
      ))}
    </svg>
  );
}

function FlowerOfLife({ size = 80 }: { size?: number }) {
  const r = size * 0.18;
  const cx = size / 2, cy = size / 2;
  const centers = [
    [cx, cy],
    ...([0,60,120,180,240,300].map(a => [cx + r*Math.cos(a*Math.PI/180)*2, cy + r*Math.sin(a*Math.PI/180)*2])),
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {centers.map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={r} stroke={BLUE2} strokeWidth="0.8" strokeOpacity={i===0?0.9:0.5} />
      ))}
      <circle cx={cx} cy={cy} r={r*3} stroke={GOLD} strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="3 4" />
    </svg>
  );
}

function MetatronIcon({ size = 24, color = BLUE }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,20 2,20" stroke={color} strokeWidth="1.2" strokeOpacity="0.9" />
      <polygon points="12,22 2,4 22,4" stroke={color} strokeWidth="1.2" strokeOpacity="0.6" />
    </svg>
  );
}

function SriYantraIcon({ size = 24, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {[[12,2,22,22,2,22],[12,22,2,2,22,2]].map((pts,i) => (
        <polygon key={i} points={`${pts[0]},${pts[1]} ${pts[2]},${pts[3]} ${pts[4]},${pts[5]}`}
          stroke={color} strokeWidth="1.1" strokeOpacity={i===0?0.9:0.6} />
      ))}
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
    </svg>
  );
}

function VesicaIcon({ size = 24, color = BLUE2 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="12" r="7" stroke={color} strokeWidth="1.1" strokeOpacity="0.8" />
      <circle cx="15" cy="12" r="7" stroke={color} strokeWidth="1.1" strokeOpacity="0.8" />
    </svg>
  );
}

function TabBar({ active, onTab }: { active: Tab; onTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "inicio", label: "Inicio", icon: <SriYantraIcon size={20} color={active==="inicio"?GOLD:MUTED} /> },
    { id: "aprende", label: "Aprende", icon: <MetatronIcon size={20} color={active==="aprende"?BLUE:MUTED} /> },
    { id: "creaciones", label: "Creaciones", icon: <VesicaIcon size={20} color={active==="creaciones"?BLUE2:MUTED} /> },
    { id: "comunidad", label: "Comunidad", icon: <GeoIcon size={20} color={active==="comunidad"?GOLD:MUTED} /> },
  ];
  return (
    <div style={{ display:"flex", justifyContent:"space-around", alignItems:"center",
      padding:"8px 4px 16px", background:"rgba(6,10,15,0.95)",
      borderTop:"1px solid rgba(255,255,255,0.05)" }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{
          background:"none", border:"none", cursor:"pointer",
          display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"4px 8px"
        }}>
          {t.icon}
          <span style={{ fontSize:9, fontFamily:"system-ui",
            color: active===t.id ? (t.id==="aprende"||t.id==="creaciones"?BLUE:GOLD) : MUTED,
            fontWeight: active===t.id ? 600 : 400, letterSpacing:"0.02em"
          }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function Inicio() {
  const geometries = [
    { label:"Mandala Solar", color: GOLD },
    { label:"Doble Toro", color: BLUE },
    { label:"Espiral Áurea", color: GOLD2 },
    { label:"Metatrón", color: BLUE2 },
    { label:"Flor de Vida", color: GOLD },
    { label:"Icosaedro", color: BLUE },
  ];
  return (
    <div style={{ overflowY:"auto", flex:1, padding:"0 16px 8px" }}>
      {/* Header */}
      <div style={{ paddingTop:16, paddingBottom:12 }}>
        <p style={{ color:MUTED, fontSize:11, letterSpacing:"0.15em", fontFamily:"system-ui", marginBottom:4, textTransform:"uppercase" }}>
          Geometrix
        </p>
        <h1 style={{ color:FG, fontSize:22, fontWeight:700, fontFamily:"Georgia, serif", margin:0, lineHeight:1.2 }}>
          El Lienzo Sagrado
        </h1>
      </div>

      {/* Hero */}
      <div style={{ background:CARD, borderRadius:20, padding:"28px 20px", display:"flex",
        flexDirection:"column", alignItems:"center", marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:120, height:120, opacity:0.08,
          background:`radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }} />
        <FlowerOfLife size={110} />
        <h2 style={{ color:FG, fontSize:17, fontWeight:600, fontFamily:"Georgia, serif",
          margin:"14px 0 6px", textAlign:"center" }}>Crear nueva geometría</h2>
        <p style={{ color:MUTED, fontSize:12, fontFamily:"system-ui", textAlign:"center", margin:"0 0 16px", lineHeight:1.5 }}>
          Compone desde el lienzo vacío o elige una base
        </p>
        <button style={{ background:`linear-gradient(135deg, ${GOLD} 0%, ${GOLD2} 100%)`,
          border:"none", borderRadius:50, padding:"10px 28px", cursor:"pointer",
          color:"#0B0F14", fontWeight:700, fontSize:13, fontFamily:"system-ui", letterSpacing:"0.04em" }}>
          + Crear
        </button>
      </div>

      {/* Continuar */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ color:FG, fontSize:13, fontWeight:600, fontFamily:"system-ui" }}>Continuar</span>
          <span style={{ color:GOLD, fontSize:11, fontFamily:"system-ui" }}>Ver todas →</span>
        </div>
        <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
          {geometries.slice(0,3).map((g,i) => (
            <div key={i} style={{ background:CARD, borderRadius:14, padding:"12px 10px",
              minWidth:100, display:"flex", flexDirection:"column", alignItems:"center", gap:8, flexShrink:0 }}>
              <div style={{ width:56, height:56, borderRadius:12,
                background:`rgba(${g.color===GOLD?"190,150,80":"101,132,212"},0.08)`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                {i===0 ? <SriYantraIcon size={28} color={g.color} /> :
                 i===1 ? <GeoIcon size={28} color={g.color} /> :
                         <FlowerOfLife size={36} />}
              </div>
              <span style={{ color:FG, fontSize:10, fontFamily:"system-ui", textAlign:"center", lineHeight:1.3 }}>{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Destacadas */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ color:FG, fontSize:13, fontWeight:600, fontFamily:"system-ui" }}>De la comunidad</span>
          <span style={{ color:GOLD, fontSize:11, fontFamily:"system-ui" }}>Ver más →</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {geometries.slice(0,4).map((g,i) => (
            <div key={i} style={{ background:CARD, borderRadius:14, padding:"14px 12px",
              display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
              <div style={{ width:48, height:48, display:"flex", alignItems:"center", justifyContent:"center",
                background:`rgba(${g.color===GOLD?"190,150,80":"101,132,212"},0.08)`, borderRadius:12 }}>
                {i%2===0 ? <MetatronIcon size={26} color={g.color} /> : <VesicaIcon size={26} color={g.color} />}
              </div>
              <span style={{ color:FG, fontSize:10, fontFamily:"system-ui", textAlign:"center" }}>{g.label}</span>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:8, color:MUTED, fontFamily:"system-ui" }}>♥ {12+i*7}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Aprende() {
  const [cat, setCat] = useState(0);
  const cats = ["Todo", "Sagrada", "Poliedros", "Fractales", "Física"];
  const lessons = [
    { title:"Flor de Vida — Origen", sub:"Geometría Sagrada · 8 min", icon:<FlowerOfLife size={44} />, new:true },
    { title:"La sección áurea φ", sub:"Proporción · 12 min", icon:<SriYantraIcon size={28} color={GOLD} /> },
    { title:"Tetraedro: la forma primordial", sub:"Poliedros · 6 min", icon:<MetatronIcon size={28} color={BLUE} /> },
    { title:"Fractales y conciencia", sub:"Fractales · 15 min", icon:<GeoIcon size={28} color={BLUE2} /> },
    { title:"El cubo de Metatrón", sub:"Geometría Sagrada · 10 min", icon:<VesicaIcon size={28} color={GOLD2} /> },
  ];
  return (
    <div style={{ overflowY:"auto", flex:1, padding:"0 16px 8px" }}>
      <div style={{ paddingTop:16, paddingBottom:12 }}>
        <p style={{ color:MUTED, fontSize:11, letterSpacing:"0.15em", fontFamily:"system-ui", marginBottom:4, textTransform:"uppercase" }}>Geometrix</p>
        <h1 style={{ color:FG, fontSize:22, fontWeight:700, fontFamily:"Georgia, serif", margin:0, lineHeight:1.2 }}>Aprende</h1>
      </div>

      {/* Pills */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:12, marginBottom:4 }}>
        {cats.map((c,i) => (
          <button key={i} onClick={() => setCat(i)} style={{
            background: i===cat ? "rgba(101,132,212,0.15)" : CARD,
            border: `1px solid ${i===cat ? PILL_BORDER : "transparent"}`,
            borderRadius:50, padding:"6px 14px", cursor:"pointer", whiteSpace:"nowrap",
            color: i===cat ? BLUE2 : MUTED, fontSize:11, fontFamily:"system-ui",
            fontWeight: i===cat ? 600 : 400, flexShrink:0,
          }}>{c}</button>
        ))}
      </div>

      {/* Featured lesson */}
      <div style={{ background:CARD, borderRadius:20, padding:16, marginBottom:16, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-20, right:-20, opacity:0.06,
          width:100, height:100, background:`radial-gradient(circle, ${BLUE} 0%, transparent 70%)` }} />
        <div style={{ display:"flex", gap:14, alignItems:"center" }}>
          <div style={{ width:72, height:72, background:"rgba(101,132,212,0.08)", borderRadius:16,
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <FlowerOfLife size={52} />
          </div>
          <div>
            <span style={{ background:"rgba(190,150,80,0.15)", color:GOLD, fontSize:9, fontFamily:"system-ui",
              padding:"2px 8px", borderRadius:50, fontWeight:600, letterSpacing:"0.05em" }}>NUEVO</span>
            <h3 style={{ color:FG, fontSize:14, fontWeight:600, fontFamily:"Georgia, serif", margin:"6px 0 4px", lineHeight:1.3 }}>
              Flor de Vida — Origen y significado
            </h3>
            <p style={{ color:MUTED, fontSize:11, fontFamily:"system-ui", margin:0 }}>Geometría Sagrada · 8 min</p>
          </div>
        </div>
      </div>

      {/* Lesson list */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {lessons.slice(1).map((l,i) => (
          <div key={i} style={{ background:CARD, borderRadius:14, padding:"12px 14px",
            display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, background:"rgba(101,132,212,0.07)", borderRadius:12,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              {l.icon}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ color:FG, fontSize:12, fontWeight:600, fontFamily:"system-ui", margin:"0 0 2px", lineHeight:1.3 }}>{l.title}</p>
              <p style={{ color:MUTED, fontSize:10, fontFamily:"system-ui", margin:0 }}>{l.sub}</p>
            </div>
            <span style={{ color:BLUE2, fontSize:16, opacity:0.5 }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Creaciones() {
  const items = [
    { name:"Mandala Solar", date:"Hoy", icon:<SriYantraIcon size={32} color={GOLD} /> },
    { name:"Toro Sagrado", date:"Ayer", icon:<GeoIcon size={32} color={BLUE} /> },
    { name:"Espiral Áurea", date:"Hace 3 días", icon:<FlowerOfLife size={40} /> },
    { name:"Triadón", date:"Hace 5 días", icon:<MetatronIcon size={32} color={BLUE2} /> },
    { name:"Vesica Piscis", date:"Hace 1 sem", icon:<VesicaIcon size={32} color={GOLD2} /> },
    { name:"Icosaedro", date:"Hace 2 sem", icon:<GeoIcon size={32} color={GOLD} /> },
  ];
  return (
    <div style={{ overflowY:"auto", flex:1, padding:"0 16px 8px" }}>
      <div style={{ paddingTop:16, paddingBottom:12, display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
        <div>
          <p style={{ color:MUTED, fontSize:11, letterSpacing:"0.15em", fontFamily:"system-ui", marginBottom:4, textTransform:"uppercase" }}>Geometrix</p>
          <h1 style={{ color:FG, fontSize:22, fontWeight:700, fontFamily:"Georgia, serif", margin:0, lineHeight:1.2 }}>Mis Creaciones</h1>
        </div>
        <button style={{ background:GOLD, border:"none", borderRadius:50, width:34, height:34,
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
          color:"#0B0F14", fontSize:18, fontWeight:700 }}>+</button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["Recientes","Más vistas","Guardadas"].map((f,i) => (
          <button key={i} style={{
            background: i===0 ? "rgba(101,132,212,0.15)" : CARD,
            border: `1px solid ${i===0 ? PILL_BORDER : "transparent"}`,
            borderRadius:50, padding:"6px 14px", cursor:"pointer",
            color: i===0 ? BLUE2 : MUTED, fontSize:10, fontFamily:"system-ui", fontWeight: i===0?600:400
          }}>{f}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {items.map((item,i) => (
          <div key={i} style={{ background:CARD, borderRadius:16, padding:"16px 12px",
            display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
            <div style={{ width:60, height:60, borderRadius:14,
              background: i%2===0 ? "rgba(190,150,80,0.08)" : "rgba(101,132,212,0.08)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {item.icon}
            </div>
            <div style={{ textAlign:"center" }}>
              <p style={{ color:FG, fontSize:11, fontWeight:600, fontFamily:"system-ui", margin:"0 0 2px" }}>{item.name}</p>
              <p style={{ color:MUTED, fontSize:9, fontFamily:"system-ui", margin:0 }}>{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Comunidad() {
  const posts = [
    { user:"luna_cosmica", icon:<FlowerOfLife size={36} />, title:"Flor de Vida con Metatrón", likes:47, color:BLUE },
    { user:"geometra_87", icon:<SriYantraIcon size={24} color={GOLD} />, title:"Sri Yantra expandido", likes:31, color:GOLD },
    { user:"arkhe_", icon:<GeoIcon size={24} color={BLUE2} />, title:"Toro dimensional", likes:28, color:BLUE2 },
    { user:"aura_fractal", icon:<MetatronIcon size={24} color={GOLD2} />, title:"Metatrón clásico", likes:19, color:GOLD2 },
  ];
  return (
    <div style={{ overflowY:"auto", flex:1, padding:"0 16px 8px" }}>
      <div style={{ paddingTop:16, paddingBottom:12 }}>
        <p style={{ color:MUTED, fontSize:11, letterSpacing:"0.15em", fontFamily:"system-ui", marginBottom:4, textTransform:"uppercase" }}>Geometrix</p>
        <h1 style={{ color:FG, fontSize:22, fontWeight:700, fontFamily:"Georgia, serif", margin:0, lineHeight:1.2 }}>Comunidad</h1>
      </div>

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
            display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ width:60, height:60, borderRadius:14, flexShrink:0,
              background:`rgba(${p.color===GOLD?"190,150,80":p.color===BLUE?"101,132,212":"199,202,236"},0.08)`,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              {p.icon}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ color:MUTED, fontSize:9, fontFamily:"system-ui", margin:"0 0 3px", letterSpacing:"0.05em" }}>@{p.user}</p>
              <p style={{ color:FG, fontSize:12, fontWeight:600, fontFamily:"system-ui", margin:"0 0 6px", lineHeight:1.3 }}>{p.title}</p>
              <div style={{ display:"flex", gap:12 }}>
                <span style={{ color:BLUE2, fontSize:10, fontFamily:"system-ui" }}>♥ {p.likes}</span>
                <span style={{ color:MUTED, fontSize:10, fontFamily:"system-ui" }}>↗ Compartir</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PropuestaA() {
  const [tab, setTab] = useState<Tab>("inicio");
  return (
    <div style={{ background:BG, width:390, height:844, display:"flex", flexDirection:"column",
      fontFamily:"system-ui", overflow:"hidden" }}>
      {/* Status bar */}
      <div style={{ height:44, background:BG, display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"0 20px", flexShrink:0 }}>
        <span style={{ color:FG, fontSize:12, fontWeight:600 }}>9:41</span>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ color:FG, fontSize:10, opacity:0.6 }}>●●●</span>
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
