// Opción B: Menta · Malva · Teal
const COLORS = {
  descanso: "#E6F6EC",
  meditacion: "#BFA3A8",
  enfoque: "#B2DFDB",
};

function MoonIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" fill={color} />
    </svg>
  );
}

function LotusIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C10 5 8 7 6 8c1 3 3 5 6 6 3-1 5-3 6-6-2-1-4-3-6-6z" opacity="0.6" />
      <path d="M12 2c0 4-1 7-3 9 1 2 2 3 3 3s2-1 3-3c-2-2-3-5-3-9z" opacity="0.85" />
      <path d="M12 2c2 3 4 5 6 6-1 3-3 5-6 6V2z" opacity="0.5" />
      <path d="M12 2C10 5 8 7 6 8c1 3 3 5 6 6V2z" opacity="0.5" />
      <ellipse cx="12" cy="20" rx="3" ry="1.5" opacity="0.4" />
      <rect x="11.5" y="14" width="1" height="6" rx="0.5" />
    </svg>
  );
}

function MountainIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M2 20l7-10 4 5 3-4 6 9H2z" fill={color} />
      <path d="M13 10l2-3 6 9h-5l-3-6z" fill={color} opacity="0.6" />
    </svg>
  );
}

function Card({ label, color, icon }: { label: string; color: string; icon: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#151A23",
        borderRadius: 14,
        padding: "18px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 110,
      }}
    >
      {icon}
      <span
        style={{
          color: "#FFFFFF",
          fontSize: 12,
          fontWeight: 700,
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function OpcionB() {
  return (
    <div
      style={{
        backgroundColor: "#0B0F14",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <span
        style={{
          color: "#7A8FA8",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginBottom: 4,
        }}
      >
        Opción B — Menta · Malva · Teal
      </span>
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 420 }}>
        <Card label="Descanso" color={COLORS.descanso} icon={<MoonIcon color={COLORS.descanso} />} />
        <Card label="Meditación" color={COLORS.meditacion} icon={<LotusIcon color={COLORS.meditacion} />} />
        <Card label="Enfoque" color={COLORS.enfoque} icon={<MountainIcon color={COLORS.enfoque} />} />
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        {Object.entries(COLORS).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: v }} />
            <span style={{ color: "#7A8FA8", fontSize: 10, fontFamily: "monospace" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
