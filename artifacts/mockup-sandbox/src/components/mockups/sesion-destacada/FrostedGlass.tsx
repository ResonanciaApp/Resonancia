export function FrostedGlass() {
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

          {/* Subtle top gradient */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "30%",
            background: "linear-gradient(to bottom, rgba(9,15,23,0.45) 0%, transparent 100%)",
          }} />

          {/* Center decoration */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 90,
          }}>
            <div style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              border: "1px solid rgba(190,150,80,0.28)",
              boxShadow: "0 0 40px rgba(190,150,80,0.12), inset 0 0 20px rgba(190,150,80,0.05)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ fontSize: 28 }}>🪘</span>
            </div>
          </div>

          {/* Frosted glass panel */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 18px 18px",
            backdropFilter: "blur(20px) saturate(1.4)",
            WebkitBackdropFilter: "blur(20px) saturate(1.4)",
            backgroundColor: "rgba(15,21,32,0.72)",
            borderTop: "1px solid rgba(190,150,80,0.14)",
          }}>
            {/* Category + premium row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}>
              <span style={{
                fontSize: 11,
                color: "#BE9650",
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}>
                Sonidos Ancestrales
              </span>
              <span style={{ color: "#BE9650", fontSize: 12 }}>★</span>
            </div>

            {/* Title */}
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#EDE1D3",
              lineHeight: 1.2,
              marginBottom: 12,
            }}>
              Más allá del sonido
            </div>

            {/* Duration + Play inline */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#7A8FA8" }}>⏱</span>
                <span style={{ fontSize: 13, color: "#7A8FA8" }}>5 min · Casa del Cuenco</span>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "rgba(190,150,80,0.15)",
                border: "1px solid rgba(190,150,80,0.35)",
                borderRadius: 20,
                padding: "6px 14px",
                cursor: "pointer",
              }}>
                <span style={{ color: "#BE9650", fontSize: 12 }}>▶</span>
                <span style={{ color: "#BE9650", fontSize: 12, fontWeight: 700 }}>Escuchar</span>
              </div>
            </div>
          </div>
        </div>

        <p style={{ color: "#7A8FA8", fontSize: 11, textAlign: "center", marginTop: 16, letterSpacing: 0.5 }}>
          C — Frosted Glass
        </p>
      </div>
    </div>
  );
}
