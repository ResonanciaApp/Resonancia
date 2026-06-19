// Variante A — Borde fino + glow asimétrico dorado
export function ChipA() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8" style={{ background: "#130107" }}>
      <p style={{ color: "rgba(242,231,228,0.35)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>A — Borde fino · glow asimétrico</p>

      {/* Premium con glow */}
      <div style={{ position: "relative" }}>
        {/* blob glow — anclado 65% 60% (abajo-derecha) */}
        <div style={{
          position: "absolute",
          top: -18, left: -22, right: -14, bottom: -16,
          borderRadius: 40,
          background: "radial-gradient(ellipse at 65% 60%, rgba(212,175,55,0.65) 0%, rgba(180,140,30,0.30) 42%, transparent 70%)",
          filter: "blur(13px)",
          zIndex: 0,
        }} />
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20,
          border: "1px solid rgba(212,175,55,0.55)",
          background: "transparent",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#D4AF37"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
          <span style={{ color: "#D4AF37", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>Premium</span>
        </div>
      </div>

      {/* Free — sin glow */}
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute",
          inset: -10,
          borderRadius: 32,
          background: "radial-gradient(ellipse at 50% 55%, rgba(242,231,228,0.08) 0%, transparent 70%)",
          filter: "blur(8px)",
          zIndex: 0,
        }} />
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20,
          border: "1px solid rgba(242,231,228,0.18)",
          background: "transparent",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(242,231,228,0.38)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ color: "rgba(242,231,228,0.38)", fontSize: 11, fontWeight: 500, letterSpacing: 0.3 }}>Plan Gratuito</span>
        </div>
      </div>
    </div>
  );
}
