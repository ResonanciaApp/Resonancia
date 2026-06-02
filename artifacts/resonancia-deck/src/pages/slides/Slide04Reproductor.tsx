const base = import.meta.env.BASE_URL;

export default function Slide04Reproductor() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#18110C", color: "#EDE1D3" }}
    >
      {/* Left column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "46vw", height: "100vh", padding: "8vh 5.5vw", boxSizing: "border-box", zIndex: 2 }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#C69B4F", marginBottom: "1vh" }}>RESONANCIA</div>
            <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#C69B4F" }} />
          </div>
          <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
            El <span style={{ fontWeight: 700, color: "#C69B4F" }}>reproductor</span>
          </h2>
        </div>

        {/* Features */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "3.5vh" }}>
          <div style={{ fontSize: "1.6vw", color: "#7a6050" }}>
            Escucha inmersiva en cada sesión.
          </div>

          {[
            { title: "Arte circular luminoso", desc: "Anillos pulsantes que acompañan el ritmo." },
            { title: "Control de voz independiente", desc: "Ajuste separado del volumen de ambiente." },
            { title: "Timer personalizable", desc: "De 5 a 60 minutos, con fade de cierre." },
            { title: "Fondo dinámico", desc: "Refleja la imagen de la sesión activa." },
          ].map((f) => (
            <div key={f.title}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.2vw", marginBottom: "0.4vh" }}>
                <div style={{ width: "3vw", height: "0.35vh", backgroundColor: "#C69B4F", flexShrink: 0 }} />
                <div style={{ fontSize: "1.85vw", fontWeight: 600, color: "#EDE1D3" }}>{f.title}</div>
              </div>
              <div style={{ fontSize: "1.4vw", color: "#7a6050", paddingLeft: "4.2vw" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
          <div style={{ fontSize: "1vw", fontWeight: 500, color: "#3d2a18" }}>04</div>
        </div>
      </div>

      {/* Right column — large tilted iPhone with player UI */}
      <div style={{ width: "54vw", height: "100vh", position: "relative" }}>

        {/* Glow behind phone */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "34vw", height: "34vw",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(198,155,79,0.10) 0%, rgba(24,17,12,0) 70%)",
          zIndex: 0
        }} />

        {/* iPhone shell — large, tilted */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-46%, -50%) rotate(-9deg)",
          width: "21vw",
          height: "45.5vw",
          backgroundColor: "#1C1C1E",
          borderRadius: "3.3vw",
          padding: "0.58vw",
          boxShadow: "0 3vw 10vw rgba(0,0,0,0.9), 0 0 0 0.12vw rgba(255,255,255,0.06), 0 0 4vw rgba(198,155,79,0.08)",
          zIndex: 1,
          boxSizing: "border-box",
        }}>
          {/* Dynamic Island */}
          <div style={{
            position: "absolute", top: "1.5vw", left: "50%",
            transform: "translateX(-50%)",
            width: "4.5vw", height: "0.9vw",
            backgroundColor: "#000", borderRadius: "0.6vw", zIndex: 10
          }} />

          {/* Screen */}
          <div style={{
            width: "100%", height: "100%",
            borderRadius: "2.8vw",
            overflow: "hidden",
            backgroundColor: "#18110C",
            position: "relative",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            {/* Blurred BG */}
            <img
              src={`${base}session-1.jpg`}
              crossOrigin="anonymous"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: "cover", opacity: 0.12,
                filter: "blur(18px)",
              }}
            />

            {/* Gradient overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, #18110C 0%, transparent 30%, transparent 65%, #18110C 100%)",
              zIndex: 1
            }} />

            {/* Content */}
            <div style={{
              position: "relative", zIndex: 2,
              display: "flex", flexDirection: "column", alignItems: "center",
              width: "100%", height: "100%",
              padding: "3.2vw 1.4vw 1.4vw",
              boxSizing: "border-box",
            }}>

              {/* Circular art */}
              <div style={{ position: "relative", marginBottom: "1.3vw", marginTop: "0.6vw" }}>
                {/* Outer glow rings */}
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "16vw", height: "16vw",
                  borderRadius: "50%",
                  border: "1px solid rgba(182,149,95,0.09)"
                }} />
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "14.5vw", height: "14.5vw",
                  borderRadius: "50%",
                  border: "1px solid rgba(182,149,95,0.18)"
                }} />
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%,-50%)",
                  width: "13.2vw", height: "13.2vw",
                  borderRadius: "50%",
                  border: "1.2px solid rgba(182,149,95,0.32)"
                }} />
                {/* Art image */}
                <div style={{
                  width: "11.8vw", height: "11.8vw",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1.5px solid rgba(198,155,79,0.45)",
                  boxShadow: "0 0 2vw rgba(198,155,79,0.15)",
                }}>
                  <img
                    src={`${base}session-1.jpg`}
                    crossOrigin="anonymous"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.88 }}
                  />
                </div>
              </div>

              {/* Session info */}
              <div style={{ textAlign: "center", marginBottom: "1vw", width: "100%" }}>
                <div style={{ fontSize: "0.72vw", color: "#C69B4F", letterSpacing: "0.12em", fontWeight: 600, marginBottom: "0.3vw" }}>
                  SONIDOS ANCESTRALES
                </div>
                <div style={{ fontSize: "1.05vw", fontWeight: 700, color: "#EDE1D3", lineHeight: 1.2 }}>
                  Cuencos Tibetanos
                </div>
                <div style={{ fontSize: "0.68vw", color: "#7a6050", marginTop: "0.2vw" }}>
                  Mix profundo · 35 min
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: "85%", marginBottom: "0.6vw" }}>
                <div style={{
                  height: "0.22vw",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: "0.11vw",
                  position: "relative",
                }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: "38%", height: "100%", backgroundColor: "#C69B4F", borderRadius: "0.11vw" }} />
                  <div style={{
                    position: "absolute", top: "50%",
                    left: "38%",
                    transform: "translate(-50%,-50%)",
                    width: "0.55vw", height: "0.55vw",
                    borderRadius: "50%", backgroundColor: "#C69B4F"
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35vw" }}>
                  <span style={{ fontSize: "0.58vw", color: "#7a6050" }}>8:23</span>
                  <span style={{ fontSize: "0.58vw", color: "#7a6050" }}>-16:37</span>
                </div>
              </div>

              {/* Controls */}
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "center",
                gap: "2.2vw",
                marginBottom: "1.2vw",
              }}>
                {/* Skip back */}
                <div style={{ textAlign: "center" }}>
                  <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#EDE1D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", width: "1.4vw", height: "1.4vw" }}>
                    <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" />
                  </svg>
                  <div style={{ fontSize: "0.5vw", color: "#7a6050", marginTop: "0.15vw" }}>10s</div>
                </div>

                {/* Play button */}
                <div style={{
                  width: "3.6vw", height: "3.6vw",
                  borderRadius: "50%",
                  backgroundColor: "#C69B4F",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 1.5vw rgba(198,155,79,0.35)",
                  position: "relative"
                }}>
                  <div style={{
                    width: 0, height: 0,
                    borderTop: "0.72vw solid transparent",
                    borderBottom: "0.72vw solid transparent",
                    borderLeft: "1.2vw solid #18110C",
                    marginLeft: "0.2vw"
                  }} />
                  {/* Outer ring */}
                  <div style={{
                    position: "absolute", inset: "-0.45vw",
                    borderRadius: "50%",
                    border: "1px solid rgba(182,149,95,0.28)"
                  }} />
                </div>

                {/* Skip forward */}
                <div style={{ textAlign: "center" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#EDE1D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", width: "1.4vw", height: "1.4vw" }}>
                    <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
                  </svg>
                  <div style={{ fontSize: "0.5vw", color: "#7a6050", marginTop: "0.15vw" }}>10s</div>
                </div>
              </div>

              {/* Voice slider */}
              <div style={{ width: "85%", marginBottom: "0.85vw" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3vw", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3vw" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#7a6050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "0.7vw", height: "0.7vw" }}>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                    <span style={{ fontSize: "0.6vw", color: "#7a6050" }}>Voz guiada</span>
                  </div>
                  <span style={{ fontSize: "0.6vw", color: "#C69B4F" }}>80%</span>
                </div>
                <div style={{ height: "0.2vw", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "0.1vw", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: "80%", height: "100%", backgroundColor: "#D6A85B", borderRadius: "0.1vw" }} />
                  <div style={{
                    position: "absolute", top: "50%", left: "80%",
                    transform: "translate(-50%,-50%)",
                    width: "0.5vw", height: "0.5vw",
                    borderRadius: "50%", backgroundColor: "#D6A85B"
                  }} />
                </div>
              </div>

              {/* Timer section */}
              <div style={{ width: "85%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3vw", marginBottom: "0.4vw" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#7a6050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "0.7vw", height: "0.7vw" }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  <span style={{ fontSize: "0.6vw", color: "#7a6050" }}>Apagar en</span>
                  <span style={{ fontSize: "0.6vw", color: "#C69B4F" }}>· 19:42</span>
                </div>
                <div style={{ display: "flex", gap: "0.45vw", flexWrap: "wrap" }}>
                  {["Sin timer", "5 min", "10 min", "20 min", "30 min"].map((opt, i) => (
                    <div key={opt} style={{
                      fontSize: "0.55vw",
                      color: i === 3 ? "#18110C" : "#7a6050",
                      backgroundColor: i === 3 ? "#C69B4F" : "rgba(182,149,95,0.06)",
                      border: `1px solid ${i === 3 ? "#C69B4F" : "rgba(182,149,95,0.18)"}`,
                      borderRadius: "0.5vw",
                      padding: "0.2vw 0.55vw",
                      fontWeight: i === 3 ? 600 : 400,
                    }}>{opt}</div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Blend gradient on left edge */}
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: "8%", height: "100%",
          background: "linear-gradient(90deg, #18110C 0%, rgba(24,17,12,0) 100%)",
          zIndex: 3
        }} />
      </div>
    </div>
  );
}
