type Props = { colors: [string, string, string, string]; label: string }

const CATS = [
  { title: "Ancestrales", Icon: IconBowl },
  { title: "Meditaciones", Icon: IconZen },
  { title: "Música", Icon: IconMusic },
  { title: "Sonidos", Icon: IconHeadphones },
]

const RADII = [
  { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 4 },
  { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 4,  borderBottomRightRadius: 20 },
  { borderTopLeftRadius: 20, borderTopRightRadius: 4,  borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  { borderTopLeftRadius: 4,  borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
]

export function CatGrid({ colors, label }: Props) {
  return (
    <div style={{
      minHeight: "100vh", background: "#0B0F14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <p style={{
        color: "#7A8FA8", fontSize: 10, letterSpacing: 2,
        textTransform: "uppercase", marginBottom: 24, marginTop: 0,
      }}>{label}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: 290 }}>
        {CATS.map(({ title, Icon }, i) => (
          <div key={title} style={{
            background: "#151A23", ...RADII[i],
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "22px 10px 18px", gap: 10, cursor: "pointer",
          }}>
            <Icon color={colors[i]} size={30} />
            <span style={{
              color: "#EDE1D3", fontSize: 12, fontWeight: 600,
              textAlign: "center", lineHeight: 1.3,
            }}>{title}</span>
          </div>
        ))}
      </div>

      <p style={{ color: "#3A4A5A", fontSize: 10, marginTop: 28, letterSpacing: 1 }}>
        toca una opción para seleccionarla
      </p>
    </div>
  )
}

function IconBowl({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 9h18M5 9c0 5 2 8 7 8s7-3 7-8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 6c0-2 1-3 4-3s4 1 4 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M9 17l-1 3M15 17l1 3" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconZen({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="20" rx="7" ry="2.5" fill={color} opacity="0.9"/>
      <ellipse cx="12.3" cy="14.5" rx="5" ry="2" fill={color} opacity="0.75"/>
      <ellipse cx="11.8" cy="9.8" rx="3.5" ry="1.8" fill={color} opacity="0.6"/>
      <ellipse cx="12.2" cy="6"   rx="2.2" ry="1.4" fill={color} opacity="0.45"/>
    </svg>
  )
}

function IconMusic({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 18V5l12-2v13" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="18" r="3" stroke={color} strokeWidth="1.8"/>
      <circle cx="18" cy="16" r="3" stroke={color} strokeWidth="1.8"/>
    </svg>
  )
}

function IconHeadphones({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 18v-6a9 9 0 0118 0v6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z" stroke={color} strokeWidth="1.8"/>
      <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" stroke={color} strokeWidth="1.8"/>
    </svg>
  )
}
