/** Shared tokens & components for Aprende screens */
import React, { useState } from "react";

export const BG = "#0B0F14";
export const GOLD = "#BE9650";
export const FG = "#EDE1D3";
export const MUTED = "#7A8FA8";
export const BORDER = "rgba(190,150,80,0.18)";
export const CARD_BG = "rgba(190,150,80,0.05)";

export function StatusBar() {
  return (
    <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 0 24px", flexShrink: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: FG }}>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width={15} height={11} viewBox="0 0 15 11" fill={FG}>
          <rect x={0} y={6} width={3} height={5} rx={0.5} /><rect x={4} y={4} width={3} height={7} rx={0.5} />
          <rect x={8} y={2} width={3} height={9} rx={0.5} /><rect x={12} y={0} width={3} height={11} rx={0.5} />
        </svg>
        <svg width={14} height={11} viewBox="0 0 14 11" fill="none" stroke={FG} strokeWidth={1.5}>
          <path d="M1 3.5C3.2 1.3 5.5 0 7 0s3.8 1.3 6 3.5" /><path d="M3 6C4.2 4.8 5.5 4 7 4s2.8.8 4 2" />
          <circle cx={7} cy={9} r={1.5} fill={FG} stroke="none" />
        </svg>
        <svg width={22} height={12} viewBox="0 0 22 12" fill="none">
          <rect x={0} y={1} width={19} height={10} rx={2} stroke={FG} strokeWidth={1} />
          <rect x={1.5} y={2.5} width={16} height={7} rx={1} fill={FG} />
          <path d="M20 4v4" stroke={FG} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export function BackBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "4px 20px 12px", gap: 12, flexShrink: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={FG} strokeWidth={2} strokeLinecap="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
      </div>
      <span style={{ flex: 1, fontSize: 20, fontWeight: 700, color: FG }}>{title}</span>
      {right}
    </div>
  );
}

export function TabBar({ activeIdx = 3 }: { activeIdx?: number }) {
  const icons = [
    "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z",
    "M12 22C17.52 22 22 17.52 22 12S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zM12 8l4 4-4 4-4-4 4-4z",
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  ];
  return (
    <div style={{ height: 74, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(11,15,20,0.95)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 8px 8px", flexShrink: 0 }}>
      {icons.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 16px", cursor: "pointer" }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={i === activeIdx ? GOLD : MUTED} strokeWidth={1.8} strokeLinecap="round"><path d={d} /></svg>
          {i === activeIdx && <div style={{ width: 4, height: 4, borderRadius: "50%", background: GOLD }} />}
        </div>
      ))}
    </div>
  );
}

export function GoldDivider() {
  return <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${BORDER}, transparent)`, margin: "0 20px" }} />;
}
