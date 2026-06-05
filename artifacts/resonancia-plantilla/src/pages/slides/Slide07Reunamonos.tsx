const base = import.meta.env.BASE_URL;

export default function Slide07Reunamonos() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-center"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Ambient background */}
      <img
        src={`${base}hero-atmosphere.png`}
        crossOrigin="anonymous"
        alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18, zIndex: 0 }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, #060A0F 30%, rgba(6,10,15,0.6) 100%)", zIndex: 1 }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: "60vw" }}>
        <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.04em", color: "#BE9650", marginBottom: "1vh" }}>
          RESONANCIA
        </div>
        <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#BE9650", marginBottom: "4vh" }} />

        <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.12em", marginBottom: "2.5vh" }}>
          06 · REUNÁMONOS
        </div>
        <div style={{ fontSize: "5vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.04em", marginBottom: "3.5vh" }}>
          Te lo muestro <span style={{ color: "#BE9650" }}>en vivo.</span>
        </div>
        <div style={{ fontSize: "1.8vw", fontWeight: 400, color: "#7A8FA8", maxWidth: "46vw", lineHeight: 1.6, marginBottom: "5vh" }}>
          Me encantaría sentarme contigo, mostrarte la app funcionando y conversar sobre cómo construir esto juntos.
        </div>

        {/* Contact */}
        <div style={{ display: "flex", gap: "4vw", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "1.2vw", color: "#7A8FA8", letterSpacing: "0.08em", marginBottom: "0.8vh" }}>CORREO</div>
            <div style={{ fontSize: "1.8vw", fontWeight: 600, color: "#EDE1D3" }}>[tu correo]</div>
          </div>
          <div>
            <div style={{ fontSize: "1.2vw", color: "#7A8FA8", letterSpacing: "0.08em", marginBottom: "0.8vh" }}>TELÉFONO</div>
            <div style={{ fontSize: "1.8vw", fontWeight: 600, color: "#EDE1D3" }}>[tu teléfono]</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "6vh", left: "6vw", zIndex: 2, fontSize: "1.3vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.08em" }}>
        CASA DEL CUENCO · 2026
      </div>
    </div>
  );
}
