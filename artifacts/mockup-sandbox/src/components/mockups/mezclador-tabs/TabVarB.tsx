export function TabVarB() {
  const tabs = [
    { label: "Populares", icon: <MusicIcon />, sel: true },
    { label: "Naturaleza", icon: <LeafIcon />, sel: false },
    { label: "Ancestrales", icon: <BellIcon />, sel: false },
    { label: "Digitales", icon: <WaveIcon />, sel: false, partial: true },
  ];

  return (
    <div style={{ width: 390, height: 310, background: "#1B060F", overflow: "hidden", position: "relative", fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 130% 80% at 80% -10%, #1a2a4a 0%, #0d1a2e 30%, #1B060F 65%, #27070E 100%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to bottom, rgba(27,6,15,0.50) 0%, transparent 30%, rgba(39,7,14,0.80) 80%, #27070E 100%)" }} />

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", paddingTop: 36, paddingBottom: 20 }}>
        <span style={{ color: "#F4DAD5", fontSize: 27, fontWeight: 700, letterSpacing: 0.5 }}>Mezclador</span>
      </div>

      <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 8, paddingLeft: 15 }}>
        {tabs.map((t, i) => (
          <div key={i} style={{ position: "relative", opacity: t.partial ? 0.5 : 1 }}>
            {/* Glow behind — dorado */}
            {!t.sel && (
              <div style={{
                position: "absolute", inset: -8,
                borderRadius: 28,
                background: "radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.28) 0%, transparent 65%)",
                filter: "blur(10px)",
                zIndex: 0,
              }} />
            )}
            <div style={{
              position: "relative", zIndex: 1,
              width: 104, height: 72, borderRadius: 20,
              background: t.sel ? "linear-gradient(180deg,#7A1515,#4A0C0C)" : "rgba(0,0,0,0.48)",
              border: t.sel ? "none" : "1px solid rgba(212,175,55,0.14)",
              boxShadow: t.sel ? "0 0 14px 0 rgba(122,21,21,0.55)" : "none",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
              <span style={{ color: t.sel ? "#F4DAD5" : "rgba(255,255,255,0.75)", display: "flex" }}>{t.icon}</span>
              <span style={{ fontSize: 11, color: t.sel ? "#EDDFD5" : "rgba(255,255,255,0.55)", letterSpacing: 0.1 }}>{t.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "rgba(244,218,213,0.40)", fontSize: 11, marginTop: 10 }}>
        B — Ghost negro + glow dorado (#D4AF37)
      </div>
    </div>
  );
}

function MusicIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3v10.55A4 4 0 1 0 11 17V7h4V3z"/></svg>; }
function LeafIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 21H5.71c.5-1.03 1-2.01 1.54-2.9C9.43 16.5 13.17 15.5 17 15c0-2.33-.02-4.67 0-7z M20 3C11 5 8 14 8 14c4.5-.5 7.5-3 12-11z"/></svg>; }
function BellIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 2.39-1.26 4.58-2 6h18c-.74-1.42-2-3.61-2-6a7 7 0 0 0-7-7zm0 20a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2z"/></svg>; }
function WaveIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12c1.5-3 3-4.5 4.5-4.5S9 9 10.5 9s3-1.5 4.5-1.5S18 9 19.5 9 22 7.5 22 7.5"/><path d="M2 17c1.5-3 3-4.5 4.5-4.5S9 14 10.5 14s3-1.5 4.5-1.5S18 14 19.5 14 22 12.5 22 12.5"/></svg>; }
