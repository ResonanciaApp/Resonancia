export function Palette1Obsidiana() {
  const bg = "#040404";
  const canvasTint = "transparent";
  const geoStroke = "rgba(190,150,80,0.65)";
  const geoGlow = "rgba(190,150,80,0.18)";
  const accent = "#BE9650";
  const muted = "rgba(190,150,80,0.35)";
  const fg = "#EDE1D3";
  const mutedFg = "rgba(237,225,211,0.4)";

  return <GeometrixCanvas
    name="1 · Obsidiana Pura"
    subtitle="Negro puro · sin tinte"
    bg={bg}
    canvasTint={canvasTint}
    geoStroke={geoStroke}
    geoGlow={geoGlow}
    accent={accent}
    muted={muted}
    fg={fg}
    mutedFg={mutedFg}
    chipBg="rgba(190,150,80,0.08)"
    chipBorder="rgba(190,150,80,0.2)"
    navBg="rgba(4,4,4,0.97)"
    navBorder="rgba(190,150,80,0.12)"
  />;
}

function GeometrixCanvas({ name, subtitle, bg, canvasTint, geoStroke, geoGlow, accent, muted, fg, mutedFg, chipBg, chipBorder, navBg, navBorder }: {
  name: string; subtitle: string; bg: string; canvasTint: string;
  geoStroke: string; geoGlow: string; accent: string; muted: string;
  fg: string; mutedFg: string; chipBg: string; chipBorder: string;
  navBg: string; navBorder: string;
}) {
  return (
    <div style={{ width: 390, height: 844, background: bg, position: "relative", overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {canvasTint !== "transparent" && (
        <div style={{ position: "absolute", inset: 0, background: canvasTint, pointerEvents: "none" }} />
      )}

      {/* Status bar */}
      <div style={{ position: "absolute", top: 14, left: 20, right: 20, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
        <span style={{ color: fg, fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>9:41</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <svg width="16" height="10" viewBox="0 0 16 10"><rect x="0" y="3" width="3" height="7" fill={fg} rx="0.5" opacity={0.4}/><rect x="4.5" y="2" width="3" height="8" fill={fg} rx="0.5" opacity={0.6}/><rect x="9" y="0.5" width="3" height="9.5" fill={fg} rx="0.5" opacity={0.8}/><rect x="13.5" y="0" width="2.5" height="10" fill={fg} rx="0.5"/></svg>
          <svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 2.5 Q7.5 0 7.5 0 Q4 0 1 3.5 L2.5 5 Q5 2 7.5 2.5Z" fill={fg} opacity={0.5}/><path d="M7.5 5 Q6 5 4.5 6.5 L6 8 Q7 7 7.5 7Z" fill={fg} opacity={0.8}/><circle cx="7.5" cy="10" r="1.5" fill={fg}/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0" y="1" width="22" height="10" rx="2" stroke={fg} strokeWidth="1" fill="none" opacity={0.6}/><rect x="1.5" y="2.5" width="16" height="7" rx="1" fill={fg} opacity={0.7}/><path d="M23 4.5 Q25 5.5 25 6 Q25 6.5 23 7.5Z" fill={fg} opacity={0.5}/></svg>
        </div>
      </div>

      {/* Palette label top-left */}
      <div style={{ position: "absolute", top: 50, left: 20, zIndex: 10 }}>
        <div style={{ fontSize: 10, color: accent, fontWeight: 700, letterSpacing: 3, marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 9, color: mutedFg, letterSpacing: 1.5 }}>{subtitle}</div>
      </div>

      {/* Left controls */}
      <div style={{ position: "absolute", left: 16, top: "38%", display: "flex", flexDirection: "column", gap: 10, zIndex: 10 }}>
        {["↩", "⊕"].map((icon, i) => (
          <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${muted}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: mutedFg, fontSize: 15 }}>{icon}</span>
          </div>
        ))}
      </div>

      {/* Right controls */}
      <div style={{ position: "absolute", right: 16, top: "32%", display: "flex", flexDirection: "column", gap: 10, zIndex: 10 }}>
        {["⚙", "♡", "↗"].map((icon, i) => (
          <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${muted}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: mutedFg, fontSize: 14 }}>{icon}</span>
          </div>
        ))}
      </div>

      {/* Sacred Geometry SVG — center */}
      <div style={{ position: "absolute", left: "50%", top: "45%", transform: "translate(-50%,-50%)" }}>
        <svg width="260" height="260" viewBox="-130 -130 260 260" style={{ filter: `drop-shadow(0 0 18px ${geoGlow})` }}>
          {/* Outer ring */}
          <circle cx="0" cy="0" r="120" fill="none" stroke={geoStroke} strokeWidth="0.6" opacity={0.3}/>
          <circle cx="0" cy="0" r="100" fill="none" stroke={geoStroke} strokeWidth="0.5" opacity={0.25}/>
          {/* Flower of life circles — 6 petals */}
          {[0,60,120,180,240,300].map(a => {
            const r = 60;
            const x = Math.cos(a*Math.PI/180)*r;
            const y = Math.sin(a*Math.PI/180)*r;
            return <circle key={a} cx={x} cy={y} r={r} fill="none" stroke={geoStroke} strokeWidth="0.8" opacity={0.5}/>;
          })}
          {/* Center circle */}
          <circle cx="0" cy="0" r="60" fill="none" stroke={geoStroke} strokeWidth="1" opacity={0.7}/>
          {/* Inner hexagon */}
          <polygon points="0,-52 45,-26 45,26 0,52 -45,26 -45,-26" fill="none" stroke={geoStroke} strokeWidth="0.7" opacity={0.6}/>
          {/* Star of David */}
          <polygon points="0,-38 33,19 -33,19" fill="none" stroke={geoStroke} strokeWidth="0.7" opacity={0.5}/>
          <polygon points="0,38 33,-19 -33,-19" fill="none" stroke={geoStroke} strokeWidth="0.7" opacity={0.5}/>
          {/* Center dot */}
          <circle cx="0" cy="0" r="3" fill={geoStroke} opacity={0.9}/>
          {/* Radial lines */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => {
            const x2 = Math.cos(a*Math.PI/180)*105;
            const y2 = Math.sin(a*Math.PI/180)*105;
            return <line key={a} x1="0" y1="0" x2={x2} y2={y2} stroke={geoStroke} strokeWidth="0.3" opacity={0.2}/>;
          })}
        </svg>
      </div>

      {/* Pill carousel — bottom area */}
      <div style={{ position: "absolute", bottom: 126, left: 0, right: 0, display: "flex", gap: 8, paddingLeft: 16, paddingRight: 16, overflowX: "hidden", zIndex: 10 }}>
        {["☯ Flor de Vida", "⬡ Cubo de Meta.", "△ Sri Yantra", "◎ Torus", "✦ Estrella"].map((label, i) => (
          <div key={i} style={{
            flexShrink: 0,
            padding: "6px 14px",
            borderRadius: 20,
            background: i === 0 ? accent : chipBg,
            border: `1px solid ${i === 0 ? accent : chipBorder}`,
            fontSize: 12,
            fontWeight: i === 0 ? 700 : 500,
            color: i === 0 ? "#040404" : fg,
            whiteSpace: "nowrap",
          }}>{label}</div>
        ))}
      </div>

      {/* Bottom tab bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, background: navBg, borderTop: `1px solid ${navBorder}`, display: "flex", alignItems: "flex-start", paddingTop: 10, zIndex: 20 }}>
        {[["🏠","Inicio"],["🎵","Mezclador"],["🔍","Buscar"],["📚","Biblioteca"],["◎","Geometrix"]].map(([icon, label], i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: 36, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: i === 4 ? `rgba(190,150,80,0.12)` : "transparent" }}>
              <span style={{ fontSize: i === 4 ? 17 : 16, filter: i === 4 ? "none" : "grayscale(1) brightness(0.5)" }}>{icon}</span>
            </div>
            <span style={{ fontSize: 10, color: i === 4 ? accent : "rgba(255,255,255,0.3)", fontWeight: i === 4 ? 700 : 400 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
