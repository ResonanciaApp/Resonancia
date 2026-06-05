export function V2C_ListaPreview() {
  const bg = "#0B0F14";
  const gold = "#BE9650";
  const fg = "#EDE1D3";
  const muted = "#7A8FA8";
  const card = "#151A23";

  const chips = ["Todos", "Descanso", "Meditación", "Enfoque"];
  const active = "Todos";

  const mixes = [
    { name: "Lluvia en el bosque", author: "Sofía R.", sounds: 6, likes: 48, dur: "∞", cat: "Descanso", catColor: "#3a8a6e", bars: [10, 20, 34, 24, 14, 28, 18, 32, 12, 22, 16, 26] },
    { name: "Cuencos al amanecer", author: "Ana P.", sounds: 7, likes: 31, dur: "∞", cat: "Meditación", catColor: "#7060c8", bars: [16, 28, 18, 36, 12, 26, 20, 30, 10, 24, 14, 32] },
    { name: "Río de montaña", author: "Lucas M.", sounds: 4, likes: 22, dur: "∞", cat: "Enfoque", catColor: "#c07840", bars: [8, 24, 38, 16, 30, 14, 22, 36, 10, 28, 18, 20] },
    { name: "Viento entre pinos", author: "Clara T.", sounds: 5, likes: 17, dur: "∞", cat: "Descanso", catColor: "#3a8a6e", bars: [20, 12, 28, 20, 36, 14, 26, 18, 32, 10, 24, 16] },
  ];

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

      {/* List with waveform preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 20px" }}>
        {mixes.map((m, i) => (
          <div key={i} style={{
            background: card, borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {/* Top row: info + play */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Cat badge */}
              <div style={{ width: 6, height: 6, borderRadius: 3, background: m.catColor, flexShrink: 0, marginTop: 1 }} />
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: fg, fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                <div style={{ color: muted, fontSize: 10, marginTop: 1 }}>{m.author} · {m.sounds} sonidos</div>
              </div>
              {/* Play */}
              <div style={{ width: 32, height: 32, borderRadius: 16, background: gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "9px solid #0B0F14", marginLeft: 2 }} />
              </div>
            </div>

            {/* Waveform visualization */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 28, paddingLeft: 16 }}>
              {m.bars.map((h, j) => (
                <div key={j} style={{
                  flex: 1, height: h * 0.72, borderRadius: 2,
                  background: j < 5
                    ? `rgba(190,150,80,${0.6 + j * 0.08})`
                    : `rgba(255,255,255,${0.1 + (j - 5) * 0.015})`,
                }} />
              ))}
            </div>

            {/* Bottom: category + likes */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: m.catColor, fontSize: 10, fontWeight: 600, opacity: 0.85 }}>{m.cat}</span>
              <span style={{ color: muted, fontSize: 10 }}>♥ {m.likes}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ margin: "12px 20px 0", padding: "10px 16px", borderRadius: 12, background: "rgba(190,150,80,0.05)", border: "1px solid rgba(190,150,80,0.1)", display: "flex", justifyContent: "space-around" }}>
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
