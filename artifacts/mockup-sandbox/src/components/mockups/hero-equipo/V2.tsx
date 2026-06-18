export function V2() {
  const lines = Array.from({ length: 18 }, (_, i) => i);

  return (
    <div style={{ width: 390, fontFamily: "'Helvetica Neue', Arial, sans-serif", background: "#100308" }}>
      {/* ── Hero Banner ── */}
      <div
        style={{
          width: 390,
          height: 188,
          background: "#0e0208",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Frequency wave lines */}
        <svg
          style={{ position: "absolute", inset: 0 }}
          width="390"
          height="188"
          viewBox="0 0 390 188"
          fill="none"
          preserveAspectRatio="none"
        >
          {lines.map((i) => {
            const y = 10 + i * 10;
            const amp = Math.sin(i * 0.7) * 22 + Math.cos(i * 1.1) * 14;
            const phase = i * 18;
            const isCentral = i >= 7 && i <= 10;
            const opacity = isCentral ? 0.55 : 0.12 + Math.abs(Math.sin(i * 0.5)) * 0.18;
            const color = isCentral ? "#D4AF37" : i % 3 === 0 ? "#B47344" : "#4A0C0C";
            const d = `M 0 ${y} Q ${phase % 195} ${y - amp} 195 ${y} Q ${195 + (phase % 195)} ${y + amp} 390 ${y}`;
            return (
              <path
                key={i}
                d={d}
                stroke={color}
                strokeWidth={isCentral ? 1.2 : 0.7}
                opacity={opacity}
                fill="none"
              />
            );
          })}
          {/* Central highlighted wave */}
          <path
            d="M 0 94 C 50 70 100 118 195 88 S 310 70 390 94"
            stroke="#D4AF37"
            strokeWidth="2"
            opacity="0.8"
            fill="none"
          />
          <path
            d="M 0 94 C 50 70 100 118 195 88 S 310 70 390 94"
            stroke="#E9C46A"
            strokeWidth="6"
            opacity="0.08"
            fill="none"
          />
        </svg>

        {/* Left vertical accent */}
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 32,
            bottom: 32,
            width: 2,
            background: "linear-gradient(to bottom, transparent, #D4AF37 40%, #D4AF37 60%, transparent)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: 5, color: "#D4AF37", marginBottom: 8, textTransform: "uppercase", fontWeight: 700 }}>
            ◆ NUESTRO EQUIPO ◆
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              letterSpacing: 6,
              color: "#F4DAD5",
              textShadow: "0 0 40px rgba(212,175,55,0.4)",
              lineHeight: 1,
            }}
          >
            EQUIPO
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
            }}
          >
            <div style={{ height: 1, width: 32, background: "rgba(212,175,55,0.4)" }} />
            <span style={{ fontSize: 9, letterSpacing: 2, color: "rgba(244,218,213,0.5)" }}>
              RESONADORES · EXPANSORES
            </span>
            <div style={{ height: 1, width: 32, background: "rgba(212,175,55,0.4)" }} />
          </div>
        </div>

        {/* Corner accent top-right */}
        <div
          style={{
            position: "absolute",
            top: 18,
            right: 20,
            width: 36,
            height: 36,
            border: "1px solid rgba(212,175,55,0.3)",
            borderLeft: "none",
            borderBottom: "none",
          }}
        />

        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 32,
            background: "linear-gradient(to bottom, transparent, rgba(14,2,8,0.9))",
          }}
        />
      </div>

      {/* ── Bajada premium ── */}
      <div
        style={{
          width: 390,
          padding: "14px 24px 16px",
          background: "linear-gradient(90deg, #1a0410 0%, #0d0208 100%)",
          borderTop: "1px solid rgba(212,175,55,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#D4AF37", fontSize: 12 }}>⟡</span>
          <span style={{ fontSize: 13, color: "#F4DAD5", fontWeight: 600, letterSpacing: 0.3 }}>
            El alma detrás del sonido.
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(244,218,213,0.55)", paddingLeft: 20, letterSpacing: 0.2 }}>
          Artistas, guías y expansores que dan vida a RESONANCIA.
        </div>
      </div>
    </div>
  );
}
