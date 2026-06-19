// Variante D — Glass / frosted con brillo
export function ChipD() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "#130107" }}>
      <p style={{ color: "rgba(242,231,228,0.35)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>D — Glass / brillo</p>

      {/* Premium */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "5px 14px", borderRadius: 20,
          background: "linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.06) 100%)",
          border: "1px solid rgba(212,175,55,0.50)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          boxShadow: "0 0 12px rgba(212,175,55,0.18), inset 0 1px 0 rgba(255,255,255,0.15)",
        }}>
          {/* brillo superior */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "50%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)",
            borderRadius: "20px 20px 0 0",
            pointerEvents: "none",
          }}/>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#E9C46A"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          <span style={{ color: "#E9C46A", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, position: "relative" }}>Premium</span>
        </div>
      </div>

      {/* Free */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 13px", borderRadius: 20,
        background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(242,231,228,0.12)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(242,231,228,0.35)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span style={{ color: "rgba(242,231,228,0.35)", fontSize: 11, fontWeight: 500, letterSpacing: 0.3 }}>Plan Gratuito</span>
      </div>
    </div>
  );
}
