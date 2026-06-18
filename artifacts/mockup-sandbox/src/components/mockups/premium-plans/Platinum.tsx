import "./_group.css";

export function Platinum() {
  return (
    <div className="min-h-screen bg-[#050308] flex items-center justify-center p-8">
      <div
        className="relative rounded-2xl overflow-hidden flex"
        style={{
          width: 620,
          height: 210,
          boxShadow: "0 0 60px rgba(226,232,240,0.10), 0 0 25px rgba(212,175,55,0.15), 0 2px 30px rgba(0,0,0,0.8)",
          border: "1px solid rgba(226,232,240,0.20)",
        }}
      >
        {/* Background: deep dark with cool tone */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(130deg, #0F0C18 0%, #080610 40%, #050308 100%)",
          }}
        />

        {/* Platinum shimmer sweep */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(105deg, transparent 30%, rgba(226,232,240,0.04) 50%, transparent 70%)",
          }}
        />

        {/* Gold top-right glow */}
        <div
          className="absolute"
          style={{
            right: -30, top: -30, width: 220, height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 65%)",
          }}
        />

        {/* Platinum bottom-left glow */}
        <div
          className="absolute"
          style={{
            left: 170, bottom: -40, width: 200, height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(148,163,184,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Decorative rings */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 620 210"
          fill="none"
          style={{ opacity: 0.08 }}
        >
          <ellipse cx="490" cy="105" rx="170" ry="150" stroke="url(#platGrad)" strokeWidth="0.8" />
          <ellipse cx="490" cy="105" rx="210" ry="185" stroke="url(#platGrad)" strokeWidth="0.5" />
          <defs>
            <linearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Left: Bowl image */}
        <div className="relative flex-shrink-0" style={{ width: 200 }}>
          <img
            src="/__mockup/images/bowl-ref.png"
            alt="Singing bowl"
            className="absolute inset-0 w-full h-full object-cover object-left"
            style={{ filter: "saturate(0.2) brightness(0.60)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to right, rgba(8,6,16,0.2) 0%, #080610 100%)",
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
                style={{ color: "rgba(226,232,240,0.55)" }}
              >
                PLAN PREMIUM
              </p>
              <h2
                className="font-['Playfair_Display'] text-3xl font-bold tracking-wide leading-none"
                style={{
                  background: "linear-gradient(135deg, #E2E8F0 0%, #D4AF37 40%, #CBD5E1 80%, #F8FAFC 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                PLATINUM
              </h2>
            </div>
            {/* Platinum+gold icon */}
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 44,
                height: 44,
                background: "linear-gradient(135deg, #CBD5E1, #94A3B8, #D4AF37)",
                boxShadow: "0 0 20px rgba(212,175,55,0.25), 0 0 10px rgba(226,232,240,0.15)",
                border: "1px solid rgba(226,232,240,0.25)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 12C4 12 6 8 12 8C18 8 20 12 20 12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M4 12C4 12 6 16 12 16C18 16 20 12 20 12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="2" fill="white"/>
              </svg>
            </div>
          </div>

          {/* Exclusive badges */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(226,232,240,0.18)" }}
            >
              <span style={{ fontSize: 9 }}>💬</span>
              <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(226,232,240,0.65)" }}>
                CHAT FUNDADOR
              </span>
            </div>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(212,175,55,0.10)", border: "1px solid rgba(212,175,55,0.22)" }}
            >
              <span style={{ fontSize: 9 }}>🎥</span>
              <span style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(212,175,55,0.70)" }}>
                ZOOM CALLS
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed" style={{ color: "rgba(226,232,240,0.45)" }}>
            Todo Galactic + chats con el fundador y Zoom calls exclusivas.
          </p>

          {/* Feature icons */}
          <div className="flex items-center gap-3">
            {[
              { icon: "♪", label: "SONIDOS", col: "rgba(212,175,55,0.85)" },
              { icon: "⊞", label: "SECCIONES", col: "rgba(226,232,240,0.70)" },
              { icon: "✦", label: "GEOMETRIX", col: "rgba(167,139,250,0.75)" },
              { icon: "💬", label: "CHAT", col: "rgba(226,232,240,0.65)" },
              { icon: "🎥", label: "ZOOM", col: "rgba(212,175,55,0.65)" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-0.5">
                <span style={{ fontSize: 15, color: f.col }}>{f.icon}</span>
                <span
                  className="text-center font-semibold"
                  style={{ fontSize: 7, letterSpacing: "0.10em", color: "rgba(226,232,240,0.45)", lineHeight: 1.4 }}
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
