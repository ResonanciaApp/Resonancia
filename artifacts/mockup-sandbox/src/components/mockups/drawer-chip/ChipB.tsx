// Variante B — Relleno suave (actual, mejorada)
export function ChipB() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "#130107" }}>
      <p style={{ color: "rgba(242,231,228,0.35)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>B — Relleno suave</p>

      {/* Premium */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 13px", borderRadius: 20,
        background: "rgba(212,175,55,0.14)",
        border: "1px solid rgba(212,175,55,0.40)",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="#D4AF37"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
        <span style={{ color: "#D4AF37", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>Premium</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5FB98C" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>

      {/* Free */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 13px", borderRadius: 20,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(242,231,228,0.12)",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(242,231,228,0.38)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span style={{ color: "rgba(242,231,228,0.38)", fontSize: 11, fontWeight: 500, letterSpacing: 0.3 }}>Plan Gratuito</span>
      </div>
    </div>
  );
}
