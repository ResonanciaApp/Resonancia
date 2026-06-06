import { useState, useEffect } from "react";

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

export function VerticalReveal() {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [itemKeys, setItemKeys] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((a) => {
        const next = (a + 1) % TABS.length;
        setAnimKey((k) => k + 1);
        setItemKeys(CONTENT[TABS[next]].map((_, i) => i));
        return next;
      });
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const handleTab = (i: number) => {
    if (i === active) return;
    setAnimKey((k) => k + 1);
    setItemKeys(CONTENT[TABS[i]].map((_, idx) => idx));
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
      }}
    >
      <style>{`
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-reveal-item {
          animation: revealUp 280ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .tab-btn3 { transition: color 200ms; }
        .tab-btn3:hover { opacity: 0.85; }
        .card-row3 { transition: background 150ms; }
        .card-row3:hover { background: #1c2333 !important; cursor: pointer; }
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
              className="tab-btn3"
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
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: indicatorLeft,
              width: "33.333%",
              height: 2,
              background: GOLD,
              borderRadius: 2,
              transition: "left 260ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
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

        {/* Content — each card staggers in */}
        <div style={{ padding: "14px 16px 4px", minHeight: 340 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CONTENT[TABS[active]].map((c, i) => (
              <div
                key={`${animKey}-${i}`}
                className="anim-reveal-item card-row3"
                style={{
                  background: CARD,
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: `1px solid ${BORDER}`,
                  animationDelay: `${i * 40}ms`,
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
          C — Reveal Vertical + Fade + Stagger · 280ms spring
        </div>
      </div>
    </div>
  );
}
