export function V1HeroLista() {
  const bg = "#0B0F14";
  const card = "#151A23";
  const gold = "#BE9650";
  const accent = "#D6A85B";
  const fg = "#EDE1D3";
  const muted = "#7A8FA8";
  const border = "rgba(190,150,80,0.15)";

  const hero = {
    id: 1, name: "Lluvia en el bosque", author: "Sofía R.", likes: 48, sounds: 6,
    category: "DESCANSO",
    colors: ["#1a2e1a", "#0d1a0d"],
  };

  const list = [
    { id: 2, name: "Río de montaña", author: "Lucas M.", sounds: 4, likes: 31 },
    { id: 3, name: "Cuencos al amanecer", author: "Ana P.", sounds: 7, likes: 22 },
    { id: 4, name: "Noche en el desierto", author: "Mateo L.", sounds: 5, likes: 17 },
  ];

  return (
    <div style={{ background: bg, minHeight: "100vh", fontFamily: "system-ui, sans-serif", padding: "20px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px 14px" }}>
        <span style={{ color: fg, fontSize: 20, fontWeight: 700, letterSpacing: 0.3 }}>Mezclas de la comunidad</span>
        <span style={{ color: gold, fontSize: 13, fontWeight: 500 }}>Ver todos</span>
      </div>

      {/* Hero card */}
      <div style={{ margin: "0 20px 16px", borderRadius: 18, overflow: "hidden", position: "relative", height: 190 }}>
        {/* gradient bg simulating image */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(145deg, #1e3a2a 0%, #0e1f15 60%, #0B0F14 100%)`,
        }} />
        {/* subtle sound wave pattern */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
          {[30, 55, 80, 105, 130, 155].map((y, i) => (
            <div key={i} style={{
              position: "absolute", left: 0, right: 0, top: y,
              height: 1, background: "rgba(190,150,80,0.6)",
              transform: `scaleX(${0.4 + i * 0.1})`, transformOrigin: "left"
            }} />
          ))}
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,15,20,0.92) 0%, rgba(11,15,20,0.3) 55%, transparent 100%)" }} />

        {/* category badge */}
        <div style={{ position: "absolute", top: 14, left: 14 }}>
          <span style={{ background: "rgba(190,150,80,0.2)", border: `1px solid ${gold}44`, color: gold, fontSize: 9, fontWeight: 700, letterSpacing: 1.2, borderRadius: 6, padding: "3px 8px" }}>
            {hero.category}
          </span>
        </div>

        {/* sounds badge */}
        <div style={{ position: "absolute", top: 14, right: 14 }}>
          <span style={{ background: "rgba(11,15,20,0.65)", border: "1px solid rgba(237,225,211,0.15)", color: muted, fontSize: 10, borderRadius: 6, padding: "3px 7px" }}>
            🎵 {hero.sounds} sonidos
          </span>
        </div>

        {/* content bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 16px" }}>
          <div style={{ color: fg, fontSize: 17, fontWeight: 700, marginBottom: 6, lineHeight: 1.25 }}>{hero.name}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: "rgba(190,150,80,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, color: gold, fontWeight: 700 }}>SR</span>
              </div>
              <span style={{ color: muted, fontSize: 12 }}>{hero.author}</span>
              <span style={{ color: muted, fontSize: 12 }}>· ♥ {hero.likes}</span>
            </div>
            {/* Play button */}
            <div style={{ width: 38, height: 38, borderRadius: 19, background: gold, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <div style={{ width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: `12px solid #0B0F14`, marginLeft: 2 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Compact list */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {list.map((mix, i) => {
          const colors = [
            ["#1f2a3a", "#0f1520"],
            ["#2a1f1f", "#1a0f0f"],
            ["#1f2a25", "#0f1a14"],
          ];
          return (
            <div key={mix.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Thumbnail */}
              <div style={{
                width: 56, height: 56, borderRadius: 12, flexShrink: 0, overflow: "hidden",
                background: `linear-gradient(135deg, ${colors[i][0]}, ${colors[i][1]})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 20, opacity: 0.6 }}>🎵</span>
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: fg, fontSize: 14, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mix.name}</div>
                <div style={{ color: muted, fontSize: 11, fontWeight: 500, marginBottom: 3 }}>Pista con {mix.sounds} sonidos</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 13, height: 13, borderRadius: 7, background: "rgba(122,143,168,0.3)" }} />
                  <span style={{ color: muted, fontSize: 11 }}>{mix.author}</span>
                  <span style={{ color: muted, fontSize: 11 }}>· ♥ {mix.likes}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ver más link */}
      <div style={{ textAlign: "center", marginTop: 20, padding: "0 20px" }}>
        <div style={{ border: `1px solid ${border}`, borderRadius: 12, padding: "10px 20px", color: muted, fontSize: 13 }}>
          Ver los 24 ambientes de la comunidad →
        </div>
      </div>
    </div>
  );
}
