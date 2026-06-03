export default function SlideA1SonidosAncestales() {
  const accent = "#E8C87A";
  const bg = "linear-gradient(135deg, #3E2208 0%, #060A0F 60%, #2A1A08 100%)";

  const BowlIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="14" rx="9" ry="4" stroke={accent} strokeWidth="1.6" fill="none"/>
      <path d="M3 14 Q3 21 12 21 Q21 21 21 14" stroke={accent} strokeWidth="1.6" fill="none"/>
      <path d="M7 14 Q7 10 12 9 Q17 10 17 14" stroke={accent} strokeWidth="1.2" fill={`${accent}22`}/>
      <path d="M9 9 Q12 4 15 9" stroke={accent} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <line x1="12" y1="4" x2="12" y2="2" stroke={accent} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );

  const pills = [
    { label: "Cuencos Tibetanos", detail: "Vibraciones milenarias que limpian el campo energético" },
    { label: "Gongs Planetarios", detail: "Frecuencias alineadas a los ritmos del cosmos" },
    { label: "432 Hz & Binaural", detail: "Sincronización de hemisferios para estados de calma profunda" },
    { label: "Mantras Sagrados", detail: "Cantos que elevan la conciencia y disuelven bloqueos" },
  ];

  return (
    <div
      className="w-screen h-screen overflow-hidden relative flex flex-col font-display"
      style={{ background: bg, color: "#EDE1D3", padding: "7vh 7vw", boxSizing: "border-box" }}
    >
      {/* Ambient glow */}
      <div style={{ position: "absolute", top: "-10vh", left: "-8vw", width: "40vw", height: "40vh", borderRadius: "50%", background: `radial-gradient(ellipse, ${accent}12 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3.5vh" }}>
        <div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, letterSpacing: "0.1em", color: accent, marginBottom: "0.8vh" }}>RESONANCIA</div>
          <div style={{ width: "3.5vw", height: "0.35vh", backgroundColor: accent, opacity: 0.6 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <BowlIcon />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9vw", letterSpacing: "0.15em", color: accent, opacity: 0.7, marginBottom: "0.4vh" }}>CATEGORÍA</div>
            <h2 style={{ fontSize: "3vw", fontWeight: 700, margin: 0, color: "#EDE1D3", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Sonidos Ancestrales
            </h2>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div style={{ fontSize: "1.6vw", color: `${accent}CC`, fontWeight: 300, marginBottom: "4vh", maxWidth: "65%" }}>
        Tecnología sonora milenaria para sanar desde adentro.
      </div>

      {/* 4 feature cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.8vw", flex: 1 }}>
        {pills.map((p, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              border: `1px solid ${accent}25`,
              borderRadius: "0.8vw",
              padding: "3vh 2.4vw",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ width: "2.2vw", height: "0.35vh", backgroundColor: accent, opacity: 0.5, marginBottom: "2vh" }} />
            <div>
              <div style={{ fontSize: "1.65vw", fontWeight: 700, color: "#EDE1D3", marginBottom: "1.2vh" }}>{p.label}</div>
              <div style={{ fontSize: "1.25vw", color: "#9a8070", lineHeight: 1.5 }}>{p.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "3vh" }}>
        <div style={{ fontSize: "1.15vw", color: `${accent}99`, fontStyle: "italic" }}>
          "El sonido es el puente entre lo visible y lo invisible."
        </div>
        <div style={{ fontSize: "0.95vw", color: "#7A8FA8", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026 · 05</div>
      </div>
    </div>
  );
}
