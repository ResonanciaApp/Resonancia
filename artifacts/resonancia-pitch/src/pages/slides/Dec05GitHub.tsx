export default function Dec05GitHub() {
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
          <span style={{ fontSize: "1.4vw", fontWeight: 700, color: "#D4AF37" }}>03</span>
        </div>
      </div>

      <div style={{ position: "absolute", top: "13vh", left: "5vw", right: "5vw", bottom: "10vh", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3vw", zIndex: 2 }}>

        {/* Left */}
        <div>
          <h2 style={{ fontSize: "3vw", fontWeight: 700, margin: "0 0 0.5vh 0", letterSpacing: "-0.02em" }}>GitHub</h2>
          <p style={{ fontSize: "1.05vw", color: "rgba(242,231,228,0.45)", margin: "0 0 3vh 0", lineHeight: 1.5 }}>El código está listo para subir — ahora es seguro y recomendado.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1vh", marginBottom: "2.5vh" }}>
            {[
              { label: ".gitignore actualizado", detail: ".env y google-play-service-account.json excluidos" },
              { label: "Sin secretos hardcodeados", detail: "Todo usa process.env + Replit Secrets" },
              { label: "Código listo", detail: "Todos los archivos en orden, sin placeholders activos" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1vw", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.13)", borderRadius: "0.6vw", padding: "1.4vh 1.5vw" }}>
                <span style={{ color: "#D4AF37", fontSize: "1vw", flexShrink: 0 }}>✅</span>
                <div>
                  <div style={{ fontSize: "0.95vw", fontWeight: 600, color: "#F4DAD5", marginBottom: "0.3vh" }}>{item.label}</div>
                  <div style={{ fontSize: "0.82vw", color: "rgba(242,231,228,0.45)" }}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(233,196,106,0.06))", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "0.8vw", padding: "2vh 2vw" }}>
            <div style={{ fontSize: "0.8vw", fontWeight: 600, color: "#D4AF37", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.8vh" }}>Recomendación</div>
            <div style={{ fontSize: "0.95vw", color: "#F4DAD5", lineHeight: 1.5 }}>Repo <strong>privado</strong> hasta el lanzamiento público. Subir ahora.</div>
          </div>
        </div>

        {/* Right */}
        <div>
          <div style={{ fontSize: "0.85vw", fontWeight: 600, color: "rgba(242,231,228,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1.5vh", marginTop: "5.5vh" }}>Beneficios inmediatos</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2vh" }}>
            {[
              { icon: "📦", title: "Backup externo", desc: "Copia fuera de Replit — protección ante cualquier incidente de plataforma" },
              { icon: "🔗", title: "EAS desde GitHub", desc: "EAS lee directo del repo y dispara builds automáticos con cada push a main" },
              { icon: "👥", title: "Colaboradores", desc: "Cuando sumes otro dev o diseñador, acceso granular por rama" },
              { icon: "🚀", title: "CI/CD futuro", desc: "Builds automáticos, tests y deploys en cada push cuando estés cerca del lanzamiento" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.7vw", padding: "1.6vh 1.8vw" }}>
                <span style={{ fontSize: "1.4vw", flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: "0.95vw", fontWeight: 600, color: "rgba(242,231,228,0.85)", marginBottom: "0.4vh" }}>{item.title}</div>
                  <div style={{ fontSize: "0.82vw", color: "rgba(242,231,228,0.4)", lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2vh 5vw", borderTop: "1px solid rgba(212,175,55,0.08)", display: "flex", justifyContent: "space-between", zIndex: 2 }}>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>Casa del Cuenco · Uso interno</span>
        <span style={{ fontSize: "0.8vw", color: "rgba(242,231,228,0.25)" }}>4 / 6</span>
      </div>
    </div>
  );
}
