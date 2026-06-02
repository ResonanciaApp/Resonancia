const base = import.meta.env.BASE_URL;

const PHONES = [
  { src: "mockup-sonidos.jpg",    label: "Sonidos Ancestrales",  color: "#E8C87A", rot: -30, z: 1 },
  { src: "mockup-biblioteca.jpg", label: "Meditaciones Guiadas", color: "#C8B4E0", rot: -10, z: 3 },
  { src: "mockup-musica.jpg",     label: "Música y Sonidos",     color: "#7DC87D", rot:  10, z: 4 },
  { src: "mockup-home.jpg",       label: "Podcast / Inicio",     color: "#8AAAD4", rot:  30, z: 2 },
];

function PhoneFrame({ src, label, color, rot, z }: (typeof PHONES)[0]) {
  const W = "12vw";
  const H = "26vw";
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        width: W,
        transformOrigin: "50% 100%",
        transform: `translateX(-50%) rotate(${rot}deg)`,
        zIndex: z,
      }}
    >
      {/* Colored category dot at top */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.7vw" }}>
        <div style={{ width: "0.7vw", height: "0.7vw", borderRadius: "50%", backgroundColor: color, boxShadow: `0 0 0.6vw ${color}99` }} />
      </div>

      {/* Phone shell */}
      <div
        style={{
          width: W,
          height: H,
          backgroundColor: "#111",
          borderRadius: "2.2vw",
          padding: "0.44vw",
          boxShadow: `0 2vw 7vw rgba(0,0,0,0.9), 0 0 0 0.12vw rgba(255,255,255,0.07), 0 0 2vw ${color}28`,
          position: "relative",
        }}
      >
        {/* Dynamic island */}
        <div style={{ position: "absolute", top: "1.1vw", left: "50%", transform: "translateX(-50%)", width: "2.8vw", height: "0.65vw", backgroundColor: "#000", borderRadius: "0.42vw", zIndex: 10 }} />
        {/* Screen */}
        <div style={{ width: "100%", height: "100%", borderRadius: "1.8vw", overflow: "hidden", backgroundColor: "#18110C" }}>
          <img
            src={`${base}${src}`}
            crossOrigin="anonymous"
            alt={label}
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        </div>
      </div>

      {/* Label below */}
      <div style={{ textAlign: "center", marginTop: "0.9vw", fontSize: "0.85vw", color, fontWeight: 600, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
        {label}
      </div>
    </div>
  );
}

function IconBowl({ size = "2.2vw", color = "#E8C87A" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: size, height: size, flexShrink: 0 }} fill={color}>
      <path d="M12 3C7.03 3 3 6.58 3 11c0 2.39 1.09 4.53 2.83 6H18.17C19.91 15.53 21 13.39 21 11c0-4.42-4.03-8-9-8zm0 2c3.87 0 7 2.69 7 6 0 1.38-.49 2.65-1.32 3.68L6.32 14.68C5.49 13.65 5 12.38 5 11c0-3.31 3.13-6 7-6zm-7 11h14v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1z"/>
    </svg>
  );
}
function IconEye({ size = "2.2vw", color = "#C8B4E0" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function IconMusic({ size = "2.2vw", color = "#7DC87D" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  );
}
function IconMic({ size = "2.2vw", color = "#8AAAD4" }: { size?: string; color?: string }) {
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
  { Icon: IconBowl,  name: "Sonidos Ancestrales",  desc: "cuencos tibetanos, gongs, cantos", color: "#E8C87A" },
  { Icon: IconEye,   name: "Meditaciones Guiadas", desc: "voz guiada + música de fondo",     color: "#C8B4E0" },
  { Icon: IconMusic, name: "Música y Sonidos",      desc: "piezas para dormir y meditar",    color: "#7DC87D" },
  { Icon: IconMic,   name: "Podcast",               desc: "conversaciones y reflexiones",    color: "#8AAAD4" },
];

export default function Slide03Biblioteca() {
  return (
    <div
      className="relative w-screen h-screen flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3", overflow: "hidden" }}
    >
      {/* ── Left content column ── */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "52vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box", flexShrink: 0 }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>RESONANCIA</div>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.name}
              style={{
                display: "flex", alignItems: "center", gap: "1.5vw",
                paddingBottom: i < CATEGORIES.length - 1 ? "2vh" : 0,
                borderBottom: i < CATEGORIES.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                marginBottom: i < CATEGORIES.length - 1 ? "2vh" : 0,
              }}
            >
              <cat.Icon />
              <div style={{ fontSize: "1.65vw", fontWeight: 600, color: "#EDE1D3", flex: 1 }}>{cat.name}</div>
              <div style={{ fontSize: "1.2vw", color: "#7a6050" }}>{cat.desc}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>04</div>
        </div>
      </div>

      {/* ── Right — fan of 4 phone mockups ── */}
      <div style={{ flex: 1, height: "100vh", position: "relative", overflow: "visible" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%, rgba(198,155,79,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />

        {/* Fan pivot — all phones share bottom-center here */}
        <div style={{ position: "absolute", bottom: "30vh", left: "50%" }}>
          {PHONES.map((p) => (
            <PhoneFrame key={p.label} {...p} />
          ))}
        </div>
      </div>
    </div>
  );
}
