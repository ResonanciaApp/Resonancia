import { useState, useEffect, useRef } from "react";

const TABS = ["Ambient", "Enteógena", "Étnica"];
const BG = "#0B0F14";
const CARD = "#151A23";
const GOLD = "#BE9650";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const BORDER = "#1E2733";

const CONTENT: Record<string, { title: string; sub: string; dur: string }[]> = {
  Ambient: [
    { title: "Luna de Jade", sub: "Ambient profundo", dur: "40 min" },
    { title: "Selva Nocturna", sub: "Capas atmosféricas", dur: "35 min" },
    { title: "Viento Boreal", sub: "Frío limpio", dur: "28 min" },
    { title: "Delta Profundo", sub: "Binaurales", dur: "50 min" },
  ],
  Enteógena: [
    { title: "Raíz de Fuego", sub: "Ceremonial", dur: "55 min" },
    { title: "Visión Jaguar", sub: "Enteógena profunda", dur: "60 min" },
    { title: "Portal Índigo", sub: "Expansión suave", dur: "45 min" },
  ],
  Étnica: [
    { title: "Sitar del Ganges", sub: "India clásica", dur: "38 min" },
    { title: "Didgeridoo Rojo", sub: "Australia ancestral", dur: "42 min" },
    { title: "Kora del Sahel", sub: "África occidental", dur: "33 min" },
    { title: "Cuencos del Tíbet", sub: "Meditación", dur: "30 min" },
  ],
};

export function SlideHorizontal() {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [dir, setDir] = useState<"right" | "left">("right");
  const prevRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((a) => {
        const next = (a + 1) % TABS.length;
        setDir(next > a ? "right" : "left");
        prevRef.current = a;
        setAnimKey((k) => k + 1);
        return next;
      });
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const handleTab = (i: number) => {
    if (i === active) return;
    setDir(i > active ? "right" : "left");
    prevRef.current = active;
    setAnimKey((k) => k + 1);
    setActive(i);
  };

  const indicatorLeft = `calc(${active} * 33.333%)`;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#060A0F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .anim-slide-right { animation: slideInRight 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .anim-slide-left  { animation: slideInLeft  240ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
        .tab-btn { transition: color 200ms; }
        .tab-btn:hover { opacity: 0.85; }
        .card-row { transition: background 150ms; }
        .card-row:hover { background: #1c2333 !important; cursor: pointer; }
      `}</style>

      <div
        style={{
          width: 390,
          background: BG,
          borderRadius: 28,
          overflow: "hidden",
          border: `1px solid ${BORDER}`,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Screen header */}
        <div style={{ padding: "22px 20px 4px" }}>
          <div
            style={{
              color: FG,
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "system-ui, -apple-system, sans-serif",
              letterSpacing: -0.4,
            }}
          >
            Música y Sonidos
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ position: "relative", margin: "12px 20px 0", display: "flex" }}>
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className="tab-btn"
              onClick={() => handleTab(i)}
              style={{
                flex: 1,
                padding: "10px 0 12px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: i === active ? GOLD : MUTED,
                fontSize: 13,
                fontWeight: i === active ? 700 : 400,
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              {tab}
            </button>
          ))}
          {/* Gold indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: indicatorLeft,
              width: "33.333%",
              height: 2,
              background: GOLD,
              borderRadius: 2,
              transition: "left 240ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
          />
          {/* Separator line */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background: BORDER,
              zIndex: -1,
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "14px 16px 4px", minHeight: 340, overflow: "hidden" }}>
          <div
            key={animKey}
            className={dir === "right" ? "anim-slide-right" : "anim-slide-left"}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {CONTENT[TABS[active]].map((c, i) => (
              <div
                key={i}
                className="card-row"
                style={{
                  background: CARD,
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: `1px solid ${BORDER}`,
                }}
              >
                <div>
                  <div
                    style={{
                      color: FG,
                      fontFamily: "system-ui",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {c.title}
                  </div>
                  <div
                    style={{
                      color: MUTED,
                      fontFamily: "system-ui",
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    {c.sub}
                  </div>
                </div>
                <div
                  style={{
                    color: GOLD,
                    fontFamily: "system-ui",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {c.dur}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer label */}
        <div
          style={{
            textAlign: "center",
            padding: "12px 0 18px",
            color: MUTED,
            fontSize: 11,
            fontFamily: "system-ui",
            opacity: 0.7,
          }}
        >
          A — Slide Horizontal + Fade · 240ms ease
        </div>
      </div>
    </div>
  );
}
