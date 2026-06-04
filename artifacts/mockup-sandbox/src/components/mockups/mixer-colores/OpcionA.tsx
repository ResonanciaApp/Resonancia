import React from "react";

const COLORS = {
  descanso: "#B2DFDB",
  meditacion: "#F7D6E7",
  enfoque: "#FFC1A6",
};

// ─── íconos Descanso ────────────────────────────────────────────

function MoonCrescent({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" fill={color} />
    </svg>
  );
}

function MoonStars({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill={color}>
      <path d="M17.75 4.09l-2.23 1.94.72 2.93-2.54-1.54-2.54 1.54.72-2.93-2.23-1.94 2.92-.24 1.13-2.91 1.13 2.91 2.92.24z" opacity="0.7" />
      <path d="M5.75 6.76l-1.26 1.1.41 1.66-1.44-.87-1.44.87.41-1.66-1.26-1.1 1.65-.14.64-1.64.64 1.64 1.65.14z" opacity="0.5" />
      <path d="M17 18a5 5 0 11-5-5c.34 0 .68.03 1 .09A4 4 0 0017 18z" />
    </svg>
  );
}

function CloudMoon({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill={color}>
      <path d="M11.5 20a5.5 5.5 0 010-11 5.27 5.27 0 011.08.11A4.5 4.5 0 1117 14.5h-.5a5.5 5.5 0 01-5 5.5z" opacity="0.45" />
      <path d="M13 5.5a5.5 5.5 0 00-5.23 3.81A3.5 3.5 0 009.5 16H16a4 4 0 10-3-6.65A5.47 5.47 0 0013 5.5z" opacity="0.0" />
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  );
}

function BedIcon({ color }: { color: string }) {
  return (
    <svg width="30" height="28" viewBox="0 0 24 24" fill={color}>
      <path d="M20 9V7a2 2 0 00-2-2H6a2 2 0 00-2 2v2" opacity="0.5" />
      <path d="M2 13h20M2 17h20M4 13v4M20 13v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <rect x="4" y="9" width="7" height="4" rx="1" opacity="0.7" />
      <rect x="13" y="9" width="7" height="4" rx="1" opacity="0.7" />
    </svg>
  );
}

// ─── ícono Meditación (fijo: piedras) ───────────────────────────

function ZenStones({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
      <ellipse cx="15" cy="23.5" rx="8" ry="4.2" fill={color} opacity={0.95} />
      <ellipse cx="15.6" cy="16.5" rx="5.8" ry="3.3" fill={color} opacity={0.85} />
      <ellipse cx="14.8" cy="10.8" rx="3.8" ry="2.6" fill={color} opacity={0.75} />
    </svg>
  );
}

// ─── ícono Enfoque (fijo: montaña) ──────────────────────────────

function MountainIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M2 20l7-10 4 5 3-4 6 9H2z" fill={color} />
      <path d="M13 10l2-3 6 9h-5l-3-6z" fill={color} opacity="0.6" />
    </svg>
  );
}

// ─── card y fila ────────────────────────────────────────────────

function Card({ label, icon, tag }: { label: string; icon: React.ReactNode; tag?: string }) {
  return (
    <div style={{
      flex: 1, backgroundColor: "#151A23", borderRadius: 14,
      padding: "16px 10px 13px", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8, minHeight: 108, position: "relative",
    }}>
      {tag && (
        <div style={{
          position: "absolute", top: 6, right: 7, background: "#BE9650",
          color: "#090F17", fontSize: 7.5, fontWeight: 800, borderRadius: 4, padding: "1px 5px",
          fontFamily: "system-ui, sans-serif",
        }}>{tag}</div>
      )}
      {icon}
      <span style={{ color: "#FFF", fontSize: 11, fontWeight: 700, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        {label}
      </span>
    </div>
  );
}

function Row({ label, descansoIcon, tag }: { label: string; descansoIcon: React.ReactNode; tag?: string }) {
  return (
    <div style={{ width: "100%", maxWidth: 440 }}>
      <div style={{ color: "#7A8FA8", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "system-ui, sans-serif", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Card label="Descanso" icon={descansoIcon} tag={tag} />
        <Card label="Meditación" icon={<ZenStones color={COLORS.meditacion} />} />
        <Card label="Enfoque" icon={<MountainIcon color={COLORS.enfoque} />} />
      </div>
    </div>
  );
}

export function OpcionA() {
  return (
    <div style={{
      backgroundColor: "#0B0F14", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "28px 24px", flexDirection: "column", gap: 18,
    }}>
      <span style={{
        color: "#7A8FA8", fontSize: 11, fontWeight: 600, letterSpacing: 2,
        textTransform: "uppercase", fontFamily: "system-ui, sans-serif",
      }}>
        Opciones de ícono — Descanso
      </span>

      <Row label="① Luna crescente (actual)" descansoIcon={<MoonCrescent color={COLORS.descanso} />} />
      <Row label="② Luna + estrellas" descansoIcon={<MoonStars color={COLORS.descanso} />} tag="NUEVO" />
      <Row label="③ Luna estilizada" descansoIcon={<CloudMoon color={COLORS.descanso} />} tag="NUEVO" />
      <Row label="④ Cama / reposo" descansoIcon={<BedIcon color={COLORS.descanso} />} tag="NUEVO" />

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
