export function V4() {
  return (
    <div style={{ width: 390, fontFamily: "'Helvetica Neue', Arial, sans-serif", background: "#080010" }}>
      {/* ── Hero Banner ── */}
      <div
        style={{
          width: 390,
          height: 188,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(145deg, #110020 0%, #0d0015 35%, #1a0028 65%, #0a0018 100%)",
        }}
      >
        {/* Animated grid lines */}
        <svg
          style={{ position: "absolute", inset: 0, opacity: 0.18 }}
          width="390"
          height="188"
          viewBox="0 0 390 188"
        >
          {/* Horizontal grid */}
          {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="390" y2={y} stroke="#6B21A8" strokeWidth="0.5" />
          ))}
          {/* Vertical grid */}
          {[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="188" stroke="#6B21A8" strokeWidth="0.5" />
          ))}
          {/* Converging lines to center */}
          {[
            [0, 0], [0, 94], [0, 188], [390, 0], [390, 94], [390, 188],
            [97, 0], [195, 0], [293, 0], [97, 188], [195, 188], [293, 188],
          ].map(([x, y], i) => (
            <line key={`c${i}`} x1={x} y1={y} x2="195" y2="94" stroke="#D4AF37" strokeWidth="0.4" opacity="0.5" />
          ))}
        </svg>

        {/* Purple/gold orbs */}
        <div style={{ position: "absolute", left: 60, top: 40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(147,51,234,0.25) 0%, transparent 70%)", filter: "blur(8px)" }} />
        <div style={{ position: "absolute", right: 50, bottom: 30, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)", filter: "blur(6px)" }} />
        <div style={{ position: "absolute", left: "40%", top: "30%", width: 160, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,60,180,0.18) 0%, transparent 70%)", filter: "blur(10px)" }} />

        {/* Top badge */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 20,
            background: "rgba(147,51,234,0.25)",
            border: "1px solid rgba(147,51,234,0.4)",
            borderRadius: 4,
            padding: "3px 8px",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#9333ea", boxShadow: "0 0 6px #9333ea" }} />
          <span style={{ fontSize: 8.5, letterSpacing: 2, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: 600 }}>
            RESONANCIA
          </span>
        </div>

        {/* Main title — layered/glitch feel */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          {/* Shadow layer */}
          <div
            style={{
              position: "absolute",
              top: 3,
              left: 3,
              fontSize: 50,
              fontWeight: 900,
              letterSpacing: 10,
              color: "rgba(147,51,234,0.4)",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            EQUIPO
          </div>
          {/* Main text */}
          <div
            style={{
              fontSize: 50,
              fontWeight: 900,
              letterSpacing: 10,
              color: "#F4DAD5",
              textShadow: "0 0 30px rgba(147,51,234,0.8), 0 0 60px rgba(212,175,55,0.2)",
              lineHeight: 1,
              position: "relative",
              whiteSpace: "nowrap",
            }}
          >
            EQU
            <span style={{ color: "#D4AF37", textShadow: "0 0 20px rgba(212,175,55,0.9)" }}>I</span>
            PO
          </div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
              justifyContent: "center",
            }}
          >
            <div style={{ width: 20, height: 1, background: "rgba(147,51,234,0.6)" }} />
            <span style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.45)" }}>
              RESONADORES · EXPANSORES
            </span>
            <div style={{ width: 20, height: 1, background: "rgba(147,51,234,0.6)" }} />
          </div>
        </div>

        {/* Bottom-right corner art */}
        <svg style={{ position: "absolute", bottom: 12, right: 14 }} width="48" height="48" viewBox="0 0 48 48" fill="none">
          <polygon points="24,4 44,14 44,34 24,44 4,34 4,14" stroke="rgba(212,175,55,0.4)" strokeWidth="1" fill="none" />
          <polygon points="24,12 36,18 36,30 24,36 12,30 12,18" stroke="rgba(147,51,234,0.4)" strokeWidth="0.8" fill="none" />
          <circle cx="24" cy="24" r="4" fill="rgba(212,175,55,0.7)" />
        </svg>

        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            background: "linear-gradient(to bottom, transparent, rgba(8,0,16,0.95))",
          }}
        />
      </div>

      {/* ── Bajada premium ── */}
      <div
        style={{
          width: 390,
          background: "linear-gradient(90deg, rgba(147,51,234,0.12) 0%, rgba(8,0,16,0.95) 50%, rgba(212,175,55,0.08) 100%)",
          borderTop: "1px solid rgba(147,51,234,0.25)",
          borderBottom: "1px solid rgba(212,175,55,0.12)",
        }}
      >
        <div style={{ height: 1, background: "linear-gradient(90deg, rgba(147,51,234,0.4), rgba(212,175,55,0.4), rgba(147,51,234,0.4))" }} />
        <div style={{ padding: "13px 22px 15px", display: "flex", alignItems: "center", gap: 12 }}>
          {/* Icon */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(147,51,234,0.2)",
              border: "1px solid rgba(147,51,234,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 14 }}>✦</span>
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#F4DAD5", fontWeight: 700, letterSpacing: 0.2 }}>
              Una comunidad de creadores de luz.
            </div>
            <div style={{ fontSize: 11, color: "rgba(244,218,213,0.5)", marginTop: 3 }}>
              Descubrí a los artistas y guías del universo RESONANCIA.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
