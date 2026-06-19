// Variante C — Gradiente dorado sólido
export function ChipC() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: "#130107" }}>
      <p style={{ color: "rgba(242,231,228,0.35)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>C — Gradiente sólido</p>

      {/* Premium */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 14px", borderRadius: 20,
        background: "linear-gradient(90deg, #B8922A 0%, #D4AF37 50%, #E9C46A 100%)",
        border: "none",
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="#5C3E00"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
        <span style={{ color: "#3B2800", fontSize: 11, fontWeight: 800, letterSpacing: 0.6 }}>PREMIUM</span>
      </div>

      {/* Free */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 14px", borderRadius: 20,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(242,231,228,0.10)",
      }}>
        <span style={{ color: "rgba(242,231,228,0.35)", fontSize: 11, fontWeight: 500, letterSpacing: 0.3 }}>Plan Gratuito</span>
      </div>
    </div>
  );
}
