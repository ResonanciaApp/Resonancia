export default function Slide03DosColumnas() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-display bg-bg text-text">
      <div
        className="flex flex-col"
        style={{ width: "100vw", height: "100vh", padding: "10vh 8vw", boxSizing: "border-box" }}
      >
        {/* Headline */}
        <div
          style={{ fontSize: "4vw", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: "6vh", maxWidth: "70vw" }}
        >
          Dos columnas
        </div>

        {/* Columns */}
        <div className="flex" style={{ gap: "4vw" }}>
          {/* Column 1 */}
          <div
            className="bg-card flex flex-col"
            style={{ flex: 1, padding: "4vh 3vw", borderRadius: "1.2vw", gap: "1.8vh" }}
          >
            <div
              className="text-primary"
              style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.1em" }}
            >
              COLUMNA UNO
            </div>
            <div style={{ fontSize: "2.4vw", fontWeight: 600, lineHeight: 1.15 }}>
              Subtítulo
            </div>
            <div className="text-muted" style={{ fontSize: "1.7vw", fontWeight: 400, lineHeight: 1.5 }}>
              Texto de apoyo de la primera columna. Reemplazá con tu contenido.
            </div>
          </div>

          {/* Column 2 */}
          <div
            className="bg-card flex flex-col"
            style={{ flex: 1, padding: "4vh 3vw", borderRadius: "1.2vw", gap: "1.8vh" }}
          >
            <div
              className="text-primary"
              style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.1em" }}
            >
              COLUMNA DOS
            </div>
            <div style={{ fontSize: "2.4vw", fontWeight: 600, lineHeight: 1.15 }}>
              Subtítulo
            </div>
            <div className="text-muted" style={{ fontSize: "1.7vw", fontWeight: 400, lineHeight: 1.5 }}>
              Texto de apoyo de la segunda columna. Mantené el paralelismo.
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
