import React from "react";
// Opción A: Teal · Rosa · Melocotón — con variantes de ícono Meditación

const COLORS = {
  descanso: "#B2DFDB",
  meditacion: "#F7D6E7",
  enfoque: "#FFC1A6",
};

function MoonIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" fill={color} />
    </svg>
  );
}

function ZenStonesIcon({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      {/* Piedra base — grande */}
      <ellipse cx="15" cy="23.5" rx="8" ry="4.2" fill={color} opacity="0.95" />
      {/* Piedra media */}
      <ellipse cx="15.6" cy="16.5" rx="5.8" ry="3.3" fill={color} opacity="0.85" />
      {/* Piedra top — pequeña */}
      <ellipse cx="14.8" cy="10.8" rx="3.8" ry="2.6" fill={color} opacity="0.75" />
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

function YinYangIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill={color} opacity="0.15" />
      <path d="M12 3a9 9 0 010 18 4.5 4.5 0 000-9 4.5 4.5 0 010-9z" fill={color} opacity="0.9" />
      <circle cx="12" cy="7.5" r="1.5" fill={color} opacity="0.3" />
      <circle cx="12" cy="16.5" r="1.5" fill={color} opacity="0.9" />
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

function Card({
  label,
  color,
  icon,
  tag,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
  tag?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#151A23",
        borderRadius: 14,
        padding: "18px 12px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 110,
        position: "relative",
      }}
    >
      {tag && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 8,
            background: "#BE9650",
            color: "#090F17",
            fontSize: 8,
            fontWeight: 800,
            borderRadius: 4,
            padding: "1px 5px",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: 0.5,
          }}
        >
          {tag}
        </div>
      )}
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

function Row({
  label,
  meditIcon,
  tag,
}: {
  label: string;
  meditIcon: React.ReactNode;
  tag?: string;
}) {
  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      <div
        style={{
          color: "#7A8FA8",
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          fontFamily: "system-ui, sans-serif",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Card label="Descanso" color={COLORS.descanso} icon={<MoonIcon color={COLORS.descanso} />} />
        <Card label="Meditación" color={COLORS.meditacion} icon={meditIcon} tag={tag} />
        <Card label="Enfoque" color={COLORS.enfoque} icon={<MountainIcon color={COLORS.enfoque} />} />
      </div>
    </div>
  );
}

export function OpcionA() {
  return (
    <div
      style={{
        backgroundColor: "#0B0F14",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 24px",
        flexDirection: "column",
        gap: 18,
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
        }}
      >
        Opción A — Teal · Rosa · Melocotón
      </span>

      <Row
        label="① Piedras zen"
        meditIcon={<ZenStonesIcon color={COLORS.meditacion} />}
        tag="NUEVO"
      />
      <Row
        label="② Loto actual"
        meditIcon={<LotusIcon color={COLORS.meditacion} />}
      />
      <Row
        label="③ Yin-yang"
        meditIcon={<YinYangIcon color={COLORS.meditacion} />}
      />

      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
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
