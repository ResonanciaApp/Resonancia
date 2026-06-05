export function V2A_CartasApaisadas() {
  const bg = "#0B0F14";
  const gold = "#BE9650";
  const fg = "#EDE1D3";
  const muted = "#7A8FA8";
  const card = "#151A23";

  const chips = ["Todos", "Descanso", "Meditación", "Enfoque"];
  const active = "Todos";

  const mixes = [
    { name: "Lluvia en el bosque", author: "Sofía R.", sounds: 6, likes: 48, cat: "Descanso", g: ["#1a3828", "#0d1a10"] },
    { name: "Cuencos al amanecer", author: "Ana P.", sounds: 7, likes: 31, cat: "Meditación", g: ["#251c3d", "#110d22"] },
    { name: "Río de montaña", author: "Lucas M.", sounds: 4, likes: 22, cat: "Enfoque", g: ["#1a2c3d", "#0d1520"] },
    { name: "Viento entre pinos", author: "Clara T.", sounds: 5, likes: 17, cat: "Descanso", g: ["#20301a", "#0d180a"] },
  ];

  const bars = [8, 18, 30, 22, 14, 24, 16, 26, 10, 20];

  return (
    <div style={{ background: bg, minHeight: "100vh", fontFamily: "system-ui, sans-serif", paddingTop: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px 12px" }}>
        <span style={{ color: fg, fontSize: 19, fontWeight: 700 }}>Mezclas de la comunidad</span>
        <span style={{ color: gold, fontSize: 12, fontWeight: 500 }}>Ver todos</span>
      </div>

      {/* Chips */}
      <div style={{ display: "flex", gap: 7, padding: "0 20px 16px", overflowX: "auto" }}>
        {chips.map(c => (
          <div key={c} style={{
            flexShrink: 0, padding: "4px 13px", borderRadius: 20, fontSize: 11,
            fontWeight: c === active ? 600 : 400,
            background: c === active ? "rgba(190,150,80,0.16)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${c === active ? "rgba(190,150,80,0.45)" : "rgba(255,255,255,0.08)"}`,
            color: c === active ? gold : muted,
          }}>{c}</div>
        ))}
      </div>

      {/* Landscape cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 20px" }}>
        {mixes.map((m, i) => (
          <div key={i} style={{
            borderRadius: 16, overflow: "hidden", position: "relative",
            background: `linear-gradient(120deg, ${m.g[0]} 0%, ${m.g[1]} 100%)`,
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", height: 80,
          }}>
            {/* Left: number */}
            <div style={{ width: 44, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "rgba(190,150,80,0.5)", fontSize: 13, fontWeight: 700 }}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            {/* Center: waveform + info */}
            <div style={{ flex: 1, paddingRight: 12 }}>
              <div style={{ color: fg, fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{m.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Mini waveform */}
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {bars.map((h, j) => (
                    <div key={j} style={{ width: 2, height: h * 0.7, borderRadius: 1, background: `rgba(190,150,80,${0.3 + j * 0.03})` }} />
                  ))}
                </div>
                <span style={{ color: muted, fontSize: 10 }}>{m.author} · {m.sounds} son.</span>
              </div>
            </div>

            {/* Right: play + likes */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, paddingRight: 14, flexShrink: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 17, background: gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "10px solid #0B0F14", marginLeft: 2 }} />
              </div>
              <span style={{ color: muted, fontSize: 9 }}>♥ {m.likes}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ margin: "14px 20px 0", padding: "10px 16px", borderRadius: 12, background: "rgba(190,150,80,0.05)", border: "1px solid rgba(190,150,80,0.1)", display: "flex", justifyContent: "space-around" }}>
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
