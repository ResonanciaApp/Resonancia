export default function Slide02Contenido() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-display bg-bg text-text">
      <div
        className="flex flex-col"
        style={{ width: "100vw", height: "100vh", padding: "10vh 8vw", boxSizing: "border-box" }}
      >
        {/* Eyebrow */}
        <div
          className="text-primary"
          style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.14em", marginBottom: "1.6vh" }}
        >
          SECCIÓN
        </div>

        {/* Headline */}
        <div
          style={{ fontSize: "4vw", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: "5vh", maxWidth: "68vw" }}
        >
          Título de la diapositiva
        </div>

        {/* Bullets */}
        <div className="flex flex-col" style={{ gap: "3vh", maxWidth: "62vw" }}>
          <div className="flex items-start" style={{ gap: "1.6vw" }}>
            <div
              className="bg-primary"
              style={{ width: "0.7vw", height: "0.7vw", borderRadius: "9999px", marginTop: "1vh", flexShrink: 0 }}
            />
            <div style={{ fontSize: "2.1vw", fontWeight: 400, lineHeight: 1.45 }}>
              Primer punto. Reemplazá con tu contenido.
            </div>
          </div>
          <div className="flex items-start" style={{ gap: "1.6vw" }}>
            <div
              className="bg-primary"
              style={{ width: "0.7vw", height: "0.7vw", borderRadius: "9999px", marginTop: "1vh", flexShrink: 0 }}
            />
            <div style={{ fontSize: "2.1vw", fontWeight: 400, lineHeight: 1.45 }}>
              Segundo punto. Mantené las ideas breves.
            </div>
          </div>
          <div className="flex items-start" style={{ gap: "1.6vw" }}>
            <div
              className="bg-primary"
              style={{ width: "0.7vw", height: "0.7vw", borderRadius: "9999px", marginTop: "1vh", flexShrink: 0 }}
            />
            <div style={{ fontSize: "2.1vw", fontWeight: 400, lineHeight: 1.45 }}>
              Tercer punto. Una idea por línea.
            </div>
          </div>
        </div>
      </div>

      {/* Brand mark footer */}
      <div
        className="text-muted absolute"
        style={{ bottom: "5vh", right: "8vw", fontSize: "1vw", fontWeight: 500, letterSpacing: "0.08em" }}
      >
        RESONANCIA
      </div>
    </div>
  );
}
