export function GradientEditorial() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0B0F14" }}>
      <div style={{ width: 360 }}>

        <div style={{
          borderRadius: 18,
          overflow: "hidden",
          position: "relative",
          height: 300,
          boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
        }}>
          {/* Background image simulation */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(160deg, #2a1a0a 0%, #5a3510 30%, #b87a2a 60%, #d4a044 80%, #1a0f05 100%)",
          }} />

          {/* Top "Sesión del día" eyebrow */}
          <div style={{
            position: "absolute",
            top: 14,
            left: 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <div style={{
              backgroundColor: "rgba(0,0,0,0.52)",
              borderRadius: 20,
              padding: "4px 12px",
              display: "flex",
              alignItems: "center",
              gap: 5,
              backdropFilter: "blur(8px)",
            }}>
              <span style={{ color: "#BE9650", fontSize: 9 }}>✦</span>
              <span style={{ color: "#EDE1D3", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
                Sesión del día
              </span>
            </div>
          </div>

          {/* Glow center decoration */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 60,
          }}>
            <div style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              border: "1px solid rgba(190,150,80,0.3)",
              boxShadow: "0 0 30px rgba(190,150,80,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 24 }}>🪘</span>
            </div>
          </div>

          {/* Heavy gradient overlay from bottom */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "65%",
            background: "linear-gradient(to top, rgba(9,15,23,0.97) 0%, rgba(9,15,23,0.82) 55%, transparent 100%)",
          }} />

          {/* Bottom content */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0 18px 18px",
          }}>
            {/* Title */}
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#EDE1D3",
              lineHeight: 1.2,
              marginBottom: 8,
            }}>
              Más allá del sonido
            </div>

            {/* Meta + play button row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}>
                  <span style={{ fontSize: 12, color: "#7A8FA8" }}>⏱</span>
                  <span style={{ fontSize: 13, color: "#7A8FA8" }}>5 min</span>
                </div>
                <span style={{ color: "rgba(122,143,168,0.5)", fontSize: 12 }}>·</span>
                <span style={{ fontSize: 13, color: "#7A8FA8" }}>Casa del Cuenco</span>
              </div>

              {/* Circular play button */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #BE9650, #D6A85B)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(190,150,80,0.4)",
                flexShrink: 0,
              }}>
                <span style={{ color: "#0B0F14", fontSize: 16, marginLeft: 2 }}>▶</span>
              </div>
            </div>
          </div>
        </div>

        <p style={{ color: "#7A8FA8", fontSize: 11, textAlign: "center", marginTop: 16, letterSpacing: 0.5 }}>
          B — Gradient Editorial
        </p>
      </div>
    </div>
  );
}
