export function VarianteC() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#10091F" }}>
      <div style={{ width: 380 }}>
        {/* Label */}
        <p style={{ color: "#9080CC", fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
          Variante C — Violeta Humo
        </p>
        {/* Card outer */}
        <div style={{
          borderRadius: 18,
          boxShadow: "0 3px 20px 0 rgba(100,80,180,0.22)",
        }}>
          {/* Card */}
          <div style={{
            background: "rgba(18,10,36,0.95)",
            borderRadius: 18,
            border: "1px solid rgba(100,80,180,0.30)",
            overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: 15 }}>
              {/* Icon */}
              <div style={{ width: 58, height: 58, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(100,80,180,0.14) 0%, transparent 70%)" }} />
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <path d="M17 3L31 11V23L17 31L3 23V11L17 3Z" stroke="rgba(150,128,210,0.85)" strokeWidth="1.5" fill="rgba(100,80,180,0.07)" />
                  <path d="M17 3L17 31M3 11L31 11M3 23L31 23" stroke="rgba(100,80,180,0.38)" strokeWidth="0.8" />
                  <path d="M17 3L31 23M17 3L3 23M17 31L3 11M17 31L31 11" stroke="rgba(100,80,180,0.22)" strokeWidth="0.6" />
                </svg>
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#EDE1D3", marginBottom: 3, letterSpacing: 0.3 }}>
                  Toca para explorar
                </p>
                <p style={{ fontSize: 12, color: "#7A8FA8", lineHeight: 1.4 }}>
                  Crea y estudia geometría sagrada
                </p>
                {/* Tag */}
                <div style={{
                  marginTop: 7,
                  display: "inline-flex",
                  alignItems: "center",
                  background: "rgba(100,80,180,0.09)",
                  border: "1px solid rgba(100,80,180,0.22)",
                  borderRadius: 20,
                  padding: "2px 9px",
                }}>
                  <span style={{ fontSize: 10, color: "#c8c0e0", letterSpacing: 0.5 }}>✦ Nuevo</span>
                </div>
              </div>

              {/* Chevron */}
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: "rgba(100,80,180,0.09)",
                border: "1px solid rgba(100,80,180,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 3L7.5 6L4.5 9" stroke="rgba(150,128,210,0.80)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
