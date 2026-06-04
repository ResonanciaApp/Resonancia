export function SplitCard() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0B0F14" }}>
      <div style={{ width: 360 }}>

        <div style={{
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: "#151A23",
          boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
        }}>
          {/* Imagen */}
          <div style={{
            height: 200,
            background: "linear-gradient(160deg, #2a1a0a 0%, #5a3510 30%, #b87a2a 60%, #d4a044 80%, #1a0f05 100%)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* Glow ring decoration */}
            <div style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: "1.5px solid rgba(190,150,80,0.35)",
              boxShadow: "0 0 40px rgba(190,150,80,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                border: "1.5px solid rgba(190,150,80,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ fontSize: 28 }}>🪘</span>
              </div>
            </div>

            {/* Premium badge */}
            <div style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "rgba(0,0,0,0.55)",
              borderRadius: 20,
              padding: "3px 10px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <span style={{ color: "#BE9650", fontSize: 10 }}>★</span>
              <span style={{ color: "#BE9650", fontSize: 10, fontWeight: 700 }}>PREMIUM</span>
            </div>
          </div>

          {/* Info panel */}
          <div style={{ padding: "18px 20px 20px" }}>
            {/* Category chip */}
            <div style={{ marginBottom: 10 }}>
              <span style={{
                backgroundColor: "rgba(190,150,80,0.14)",
                color: "#BE9650",
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                letterSpacing: 0.4,
              }}>
                Sonidos Ancestrales
              </span>
            </div>

            {/* Title */}
            <div style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#EDE1D3",
              lineHeight: 1.25,
              marginBottom: 8,
            }}>
              Más allá del sonido
            </div>

            {/* Meta row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 18,
            }}>
              <span style={{ fontSize: 12, color: "#7A8FA8" }}>⏱</span>
              <span style={{ fontSize: 13, color: "#7A8FA8" }}>5 min</span>
              <span style={{ color: "#7A8FA8", fontSize: 12 }}>·</span>
              <span style={{ fontSize: 13, color: "#7A8FA8" }}>Casa del Cuenco</span>
            </div>

            {/* CTA Button */}
            <div style={{
              background: "linear-gradient(90deg, #BE9650, #D6A85B)",
              borderRadius: 30,
              padding: "13px 0",
              textAlign: "center",
              cursor: "pointer",
            }}>
              <span style={{
                color: "#0B0F14",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}>
                ▶  Escuchar ahora
              </span>
            </div>
          </div>
        </div>

        <p style={{ color: "#7A8FA8", fontSize: 11, textAlign: "center", marginTop: 16, letterSpacing: 0.5 }}>
          A — Split Card
        </p>
      </div>
    </div>
  );
}
