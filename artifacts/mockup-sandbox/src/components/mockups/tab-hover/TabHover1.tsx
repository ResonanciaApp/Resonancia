import React, { useState } from "react";
const BG = "#0B0F14", GOLD = "#BE9650", CREAM = "#EDE1D3", MUTED = "#7A8FA8";
const TABS = ["Popular", "Naturaleza", "Agua", "Mantras"];

export function TabHover1() {
  const [active, setActive] = useState(0);
  return (
    <div style={{ backgroundColor: BG, height: "100vh", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", padding: "0 28px", gap: 14 }}>
      <div style={{ color: MUTED, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", fontFamily: "system-ui, sans-serif" }}>① Solo borde dorado</div>
      <div style={{ display: "flex", gap: 10 }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActive(i)} style={{
            background: "transparent",
            border: `1.5px solid ${active === i ? GOLD : "rgba(255,255,255,0.14)"}`,
            borderRadius: 8, padding: "7px 14px",
            color: active === i ? GOLD : `${CREAM}88`,
            fontSize: 13, fontFamily: "system-ui, sans-serif",
            fontWeight: active === i ? 600 : 400, cursor: "pointer", letterSpacing: 0.2,
          }}>{t}</button>
        ))}
      </div>
    </div>
  );
}
