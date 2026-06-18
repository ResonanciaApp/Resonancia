import "./_group.css";

function GeometrixChip() {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-full"
      style={{
        background: "rgba(139,92,246,0.18)",
        border: "1px solid rgba(139,92,246,0.45)",
      }}
    >
      {/* Geometrix-style mandala icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" stroke="#A78BFA" strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="12" r="4" stroke="#C4B5FD" strokeWidth="1.2" fill="none"/>
        <line x1="12" y1="2" x2="12" y2="22" stroke="#A78BFA" strokeWidth="0.8" opacity="0.5"/>
        <line x1="4" y1="7" x2="20" y2="17" stroke="#A78BFA" strokeWidth="0.8" opacity="0.5"/>
        <line x1="20" y1="7" x2="4" y2="17" stroke="#A78BFA" strokeWidth="0.8" opacity="0.5"/>
      </svg>
      <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.18em", color: "#C4B5FD" }}>
        GEOMETRIX
      </span>
    </div>
  );
}

function Star({ x, y, r }: { x: number; y: number; r: number }) {
  return <circle cx={x} cy={y} r={r} fill="white" opacity={0.5 + Math.random() * 0.5} />;
}

export function Galactic() {
  const stars = [
    { x: 240, y: 25, r: 0.8 }, { x: 310, y: 15, r: 1.1 }, { x: 380, y: 40, r: 0.6 },
    { x: 450, y: 20, r: 0.9 }, { x: 500, y: 55, r: 0.7 }, { x: 530, y: 30, r: 1.2 },
    { x: 570, y: 65, r: 0.5 }, { x: 590, y: 18, r: 0.8 }, { x: 270, y: 70, r: 0.6 },
    { x: 420, y: 80, r: 0.9 }, { x: 350, y: 185, r: 0.7 }, { x: 480, y: 175, r: 1.0 },
    { x: 545, y: 160, r: 0.6 }, { x: 610, y: 140, r: 0.8 }, { x: 600, y: 90, r: 0.5 },
  ];

  return (
    <div className="min-h-screen bg-[#04010A] flex items-center justify-center p-8">
      <div
        className="relative rounded-2xl overflow-hidden flex"
        style={{
          width: 620,
          height: 210,
          boxShadow: "0 0 50px rgba(139,92,246,0.20), 0 0 20px rgba(139,92,246,0.10), 0 2px 24px rgba(0,0,0,0.7)",
          border: "1px solid rgba(139,92,246,0.35)",
        }}
      >
        {/* Background: deep space */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(120deg, #0D0420 0%, #080115 45%, #040010 100%)",
          }}
        />

        {/* Purple nebula glow */}
        <div
          className="absolute"
          style={{
            right: -40, top: -40, width: 260, height: 260,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="absolute"
          style={{
            left: 160, bottom: -30, width: 200, height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Stars */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 620 210" fill="none">
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={0.4 + (i % 3) * 0.15} />
          ))}
        </svg>

        {/* Geometric orbit rings */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 620 210"
          fill="none"
          style={{ opacity: 0.10 }}
        >
          <ellipse cx="490" cy="105" rx="160" ry="140" stroke="#A78BFA" strokeWidth="0.8" />
          <ellipse cx="490" cy="105" rx="200" ry="175" stroke="#8B5CF6" strokeWidth="0.5" strokeDasharray="4 6" />
        </svg>

        {/* Left: Bowl image with purple tint */}
        <div className="relative flex-shrink-0" style={{ width: 200 }}>
          <img
            src="/__mockup/images/bowl-ref.png"
            alt="Singing bowl"
            className="absolute inset-0 w-full h-full object-cover object-left"
            style={{ filter: "saturate(0.4) brightness(0.55) hue-rotate(200deg)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to right, rgba(13,4,32,0.3) 0%, #0D0420 100%)",
            }}
          />
        </div>

        {/* Right: Content */}
        <div className="relative flex-1 flex flex-col justify-between px-5 py-4">
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div>
              <p
                className="text-xs tracking-[0.25em] font-semibold mb-0.5"
                style={{ color: "rgba(167,139,250,0.75)" }}
              >
                PLAN PREMIUM
              </p>
              <h2
                className="font-['Playfair_Display'] text-3xl font-bold tracking-wide leading-none"
                style={{
                  background: "linear-gradient(135deg, #C4B5FD 0%, #D4AF37 60%, #A78BFA 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                GALACTIC
              </h2>
            </div>
            {/* Purple+gold icon */}
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 44,
                height: 44,
                background: "linear-gradient(135deg, #7C3AED, #4C1D95)",
                boxShadow: "0 0 18px rgba(139,92,246,0.45), 0 0 6px rgba(139,92,246,0.3)",
                border: "1px solid rgba(167,139,250,0.4)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 12C4 12 6 8 12 8C18 8 20 12 20 12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M4 12C4 12 6 16 12 16C18 16 20 12 20 12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="2" fill="white"/>
              </svg>
            </div>
          </div>

          {/* Geometrix chip */}
          <div className="flex">
            <GeometrixChip />
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed" style={{ color: "rgba(196,181,253,0.55)" }}>
            Todo Gold + acceso completo a Geometrix.
          </p>

          {/* Feature icons */}
          <div className="flex items-center gap-4">
            {[
              { icon: "♪", label: "SONIDOS\nILIMITADOS", col: "rgba(212,175,55,0.8)" },
              { icon: "⊞", label: "TODAS LAS\nSECCIONES", col: "rgba(167,139,250,0.8)" },
              { icon: "✦", label: "GEOMETRIX\nINCLUIDO", col: "rgba(167,139,250,0.9)" },
              { icon: "✿", label: "FUNCIONA-\nLIDADES", col: "rgba(196,181,253,0.7)" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-1">
                <span style={{ fontSize: 16, color: f.col }}>{f.icon}</span>
                <span
                  className="text-center font-semibold"
                  style={{ fontSize: 7, letterSpacing: "0.10em", color: "rgba(196,181,253,0.60)", lineHeight: 1.4, whiteSpace: "pre-line" }}
                >
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
