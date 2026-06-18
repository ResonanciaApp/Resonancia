export function V1() {
  return (
    <div style={{ width: 390, fontFamily: "'Georgia', serif", background: "#0D0208" }}>
      {/* ── Hero Banner ── */}
      <div
        style={{
          width: 390,
          height: 188,
          background: "linear-gradient(160deg, #1a0410 0%, #0d0208 50%, #12030c 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Stars */}
        {[
          [32, 28], [80, 14], [140, 44], [200, 10], [260, 32], [320, 18], [360, 40],
          [50, 70], [110, 85], [175, 60], [240, 80], [300, 65], [355, 75],
          [20, 110], [90, 130], [160, 115], [230, 140], [295, 120], [350, 145],
          [65, 160], [130, 175], [210, 165], [280, 155], [345, 170],
        ].map(([cx, cy], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: cx,
              top: cy,
              width: i % 5 === 0 ? 2.5 : 1.5,
              height: i % 5 === 0 ? 2.5 : 1.5,
              borderRadius: "50%",
              background: i % 5 === 0 ? "#D4AF37" : "rgba(244,218,213,0.55)",
              boxShadow: i % 5 === 0 ? "0 0 5px #D4AF37" : "none",
            }}
          />
        ))}

        {/* Radial bloom */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "46%",
            transform: "translate(-50%,-50%)",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(212,175,55,0.10) 0%, rgba(74,12,12,0.12) 45%, transparent 70%)",
          }}
        />

        {/* Constellation arcs */}
        <svg
          style={{ position: "absolute", inset: 0 }}
          width="390"
          height="188"
          viewBox="0 0 390 188"
          fill="none"
        >
          <ellipse
            cx="195" cy="86" rx="78" ry="54"
            stroke="rgba(212,175,55,0.18)" strokeWidth="0.8" strokeDasharray="4 6"
          />
          <ellipse
            cx="195" cy="86" rx="108" ry="75"
            stroke="rgba(212,175,55,0.08)" strokeWidth="0.6" strokeDasharray="2 8"
          />
          <line x1="117" y1="86" x2="273" y2="86" stroke="rgba(212,175,55,0.12)" strokeWidth="0.6" />
          <line x1="195" y1="12" x2="195" y2="160" stroke="rgba(212,175,55,0.08)" strokeWidth="0.6" />
        </svg>

        {/* Etiqueta */}
        <div
          style={{
            position: "absolute",
            top: 22,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 9,
            letterSpacing: 5,
            color: "#D4AF37",
            textTransform: "uppercase",
            fontFamily: "'Helvetica Neue', sans-serif",
            fontWeight: 600,
            opacity: 0.85,
          }}
        >
          RESONANCIA
        </div>

        {/* Título principal */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 46,
              letterSpacing: 12,
              color: "#F4DAD5",
              fontFamily: "'Georgia', serif",
              fontWeight: 700,
              textShadow: "0 0 30px rgba(212,175,55,0.35), 0 2px 8px rgba(0,0,0,0.8)",
              lineHeight: 1,
            }}
          >
            EQUIPO
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              letterSpacing: 3,
              color: "rgba(244,218,213,0.55)",
              fontFamily: "'Helvetica Neue', sans-serif",
              fontWeight: 400,
            }}
          >
            RESONADORES · EXPANSORES
          </div>
        </div>

        {/* Puntos cardinales dorados */}
        {[
          { top: 86 - 54 - 5, left: "50%", ml: -3 },
          { top: 86 + 54 - 5, left: "50%", ml: -3 },
          { top: 86 - 3, left: 195 - 78 - 5 },
          { top: 86 - 3, left: 195 + 78 - 5 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              marginLeft: pos.ml,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#D4AF37",
              boxShadow: "0 0 8px #D4AF37",
            }}
          />
        ))}

        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 36,
            background: "linear-gradient(to bottom, transparent, rgba(13,2,8,0.85))",
          }}
        />
      </div>

      {/* ── Bajada premium ── */}
      <div
        style={{
          width: 390,
          padding: "16px 24px 18px",
          background: "linear-gradient(135deg, rgba(74,12,12,0.55) 0%, rgba(27,6,15,0.9) 100%)",
          borderTop: "1px solid rgba(212,175,55,0.22)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 2,
            height: 36,
            background: "linear-gradient(to bottom, #D4AF37, transparent)",
            borderRadius: 2,
            flexShrink: 0,
            marginTop: 2,
          }}
        />
        <div>
          <div style={{ fontSize: 13, color: "#F4DAD5", fontFamily: "'Georgia', serif", fontWeight: 600, lineHeight: 1.4 }}>
            Los guardianes del sonido sagrado.
          </div>
          <div style={{ fontSize: 11.5, color: "rgba(244,218,213,0.6)", fontFamily: "'Helvetica Neue', sans-serif", marginTop: 3, lineHeight: 1.4 }}>
            Conocé a quienes tejen la experiencia RESONANCIA.
          </div>
        </div>
      </div>
    </div>
  );
}
