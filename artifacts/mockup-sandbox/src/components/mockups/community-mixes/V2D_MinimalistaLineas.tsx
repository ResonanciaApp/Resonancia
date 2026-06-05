export function V2D_MinimalistaLineas() {
  const bg = "#0B0F14";
  const gold = "#BE9650";
  const fg = "#EDE1D3";
  const muted = "#7A8FA8";
  const dim = "#3A4A5A";

  const chips = ["Todos", "Descanso", "Meditación", "Enfoque"];
  const active = "Todos";

  const mixes = [
    { rank: 1, name: "Lluvia en el bosque", author: "Sofía R.", sounds: 6, likes: 48, trending: true },
    { rank: 2, name: "Cuencos al amanecer", author: "Ana P.", sounds: 7, likes: 31, trending: false },
    { rank: 3, name: "Río de montaña", author: "Lucas M.", sounds: 4, likes: 22, trending: true },
    { rank: 4, name: "Viento entre pinos", author: "Clara T.", sounds: 5, likes: 17, trending: false },
    { rank: 5, name: "Selva tropical", author: "Mateo B.", sounds: 8, likes: 12, trending: false },
  ];

  return (
    <div style={{ background: bg, minHeight: "100vh", fontFamily: "system-ui, sans-serif", paddingTop: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px 12px" }}>
        <span style={{ color: fg, fontSize: 19, fontWeight: 700 }}>Mezclas de la comunidad</span>
        <span style={{ color: gold, fontSize: 12, fontWeight: 500 }}>Ver todos</span>
      </div>

      {/* Chips */}
      <div style={{ display: "flex", gap: 7, padding: "0 20px 20px", overflowX: "auto" }}>
        {chips.map(c => (
          <div key={c} style={{
            flexShrink: 0, padding: "4px 13px", borderRadius: 20, fontSize: 11,
            fontWeight: c === active ? 600 : 400,
            background: c === active ? "rgba(190,150,80,0.14)" : "transparent",
            border: `1px solid ${c === active ? "rgba(190,150,80,0.4)" : dim}`,
            color: c === active ? gold : muted,
          }}>{c}</div>
        ))}
      </div>

      {/* List with thin dividers */}
      <div style={{ padding: "0 20px" }}>
        {mixes.map((m, i) => (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingVertical: 12, paddingTop: 10, paddingBottom: 10 }}>
              {/* Rank */}
              <span style={{ color: i === 0 ? gold : dim, fontSize: 13, fontWeight: 700, width: 22, textAlign: "right", flexShrink: 0 }}>
                {m.rank}
              </span>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: fg, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.name}
                  </span>
                  {m.trending && (
                    <span style={{ background: "rgba(190,150,80,0.12)", color: gold, fontSize: 8, fontWeight: 700, borderRadius: 4, padding: "1px 5px", flexShrink: 0, letterSpacing: 0.5 }}>
                      ↑
                    </span>
                  )}
                </div>
                <span style={{ color: muted, fontSize: 10 }}>{m.author} · {m.sounds} sonidos</span>
              </div>

              {/* Right: likes + play */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ color: muted, fontSize: 11 }}>♥ {m.likes}</span>
                <div style={{ width: 30, height: 30, borderRadius: 15, border: `1.5px solid ${i === 0 ? gold : dim}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `8px solid ${i === 0 ? gold : dim}`, marginLeft: 2 }} />
                </div>
              </div>
            </div>
            {i < mixes.length - 1 && (
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginLeft: 36 }} />
            )}
          </div>
        ))}
      </div>

      {/* CTA to share */}
      <div style={{ margin: "20px 20px 0", padding: "12px 16px", borderRadius: 12, border: `1px solid rgba(190,150,80,0.2)`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: "rgba(190,150,80,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: gold, fontSize: 16 }}>+</span>
        </div>
        <div>
          <div style={{ color: fg, fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Compartir tu mezcla</div>
          <div style={{ color: muted, fontSize: 10 }}>Activa el mezclador y guarda tu ambiente</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ margin: "12px 20px 0", padding: "10px 16px", borderRadius: 12, background: "rgba(190,150,80,0.04)", border: "1px solid rgba(190,150,80,0.09)", display: "flex", justifyContent: "space-around" }}>
        {[{ l: "Mezclas", v: "24" }, { l: "Creadores", v: "18" }, { l: "Esta semana", v: "+6" }].map(s => (
          <div key={s.l} style={{ textAlign: "center" }}>
            <div style={{ color: gold, fontSize: 15, fontWeight: 700 }}>{s.v}</div>
            <div style={{ color: muted, fontSize: 10 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
