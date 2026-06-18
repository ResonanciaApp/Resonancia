export function V3() {
  return (
    <div style={{ width: 390, fontFamily: "'Georgia', 'Times New Roman', serif", background: "#0f030a" }}>
      {/* ── Hero Banner ── */}
      <div
        style={{
          width: 390,
          height: 188,
          background: "radial-gradient(ellipse 280px 180px at 50% 60%, #3d0a18 0%, #1e0610 40%, #0f030a 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Sacred geometry — outer ring */}
        <svg
          style={{ position: "absolute", inset: 0 }}
          width="390"
          height="188"
          viewBox="0 0 390 188"
        >
          {/* Outer petals */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const cx = 195 + Math.cos(rad) * 50;
            const cy = 94 + Math.sin(rad) * 50;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={50}
                stroke="rgba(180,115,68,0.14)"
                strokeWidth="0.7"
                fill="none"
              />
            );
          })}
          {/* Center circle */}
          <circle cx="195" cy="94" r="50" stroke="rgba(212,175,55,0.22)" strokeWidth="0.9" fill="none" />
          <circle cx="195" cy="94" r="76" stroke="rgba(212,175,55,0.10)" strokeWidth="0.7" fill="none" strokeDasharray="3 5" />
          <circle cx="195" cy="94" r="100" stroke="rgba(74,12,12,0.4)" strokeWidth="0.6" fill="none" />

          {/* Radial lines */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={195 + Math.cos(rad) * 50}
                y1={94 + Math.sin(rad) * 50}
                x2={195 + Math.cos(rad) * 100}
                y2={94 + Math.sin(rad) * 100}
                stroke="rgba(212,175,55,0.09)"
                strokeWidth="0.6"
              />
            );
          })}

          {/* Center glow dot */}
          <circle cx="195" cy="94" r="4" fill="rgba(212,175,55,0.7)" />
          <circle cx="195" cy="94" r="2" fill="#D4AF37" />
        </svg>

        {/* Radial light bloom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 200px 160px at 50% 50%, rgba(180,60,60,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Top label */}
        <div
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ width: 28, height: 1, background: "rgba(212,175,55,0.4)" }} />
          <span style={{ fontSize: 8.5, letterSpacing: 4, color: "rgba(212,175,55,0.75)", fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 600, textTransform: "uppercase" }}>
            CASA DEL CUENCO
          </span>
          <div style={{ width: 28, height: 1, background: "rgba(212,175,55,0.4)" }} />
        </div>

        {/* Main title */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: 14,
              color: "#F4DAD5",
              textShadow: "0 0 50px rgba(180,60,60,0.6), 0 0 20px rgba(212,175,55,0.3)",
              lineHeight: 1,
              paddingLeft: 14,
            }}
          >
            EQUIPO
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 9,
              letterSpacing: 3,
              color: "rgba(244,218,213,0.45)",
              fontFamily: "'Helvetica Neue', sans-serif",
            }}
          >
            RESONADORES · EXPANSORES
          </div>
        </div>

        {/* Bottom gradient */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            background: "linear-gradient(to bottom, transparent, #0f030a)",
          }}
        />
      </div>

      {/* ── Bajada premium ── */}
      <div
        style={{
          width: 390,
          padding: "0",
          background: "linear-gradient(135deg, #1e0610 0%, #120309 100%)",
          borderTop: "1px solid rgba(180,115,68,0.2)",
        }}
      >
        {/* Gold top edge line */}
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.5) 50%, transparent)" }} />
        <div style={{ padding: "14px 28px 16px", textAlign: "center" }}>
          <div
            style={{
              fontSize: 13.5,
              color: "#F4DAD5",
              fontWeight: 600,
              letterSpacing: 0.3,
              lineHeight: 1.4,
            }}
          >
            Quienes sostienen el espacio sagrado.
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "rgba(244,218,213,0.5)",
              fontFamily: "'Helvetica Neue', sans-serif",
              letterSpacing: 0.2,
              lineHeight: 1.4,
            }}
          >
            Maestros, artistas y guías de nuestra comunidad.
          </div>
        </div>
      </div>
    </div>
  );
}
