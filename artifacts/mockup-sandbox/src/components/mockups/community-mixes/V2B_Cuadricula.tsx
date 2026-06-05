export function V2B_Cuadricula() {
  const bg = "#0B0F14";
  const gold = "#BE9650";
  const fg = "#EDE1D3";
  const muted = "#7A8FA8";

  const chips = ["Todos", "Descanso", "Meditación", "Enfoque"];
  const active = "Todos";

  const mixes = [
    { name: "Lluvia en el bosque", author: "Sofía R.", sounds: 6, likes: 48, g: ["#163020", "#0a150b"] },
    { name: "Cuencos al amanecer", author: "Ana P.", sounds: 7, likes: 31, g: ["#1e1535", "#0e0a1c"] },
    { name: "Río de montaña", author: "Lucas M.", sounds: 4, likes: 22, g: ["#152535", "#0a1218"] },
    { name: "Viento entre pinos", author: "Clara T.", sounds: 5, likes: 17, g: ["#1c2a10", "#0e1508"] },
  ];

  const waveHeights = [[10, 20, 32, 24, 14, 22, 16], [16, 28, 18, 34, 12, 26, 20], [8, 24, 36, 18, 28, 14, 22], [20, 12, 28, 20, 36, 16, 24]];

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

      {/* 2×2 Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 20px" }}>
        {mixes.map((m, i) => (
          <div key={i} style={{
            borderRadius: 16, overflow: "hidden", position: "relative",
            background: `linear-gradient(145deg, ${m.g[0]} 0%, ${m.g[1]} 100%)`,
            border: "1px solid rgba(255,255,255,0.07)",
            aspectRatio: "1",
          }}>
            {/* Waveform center */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.35 }}>
              {waveHeights[i].map((h, j) => (
                <div key={j} style={{ width: 3, height: h, borderRadius: 2, background: gold, margin: "0 2px" }} />
              ))}
            </div>

            {/* Gradient overlay bottom */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,15,20,0.9) 0%, transparent 55%)" }} />

            {/* Sounds badge */}
            <div style={{ position: "absolute", top: 10, left: 10 }}>
              <span style={{ background: "rgba(11,15,20,0.65)", color: muted, fontSize: 9, borderRadius: 6, padding: "2px 7px", border: "1px solid rgba(255,255,255,0.08)" }}>
                {m.sounds} son.
              </span>
            </div>

            {/* Play button top-right */}
            <div style={{ position: "absolute", top: 8, right: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 15, background: gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #0B0F14", marginLeft: 1 }} />
              </div>
            </div>

            {/* Bottom info */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px" }}>
              <div style={{ color: fg, fontSize: 11, fontWeight: 700, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: muted, fontSize: 10 }}>{m.author}</span>
                <span style={{ color: "rgba(190,150,80,0.7)", fontSize: 10 }}>♥ {m.likes}</span>
              </div>
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
