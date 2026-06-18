import "./_group.css";

export function Gold() {
  return (
    <div className="min-h-screen bg-[#0F0409] flex items-center justify-center p-8">
      <div
        className="relative rounded-2xl overflow-hidden flex"
        style={{
          width: 620,
          height: 210,
          boxShadow: "0 0 40px rgba(212,175,55,0.18), 0 2px 24px rgba(0,0,0,0.6)",
          border: "1px solid rgba(212,175,55,0.30)",
        }}
      >
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(120deg, #2A0E17 0%, #1A060D 45%, #0E0307 100%)",
          }}
        />
        {/* Decorative curved lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 620 210"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ opacity: 0.07 }}
        >
          <ellipse cx="500" cy="105" rx="180" ry="160" stroke="#D4AF37" strokeWidth="1" />
          <ellipse cx="500" cy="105" rx="220" ry="200" stroke="#D4AF37" strokeWidth="0.7" />
          <ellipse cx="500" cy="105" rx="140" ry="120" stroke="#D4AF37" strokeWidth="0.5" />
        </svg>

        {/* Left: Bowl image */}
        <div className="relative flex-shrink-0" style={{ width: 200 }}>
          <img
            src="/__mockup/images/bowl-ref.png"
            alt="Singing bowl"
            className="absolute inset-0 w-full h-full object-cover object-left"
            style={{ filter: "saturate(0.85) brightness(0.75)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to right, transparent 60%, #1A060D 100%)",
            }}
          />
        </div>

        {/* Right: Content */}
        <div className="relative flex-1 flex flex-col justify-between px-5 py-4">
          {/* Top row: label + gold icon */}
          <div className="flex items-start justify-between">
            <div>
              <p
                className="text-xs tracking-[0.25em] font-semibold mb-0.5"
                style={{ color: "rgba(212,175,55,0.75)" }}
              >
                PLAN PREMIUM
              </p>
              <h2
                className="font-['Playfair_Display'] text-3xl font-bold tracking-wide leading-none"
                style={{ color: "#D4AF37" }}
              >
                GOLD
              </h2>
            </div>
            {/* Gold circle icon */}
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 44,
                height: 44,
                background: "linear-gradient(135deg, #D6AD5F, #B47344)",
                boxShadow: "0 0 16px rgba(212,175,55,0.35)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M4 12C4 12 6 8 12 8C18 8 20 12 20 12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M4 12C4 12 6 16 12 16C18 16 20 12 20 12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="2" fill="white"/>
              </svg>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed" style={{ color: "rgba(244,218,213,0.60)" }}>
            Desbloquea todas las secciones, sonidos<br />y funcionalidades de la app.
          </p>

          {/* Feature icons */}
          <div className="flex items-center gap-5">
            {[
              { icon: "♪", label: "SONIDOS\nILIMITADOS" },
              { icon: "⊞", label: "TODAS LAS\nSECCIONES" },
              { icon: "✿", label: "TODAS LAS\nFUNCIONALIDADES" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-1">
                <span style={{ fontSize: 18, color: "#D4AF37", opacity: 0.85 }}>{f.icon}</span>
                <span
                  className="text-center font-semibold"
                  style={{ fontSize: 7.5, letterSpacing: "0.12em", color: "rgba(212,175,55,0.70)", lineHeight: 1.4, whiteSpace: "pre-line" }}
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
