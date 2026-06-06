type Props = { bg: string; label: string };

const MUTED = "#7A8FA8";
const TAB_ACTIVE = "rgba(107,154,181,0.14)";
const TAB_IDLE = "rgba(255,255,255,0.03)";

const TABS = [
  { label: "Popular", icon: IconTrending },
  { label: "Naturaleza", icon: IconWind },
  { label: "Ancestrales", icon: IconBell },
  { label: "Digitales", icon: IconSliders },
];

const SOUNDS = [
  { name: "Lluvia suave", hue: 210 },
  { name: "Olas del mar", hue: 195 },
  { name: "Bosque", hue: 140 },
  { name: "Fuego", hue: 25 },
  { name: "Viento", hue: 230 },
  { name: "Cuenco tibetano", hue: 38 },
  { name: "Pájaros", hue: 95 },
  { name: "Tormenta", hue: 250 },
  { name: "Río", hue: 185 },
];

export function MiMusica({ bg, label }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
        paddingTop: 54,
      }}
    >
      {/* Header */}
      <div style={{ padding: "0 20px 16px", display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 0.5, color: "#FFFFFF" }}>
            Mi Música
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>Mezclador de sonidos</div>
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconHeart color="#EDE1D3" size={24} />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, padding: "0 12px 12px" }}>
        {TABS.map((t, i) => {
          const sel = i === 1;
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                paddingTop: 20,
                paddingBottom: 18,
                paddingLeft: 10,
                paddingRight: 10,
                borderRadius: 14,
                background: sel ? TAB_ACTIVE : TAB_IDLE,
              }}
            >
              <Icon color={sel ? "#FFFFFF" : MUTED} size={24} />
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: 0.1,
                  color: "#FFFFFF",
                  fontWeight: sel ? 700 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {t.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sub-tabs */}
      <div style={{ position: "relative", marginTop: -5 }}>
        <div style={{ display: "flex", gap: 8, padding: "4px 16px 12px", overflow: "hidden" }}>
          {["Animales", "Bosque", "Mar", "Fuego"].map((s, i) => (
            <div
              key={s}
              style={{
                paddingTop: 7,
                paddingBottom: 7,
                paddingLeft: 14,
                paddingRight: 14,
                borderRadius: 10,
                background: i === 0 ? TAB_ACTIVE : "rgba(255,255,255,0.03)",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: "#FFFFFF" }}>{s}</span>
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 0,
            height: 1,
            background: "rgba(255,255,255,0.08)",
          }}
        />
      </div>

      {/* Grid de sonidos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          columnGap: 10,
          rowGap: 22,
          padding: "28px 14px 0",
        }}
      >
        {SOUNDS.map((s, i) => (
          <div key={s.name} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: "77%",
                aspectRatio: "1",
                borderRadius: 18,
                background: `linear-gradient(145deg, hsl(${s.hue} 32% 30%), hsl(${s.hue} 30% 16%))`,
                border: i === 0 ? "3px solid #BE9650" : "3px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconPlay color="rgba(255,255,255,0.85)" size={20} active={i === 0} />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 0.1,
                textAlign: "center",
                color: "#EDE1D3",
                marginTop: 8,
              }}
            >
              {s.name}
            </span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <div
        style={{
          textAlign: "center",
          color: "rgba(122,143,168,0.5)",
          fontSize: 9,
          letterSpacing: 2,
          textTransform: "uppercase",
          padding: "16px 0 14px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function IconTrending({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 6h6v6" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconWind({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9.6 4.6A2 2 0 1111 8H2M12.6 19.4A2 2 0 1014 16H2M17.7 7.7A2.5 2.5 0 1119.5 12H2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconBell({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSliders({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconHeart({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}
function IconPlay({ color, size, active }: { color: string; size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={active ? "#BE9650" : color}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
