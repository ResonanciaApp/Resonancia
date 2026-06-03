export default function Slide01Portada() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex font-display bg-bg text-text">
      {/* Ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, rgba(190,150,80,0.08) 0%, rgba(11,15,20,0) 60%)",
        }}
      />

      {/* Content */}
      <div
        className="relative flex flex-col justify-between"
        style={{ width: "100vw", height: "100vh", padding: "9vh 8vw", boxSizing: "border-box" }}
      >
        {/* Brand mark */}
        <div>
          <div
            className="text-primary"
            style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "0.08em" }}
          >
            RESONANCIA
          </div>
          <div className="bg-primary" style={{ width: "4vw", height: "0.4vh", marginTop: "1.2vh" }} />
        </div>

        {/* Hero title */}
        <div style={{ maxWidth: "70vw" }}>
          <div
            style={{ fontSize: "6.4vw", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.04em" }}
          >
            Título de la
          </div>
          <div
            className="text-primary"
            style={{ fontSize: "6.4vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.04em", marginBottom: "3vh" }}
          >
            presentación.
          </div>
          <div
            className="text-muted"
            style={{ fontSize: "1.9vw", fontWeight: 400, lineHeight: 1.6, maxWidth: "46vw" }}
          >
            Subtítulo o bajada. Reemplazá este texto con la idea principal de tu deck.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div
            className="text-muted"
            style={{ fontSize: "1vw", fontWeight: 500, letterSpacing: "0.08em" }}
          >
            CASA DEL CUENCO · 2026
          </div>
          <div className="text-muted" style={{ fontSize: "1vw", fontWeight: 500 }}>
            Presentación
          </div>
        </div>
      </div>
    </div>
  );
}
