export default function Dec06AudioVideo() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0E0508", color: "#F4DAD5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)", backgroundSize: "8vw 8vw", zIndex: 0 }} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3.5vh 5vw", borderBottom: "1px solid rgba(212,175,55,0.15)", zIndex: 2 }}>
        <span style={{ fontSize: "0.85vw", fontWeight: 700, letterSpacing: "0.06em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
          <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.35)", letterSpacing: "0.1em" }}>DECISIONES</span>
          <span style={{ fontSize: "1.4vw", fontWeight: 700, color: "#D4AF37" }}>04 — 05</span>
        </div>
      </div>

      <div style={{ position: "absolute", top: "13vh", left: "5vw", right: "5vw", bottom: "10vh", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3vw", zIndex: 2 }}>

        {/* Audio */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1vh" }}>
            <span style={{ fontSize: "1.4vw" }}>🎵</span>
            <h2 style={{ fontSize: "2.2vw", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Formato de Audio</h2>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6vw", background: "linear-gradient(90deg, rgba(212,175,55,0.15), rgba(233,196,106,0.08))", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "2vw", padding: "0.6vh 1.2vw", marginBottom: "2.5vh" }}>
            <span style={{ fontSize: "0.85vw", fontWeight: 700, color: "#D4AF37" }}>DECISIÓN TOMADA</span>
            <span style={{ fontSize: "0.85vw", color: "#E9C46A" }}>AAC (.m4a)</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.9vh", marginBottom: "2vh" }}>
            {[
              { cat: "Cuencos / ancestrales / ambient", bitrate: "AAC 256 kbps VBR" },
              { cat: "Meditaciones guiadas (voz)", bitrate: "AAC 128–192 kbps" },
              { cat: "Loops base Naturaleza (bundle)", bitrate: "AAC 128–160 kbps" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)", borderRadius: "0.5vw", padding: "1.2vh 1.4vw" }}>
                <span style={{ fontSize: "0.88vw", color: "rgba(242,231,228,0.7)" }}>{item.cat}</span>
                <span style={{ fontSize: "0.88vw", fontWeight: 600, color: "#D4AF37", whiteSpace: "nowrap", marginLeft: "1vw" }}>{item.bitrate}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw" }}>
            <div style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.4)", marginBottom: "0.8vh", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pendiente</div>
            <div style={{ fontSize: "0.88vw", color: "rgba(242,231,228,0.55)", lineHeight: 1.5 }}>Convertir masters WAV con:<br /><code style={{ color: "#D4AF37", fontSize: "0.82vw" }}>ffmpeg -c:a aac -b:a 256k</code></div>
          </div>
        </div>

        {/* Video */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1vh" }}>
            <span style={{ fontSize: "1.4vw" }}>🎬</span>
            <h2 style={{ fontSize: "2.2vw", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Infraestructura Video</h2>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6vw", background: "rgba(255,200,50,0.08)", border: "1px solid rgba(255,200,50,0.2)", borderRadius: "2vw", padding: "0.6vh 1.2vw", marginBottom: "2.5vh" }}>
            <span style={{ fontSize: "0.85vw", fontWeight: 700, color: "rgba(255,200,80,0.8)" }}>DECISIÓN PENDIENTE</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.9vh", marginBottom: "2vh" }}>
            {[
              { label: "Estado actual", text: "Object Storage propio · range requests · gating solo UI" },
              { label: "Opción Bunny.net Stream", text: "~10–20× más barato · CDN · token auth (gating real)" },
              { label: "Escala", text: "50 videos de 20–50 min · pasos en COSTOS-Y-VIDEOS-BUNNY.md" },
            ].map((item, i) => (
              <div key={i} style={{ background: i === 1 ? "rgba(212,175,55,0.05)" : "rgba(255,255,255,0.025)", border: `1px solid ${i === 1 ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.07)"}`, borderRadius: "0.5vw", padding: "1.2vh 1.4vw" }}>
                <div style={{ fontSize: "0.78vw", fontWeight: 600, color: i === 1 ? "#D4AF37" : "rgba(242,231,228,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.4vh" }}>{item.label}</div>
                <div style={{ fontSize: "0.88vw", color: i === 1 ? "rgba(242,231,228,0.8)" : "rgba(242,231,228,0.45)", lineHeight: 1.4 }}>{item.text}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(233,196,106,0.05))", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw" }}>
            <div style={{ fontSize: "0.8vw", fontWeight: 600, color: "#D4AF37", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.6vh" }}>Recomendación</div>
            <div style={{ fontSize: "0.88vw", color: "rgba(242,231,228,0.7)", lineHeight: 1.5 }}>Migrar a Bunny.net antes de crecer el catálogo de videos.</div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2vh 5vw", borderTop: "1px solid rgba(212,175,55,0.08)", display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>Casa del Cuenco · Uso interno</span>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>5 / 6</span>
      </div>
    </div>
  );
}
