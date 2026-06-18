export default function Dec07CloudSync() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0E0508", color: "#F4DAD5", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px)", backgroundSize: "8vw 8vw", zIndex: 0 }} />

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3.5vh 5vw", borderBottom: "1px solid rgba(212,175,55,0.15)", zIndex: 2 }}>
        <span style={{ fontSize: "0.85vw", fontWeight: 700, letterSpacing: "0.06em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>RESONANCIA</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
          <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.35)", letterSpacing: "0.1em" }}>DECISIÓN</span>
          <span style={{ fontSize: "1.4vw", fontWeight: 700, color: "#D4AF37" }}>06</span>
        </div>
      </div>

      <div style={{ position: "absolute", top: "13vh", left: "5vw", right: "5vw", bottom: "10vh", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3vw", zIndex: 2 }}>

        {/* Left */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "0.8vh" }}>
            <span style={{ fontSize: "1.4vw" }}>☁️</span>
            <h2 style={{ fontSize: "2.5vw", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Sync en la Nube</h2>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6vw", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "2vw", padding: "0.6vh 1.2vw", marginBottom: "2.5vh" }}>
            <span style={{ fontSize: "0.85vw", fontWeight: 700, color: "#D4AF37" }}>FASE 1 ACTIVA</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
            {[
              { icon: "✅", text: "Eventos de reproducción, favoritos y progreso sincronizan con Clerk" },
              { icon: "✅", text: "Sin cuenta → todo local (offline-first)" },
              { icon: "✅", text: "lib/cloudSync.ts + routes/activity.ts implementados" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1vw", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw" }}>
                <span style={{ fontSize: "1vw", flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: "0.92vw", color: "rgba(242,231,228,0.8)", lineHeight: 1.4 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div>
          <div style={{ fontSize: "0.85vw", fontWeight: 600, color: "rgba(242,231,228,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5vh", marginTop: "5.5vh" }}>Reglas vigentes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1vh", marginBottom: "2.5vh" }}>
            {[
              { label: "Eventos", rule: "Unión append-only — dedup por clientEventId" },
              { label: "Favoritos / Progreso", rule: "Unión en primer sync, luego local autoritativo" },
            ].map((item, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw" }}>
                <div style={{ fontSize: "0.78vw", fontWeight: 700, color: "#D4AF37", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.6vh" }}>{item.label}</div>
                <div style={{ fontSize: "0.9vw", color: "rgba(242,231,228,0.6)", lineHeight: 1.4 }}>{item.rule}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(230,57,70,0.06)", border: "1px solid rgba(230,57,70,0.2)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw", marginBottom: "1.5vh" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "0.6vh" }}>
              <span style={{ fontSize: "1vw" }}>⚠️</span>
              <span style={{ fontSize: "0.78vw", fontWeight: 700, color: "rgba(230,100,100,0.8)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Limitación conocida</span>
            </div>
            <div style={{ fontSize: "0.88vw", color: "rgba(242,231,228,0.5)", lineHeight: 1.5 }}>Sin tombstones ni LWW — un borrado en otro dispositivo puede reaparecer.</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw" }}>
            <div style={{ fontSize: "0.78vw", fontWeight: 600, color: "rgba(242,231,228,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.6vh" }}>Mejora futura</div>
            <div style={{ fontSize: "0.88vw", color: "rgba(242,231,228,0.45)", lineHeight: 1.5 }}>Timestamps por ítem (LWW) cuando la base de usuarios lo justifique.</div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2vh 5vw", borderTop: "1px solid rgba(212,175,55,0.08)", display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>Casa del Cuenco · Uso interno</span>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>6 / 6</span>
      </div>
    </div>
  );
}
