export function V2CarruselVisual() {
  const bg = "#0B0F14";
  const gold = "#BE9650";
  const fg = "#EDE1D3";
  const muted = "#7A8FA8";

  const chips = ["Todos", "Descanso", "Meditación", "Enfoque", "ASMR"];
  const activeChip = "Todos";

  const cards = [
    { id: 1, name: "Lluvia en el bosque", author: "Sofía R.", sounds: 6, likes: 48, g: ["#1e3a2a", "#0d1a0d"] },
    { id: 2, name: "Cuencos al amanecer", author: "Ana P.", sounds: 7, likes: 31, g: ["#2a2040", "#110d20"] },
    { id: 3, name: "Río de montaña", author: "Lucas M.", sounds: 4, likes: 22, g: ["#203040", "#0d1a22"] },
  ];

  return (
    <div style={{ background: bg, minHeight: "100vh", fontFamily: "system-ui, sans-serif", paddingTop: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px 12px" }}>
        <span style={{ color: fg, fontSize: 20, fontWeight: 700, letterSpacing: 0.3 }}>Mezclas de la comunidad</span>
        <span style={{ color: gold, fontSize: 13, fontWeight: 500 }}>Ver todos</span>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, padding: "0 20px 16px", overflowX: "auto" }}>
        {chips.map(c => (
          <div key={c} style={{
            flexShrink: 0,
            padding: "5px 14px",
            borderRadius: 20,
            fontSize: 12, fontWeight: c === activeChip ? 600 : 400,
            background: c === activeChip ? "rgba(190,150,80,0.18)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${c === activeChip ? "rgba(190,150,80,0.5)" : "rgba(255,255,255,0.09)"}`,
            color: c === activeChip ? gold : muted,
            cursor: "pointer",
          }}>{c}</div>
        ))}
      </div>

      {/* Horizontal cards scroll */}
      <div style={{ display: "flex", gap: 12, padding: "0 20px 20px", overflowX: "auto" }}>
        {cards.map((mix, i) => (
          <div key={mix.id} style={{
            flexShrink: 0,
            width: 180, borderRadius: 18, overflow: "hidden",
            position: "relative",
            cursor: "pointer",
          }}>
            {/* Cover image */}
            <div style={{
              height: 200,
              background: `linear-gradient(150deg, ${mix.g[0]} 0%, ${mix.g[1]} 100%)`,
              position: "relative",
            }}>
              {/* Sound wave decoration */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.25 }}>
                {[12, 22, 34, 22, 12, 18, 28].map((h, j) => (
                  <div key={j} style={{ width: 4, height: h, borderRadius: 2, background: gold, margin: "0 2px" }} />
                ))}
              </div>

              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,15,20,0.95) 0%, rgba(11,15,20,0.1) 55%, transparent 100%)" }} />

              {/* Sounds badge top-right */}
              <div style={{ position: "absolute", top: 10, right: 10 }}>
                <span style={{ background: "rgba(11,15,20,0.7)", backdropFilter: "blur(6px)", color: muted, fontSize: 10, borderRadius: 8, padding: "3px 7px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {mix.sounds} son.
                </span>
              </div>

              {/* Play button centered */}
              <div style={{ position: "absolute", bottom: 48, left: "50%", transform: "translateX(-50%)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 21, background: gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: `13px solid #0B0F14`, marginLeft: 2 }} />
                </div>
              </div>

              {/* Bottom info */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 12px" }}>
                <div style={{ color: fg, fontSize: 12, fontWeight: 700, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mix.name}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: muted, fontSize: 10 }}>{mix.author}</span>
                  <span style={{ color: muted, fontSize: 10 }}>♥ {mix.likes}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Peek card */}
        <div style={{
          flexShrink: 0, width: 60, borderRadius: 18, overflow: "hidden",
          background: "rgba(21,26,35,0.6)", border: "1px solid rgba(190,150,80,0.1)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          height: 200, gap: 6,
        }}>
          <span style={{ color: muted, fontSize: 18 }}>›</span>
          <span style={{ color: muted, fontSize: 9, textAlign: "center", lineHeight: 1.3 }}>21 más</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ margin: "0 20px", padding: "12px 16px", borderRadius: 14, background: "rgba(190,150,80,0.06)", border: "1px solid rgba(190,150,80,0.12)", display: "flex", justifyContent: "space-around" }}>
        {[
          { label: "Mezclas", value: "24" },
          { label: "Creadores", value: "18" },
          { label: "Esta semana", value: "+6" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ color: gold, fontSize: 16, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: muted, fontSize: 10 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
