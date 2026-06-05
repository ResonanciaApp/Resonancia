const base = import.meta.env.BASE_URL;

export default function Slide03Producto() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex font-display"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}
    >
      {/* Left column — text */}
      <div
        className="flex flex-col justify-center"
        style={{ width: "55vw", height: "100vh", padding: "9vh 5.5vw", boxSizing: "border-box" }}
      >
        <div style={{ fontSize: "1.4vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          02 · QUÉ ES RESONANCIA
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "3.5vh", maxWidth: "44vw" }}>
          Tu refugio de <span style={{ color: "#BE9650" }}>sonido y presencia.</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.2vh" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1vw" }}>
            <div style={{ width: "0.7vw", height: "0.7vw", backgroundColor: "#BE9650", transform: "rotate(45deg)", flexShrink: 0 }} />
            <div style={{ fontSize: "1.7vw", color: "#EDE1D3", lineHeight: 1.4 }}>Meditaciones guiadas y sonidos para dormir</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1vw" }}>
            <div style={{ width: "0.7vw", height: "0.7vw", backgroundColor: "#BE9650", transform: "rotate(45deg)", flexShrink: 0 }} />
            <div style={{ fontSize: "1.7vw", color: "#EDE1D3", lineHeight: 1.4 }}>Sonidos ancestrales y de la naturaleza</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1vw" }}>
            <div style={{ width: "0.7vw", height: "0.7vw", backgroundColor: "#BE9650", transform: "rotate(45deg)", flexShrink: 0 }} />
            <div style={{ fontSize: "1.7vw", color: "#EDE1D3", lineHeight: 1.4 }}>Diario, favoritos y una comunidad propia</div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1vw" }}>
            <div style={{ width: "0.7vw", height: "0.7vw", backgroundColor: "#BE9650", transform: "rotate(45deg)", flexShrink: 0 }} />
            <div style={{ fontSize: "1.7vw", color: "#EDE1D3", lineHeight: 1.4 }}>Todo en español, con identidad y calma propias</div>
          </div>
        </div>
      </div>

      {/* Right column — phone mockups */}
      <div style={{ width: "45vw", height: "100vh", position: "relative", backgroundColor: "#060A0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(190,150,80,0.08) 0%, rgba(6,10,15,0) 65%)" }} />

        <div style={{ position: "relative", width: "32vw", height: "38vw", zIndex: 1 }}>
          <div style={{
            position: "absolute", right: "1vw", top: "10%", width: "14vw", height: "30.4vw",
            backgroundColor: "#2C2C2E", borderRadius: "2.5vw", padding: "0.46vw",
            boxShadow: "0 1vw 3.5vw rgba(0,0,0,0.75)", zIndex: 1, opacity: 0.6
          }}>
            <div style={{ position: "absolute", top: "1.2vw", left: "50%", transform: "translateX(-50%)", width: "3.3vw", height: "0.72vw", backgroundColor: "#000", borderRadius: "0.48vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2.1vw", overflow: "hidden", backgroundColor: "#060A0F" }}>
              <img src={`${base}mockup-biblioteca.jpg`} crossOrigin="anonymous" alt="Biblioteca" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>

          <div style={{
            position: "absolute", left: "1vw", top: 0, width: "17vw", height: "36.9vw",
            backgroundColor: "#1C1C1E", borderRadius: "3vw", padding: "0.55vw",
            boxShadow: "0 2vw 8vw rgba(0,0,0,0.95), 0 0 0 0.12vw rgba(255,255,255,0.07)", zIndex: 2
          }}>
            <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4vw", height: "0.85vw", backgroundColor: "#000", borderRadius: "0.58vw", zIndex: 10 }} />
            <div style={{ width: "100%", height: "100%", borderRadius: "2.55vw", overflow: "hidden", backgroundColor: "#060A0F" }}>
              <img src={`${base}mockup-musica.jpg`} crossOrigin="anonymous" alt="Música y sonidos" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", top: 0, left: 0, width: "12%", height: "100%", background: "linear-gradient(90deg, #060A0F 0%, rgba(6,10,15,0) 100%)", zIndex: 3 }} />
      </div>
    </div>
  );
}
