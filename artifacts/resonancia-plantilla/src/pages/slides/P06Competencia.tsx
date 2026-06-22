export default function P06Competencia() {
  const rows = [
    { app: "Calm", idioma: "Inglés", contenido: "Licenciado", precio: "USD 14.99/mes", comunidad: "No" },
    { app: "Headspace", idioma: "Inglés", contenido: "Licenciado", precio: "USD 12.99/mes", comunidad: "No" },
    { app: "Insight Timer", idioma: "Inglés", contenido: "Crowdsourced", precio: "USD 9.99/mes", comunidad: "Foros" },
    { app: "RESONANCIA", idioma: "Español nativo", contenido: "100% propio", precio: "USD 7–15/mes", comunidad: "10 años" },
  ];
  const cols = ["App", "Idioma", "Contenido", "Precio", "Comunidad real"];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}>

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "8vh 8vw", zIndex: 2 }}>

        <div style={{ marginBottom: "6vh" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#BE9650", marginBottom: "1.5vh" }}>COMPETENCIA</div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#BE9650", opacity: 0.5 }} />
        </div>

        <div style={{ fontSize: "5vw", fontWeight: 700, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "7vh" }}>
          El campo está<br /><span style={{ color: "#BE9650" }}>abierto.</span>
        </div>

        {/* Table */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr", gap: "0 2vw", paddingBottom: "1.5vh", borderBottom: "1px solid rgba(190,150,80,0.2)", marginBottom: "0" }}>
            {cols.map((c) => (
              <div key={c} style={{ fontSize: "1.05vw", fontWeight: 600, letterSpacing: "0.15em", color: "rgba(237,225,211,0.35)" }}>{c.toUpperCase()}</div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((r, i) => {
            const isUs = r.app === "RESONANCIA";
            return (
              <div key={r.app} style={{
                display: "grid", gridTemplateColumns: "2fr 2fr 2fr 2fr 2fr", gap: "0 2vw",
                padding: "2vh 0",
                borderBottom: `1px solid ${isUs ? "rgba(190,150,80,0.3)" : "rgba(237,225,211,0.06)"}`,
                backgroundColor: isUs ? "rgba(190,150,80,0.05)" : "transparent",
              }}>
                <div style={{ fontSize: isUs ? "1.7vw" : "1.55vw", fontWeight: isUs ? 700 : 500, color: isUs ? "#BE9650" : "rgba(237,225,211,0.8)" }}>{r.app}</div>
                {[r.idioma, r.contenido, r.precio, r.comunidad].map((v, j) => (
                  <div key={j} style={{ fontSize: isUs ? "1.5vw" : "1.4vw", fontWeight: isUs ? 600 : 400, color: isUs ? "#EDE1D3" : "rgba(237,225,211,0.55)" }}>{v}</div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: "4vh", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(237,225,211,0.25)" }}>06 / 08</div>
        </div>
      </div>
    </div>
  );
}
