import React, { useState } from "react";

const BG = "#0B0F14";
const GOLD = "#BE9650";
const CREAM = "#EDE1D3";
const MUTED = "#7A8FA8";
const FG = "#FFFFFF";

const TABS = ["Popular", "Naturaleza", "Agua", "Mantras"];

function Shell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: BG,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      justifyContent: "center",
      padding: "0 28px",
      gap: 14,
    }}>
      <div style={{
        color: MUTED, fontSize: 9, fontWeight: 700,
        letterSpacing: 2, textTransform: "uppercase",
        fontFamily: "system-ui, sans-serif",
      }}>{label}</div>
      {children}
    </div>
  );
}

/** ① Solo borde dorado — sin relleno, solo el borde cambia a dorado */
export function TabHover1() {
  const [active, setActive] = useState(0);
  return (
    <Shell label="① Solo borde dorado">
      <div style={{ display: "flex", gap: 10 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActive(i)} style={{
            background: "transparent",
            border: `1.5px solid ${active === i ? GOLD : "rgba(255,255,255,0.14)"}`,
            borderRadius: 8,
            padding: "7px 14px",
            color: active === i ? GOLD : `${CREAM}99`,
            fontSize: 13,
            fontFamily: "system-ui, sans-serif",
            fontWeight: active === i ? 600 : 400,
            cursor: "pointer",
            letterSpacing: 0.2,
          }}>{t}</button>
        ))}
      </div>
    </Shell>
  );
}

/** ② Tinte suave + borde — rgba(190,150,80,0.10) de fondo + borde dorado */
export function TabHover2() {
  const [active, setActive] = useState(0);
  return (
    <Shell label="② Tinte suave + borde">
      <div style={{ display: "flex", gap: 10 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActive(i)} style={{
            background: active === i ? "rgba(190,150,80,0.10)" : "transparent",
            border: `1.5px solid ${active === i ? GOLD : "rgba(255,255,255,0.14)"}`,
            borderRadius: 8,
            padding: "7px 14px",
            color: active === i ? GOLD : `${CREAM}99`,
            fontSize: 13,
            fontFamily: "system-ui, sans-serif",
            fontWeight: active === i ? 600 : 400,
            cursor: "pointer",
            letterSpacing: 0.2,
          }}>{t}</button>
        ))}
      </div>
    </Shell>
  );
}

/** ③ Borde crema — fondo transparente, borde en foreground apagado */
export function TabHover3() {
  const [active, setActive] = useState(0);
  return (
    <Shell label="③ Borde crema/blanco">
      <div style={{ display: "flex", gap: 10 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActive(i)} style={{
            background: "transparent",
            border: `1.5px solid ${active === i ? "rgba(237,225,211,0.55)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 8,
            padding: "7px 14px",
            color: active === i ? CREAM : `${CREAM}77`,
            fontSize: 13,
            fontFamily: "system-ui, sans-serif",
            fontWeight: active === i ? 600 : 400,
            cursor: "pointer",
            letterSpacing: 0.2,
          }}>{t}</button>
        ))}
      </div>
    </Shell>
  );
}

/** ④ Underline dorado — sin caja, solo línea inferior en dorado */
export function TabHover4() {
  const [active, setActive] = useState(0);
  return (
    <Shell label="④ Underline dorado">
      <div style={{ display: "flex", gap: 10 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActive(i)} style={{
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${active === i ? GOLD : "transparent"}`,
            borderRadius: 0,
            padding: "7px 14px 5px",
            color: active === i ? FG : `${CREAM}66`,
            fontSize: 13,
            fontFamily: "system-ui, sans-serif",
            fontWeight: active === i ? 600 : 400,
            cursor: "pointer",
            letterSpacing: 0.2,
          }}>{t}</button>
        ))}
      </div>
    </Shell>
  );
}
