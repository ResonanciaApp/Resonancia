const base = import.meta.env.BASE_URL;

function IconBowl({ size = "2.2vw", color = "#C69B4F" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, flexShrink: 0 }} fill={color}>
      <path d="M12 3C7.03 3 3 6.58 3 11c0 2.39 1.09 4.53 2.83 6H18.17C19.91 15.53 21 13.39 21 11c0-4.42-4.03-8-9-8zm0 2c3.87 0 7 2.69 7 6 0 1.38-.49 2.65-1.32 3.68L6.32 14.68C5.49 13.65 5 12.38 5 11c0-3.31 3.13-6 7-6zm-7 11h14v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1z"/>
    </svg>
  );
}

function IconEye({ size = "2.2vw", color = "#C69B4F" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function IconMusic({ size = "2.2vw", color = "#C69B4F" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  );
}

function IconMic({ size = "2.2vw", color = "#C69B4F" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  );
}

const CATEGORIES = [
  { icon: <IconBowl />, name: "Sonidos Ancestrales",    desc: "cuencos tibetanos, gongs, cantos" },
  { icon: <IconEye />, name: "Meditaciones Guiadas",   desc: "voz + música de fondo" },
  { icon: <IconMusic />, name: "Música y Sonidos",       desc: "piezas para dormir y meditar" },
  { icon: <IconMic />, name: "Podcast",                 desc: "conversaciones y reflexiones" },
];

export default function Slide03Biblioteca() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left content column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "58vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box" }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>
              RESONANCIA
            </div>
            <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
          </div>
          <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
            Biblioteca de <span style={{ fontWeight: 700, color: "#C69B4F" }}>sesiones</span>
          </h2>
        </div>

        {/* Stat */}
        <div>
          <div style={{ fontSize: "8vw", fontWeight: 700, color: "#C69B4F", lineHeight: 1, letterSpacing: "-0.04em" }}>300+</div>
          <div style={{ fontSize: "1.8vw", color: "#7a6050", marginTop: "1vh" }}>sesiones en 4 categorías</div>
        </div>

        {/* Category list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.name}
              style={{
                display: "flex", alignItems: "center", gap: "1.5vw",
                paddingBottom: i < CATEGORIES.length - 1 ? "2.2vh" : 0,
                borderBottom: i < CATEGORIES.length - 1 ? "1px solid rgba(198,155,79,0.1)" : "none",
                marginBottom: i < CATEGORIES.length - 1 ? "2.2vh" : 0,
              }}
            >
              {cat.icon}
              <div style={{ fontSize: "1.75vw", fontWeight: 600, color: "#EDE1D3", flex: 1 }}>{cat.name}</div>
              <div style={{ fontSize: "1.3vw", color: "#7a6050" }}>{cat.desc}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>03</div>
        </div>
      </div>

      {/* Right — iPhone mockup */}
      <div style={{ width: "42vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(198,155,79,0.05) 0%, rgba(24,17,12,0) 65%)" }} />
        <div style={{
          width: "13vw", height: "28.2vw",
          backgroundColor: "#1C1C1E",
          borderRadius: "2.4vw",
          padding: "0.46vw",
          boxShadow: "0 1.5vw 6vw rgba(0,0,0,0.9), 0 0 0 0.12vw rgba(255,255,255,0.07)",
          position: "relative", zIndex: 1
        }}>
          <div style={{ position: "absolute", top: "1.25vw", left: "50%", transform: "translateX(-50%)", width: "3.2vw", height: "0.72vw", backgroundColor: "#000", borderRadius: "0.48vw", zIndex: 10 }} />
          <div style={{ width: "100%", height: "100%", borderRadius: "2.0vw", overflow: "hidden", backgroundColor: "#18110C" }}>
            <img src={`${base}mockup-sonidos.jpg`} crossOrigin="anonymous" alt="Sonidos Ancestrales" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
