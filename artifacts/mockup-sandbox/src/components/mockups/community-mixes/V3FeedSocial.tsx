export function V3FeedSocial() {
  const bg = "#0B0F14";
  const card = "#111820";
  const gold = "#BE9650";
  const fg = "#EDE1D3";
  const muted = "#7A8FA8";
  const border = "rgba(100,140,210,0.12)";

  const mixes = [
    {
      id: 1, name: "Lluvia en el bosque", author: "Sofía Ramírez", initials: "SR", ago: "hace 2h",
      sounds: 6, likes: 48, likedByMe: true, category: "Descanso",
      g: ["#1e3a2a", "#0d1a0d"], plays: 312,
    },
    {
      id: 2, name: "Cuencos al amanecer", author: "Ana Paz", initials: "AP", ago: "hace 5h",
      sounds: 7, likes: 31, likedByMe: false, category: "Meditación",
      g: ["#2a2040", "#110d20"], plays: 198,
    },
    {
      id: 3, name: "Río de montaña", author: "Lucas M.", initials: "LM", ago: "ayer",
      sounds: 4, likes: 22, likedByMe: false, category: "Enfoque",
      g: ["#203040", "#0d1a22"], plays: 143,
    },
  ];

  return (
    <div style={{ background: bg, minHeight: "100vh", fontFamily: "system-ui, sans-serif", paddingTop: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px 16px" }}>
        <span style={{ color: fg, fontSize: 20, fontWeight: 700, letterSpacing: 0.3 }}>Mezclas de la comunidad</span>
        <span style={{ color: gold, fontSize: 13, fontWeight: 500 }}>Ver todos</span>
      </div>

      {/* Feed items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {mixes.map((mix) => (
          <div key={mix.id} style={{
            margin: "0 20px 12px",
            background: card,
            borderRadius: 18,
            border: `1px solid ${border}`,
            overflow: "hidden",
          }}>
            {/* Author row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 10px" }}>
              <div style={{
                width: 34, height: 34, borderRadius: 17, flexShrink: 0,
                background: `linear-gradient(135deg, ${mix.g[0]}, ${mix.g[1]})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1.5px solid rgba(190,150,80,0.3)",
              }}>
                <span style={{ color: gold, fontSize: 11, fontWeight: 700 }}>{mix.initials}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: fg, fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{mix.author}</div>
                <div style={{ color: muted, fontSize: 11 }}>compartió una mezcla · {mix.ago}</div>
              </div>
              {/* Category pill */}
              <span style={{
                background: "rgba(190,150,80,0.1)", border: "1px solid rgba(190,150,80,0.25)",
                color: gold, fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
                borderRadius: 6, padding: "3px 7px",
              }}>{mix.category.toUpperCase()}</span>
            </div>

            {/* Cover image strip */}
            <div style={{
              height: 96, margin: "0 14px",
              borderRadius: 12, overflow: "hidden",
              background: `linear-gradient(135deg, ${mix.g[0]} 0%, ${mix.g[1]} 100%)`,
              position: "relative",
              display: "flex", alignItems: "center",
            }}>
              {/* Wave visualization */}
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "0 20px" }}>
                {[18, 32, 44, 55, 44, 32, 52, 44, 30, 44, 52, 38, 26, 40, 55, 40].map((h, i) => (
                  <div key={i} style={{ width: 3, height: h, borderRadius: 2, background: `rgba(190,150,80,${0.25 + i % 3 * 0.15})` }} />
                ))}
              </div>
              {/* Mix name overlay */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(11,15,20,0.85) 0%, transparent 100%)", padding: "8px 12px" }}>
                <div style={{ color: fg, fontSize: 14, fontWeight: 700 }}>{mix.name}</div>
              </div>
            </div>

            {/* Tags + actions */}
            <div style={{ padding: "10px 14px 12px" }}>
              {/* Tags row */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <span style={{ background: "rgba(122,143,168,0.12)", color: muted, fontSize: 10, borderRadius: 6, padding: "3px 8px" }}>
                  🎵 {mix.sounds} sonidos
                </span>
                <span style={{ background: "rgba(122,143,168,0.12)", color: muted, fontSize: 10, borderRadius: 6, padding: "3px 8px" }}>
                  ▶ {mix.plays} reproducciones
                </span>
              </div>

              {/* Action row */}
              <div style={{ display: "flex", gap: 10 }}>
                {/* Like */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 14px", borderRadius: 10,
                  background: mix.likedByMe ? "rgba(190,150,80,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${mix.likedByMe ? "rgba(190,150,80,0.3)" : "rgba(255,255,255,0.08)"}`,
                  cursor: "pointer",
                }}>
                  <span style={{ fontSize: 13 }}>{mix.likedByMe ? "♥" : "♡"}</span>
                  <span style={{ color: mix.likedByMe ? gold : muted, fontSize: 12, fontWeight: mix.likedByMe ? 600 : 400 }}>{mix.likes}</span>
                </div>

                {/* Play button (expands) */}
                <div style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: gold, borderRadius: 10,
                  padding: "7px 14px", cursor: "pointer",
                }}>
                  <div style={{ width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "10px solid #0B0F14" }} />
                  <span style={{ color: "#0B0F14", fontSize: 12, fontWeight: 700 }}>Escuchar</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
