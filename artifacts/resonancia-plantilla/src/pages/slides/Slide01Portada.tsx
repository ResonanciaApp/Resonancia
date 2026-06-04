export default function Slide01Portada() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3" }}
    >
      {/* Left column */}
      <div
        className="flex flex-col justify-between"
        style={{ width: "55vw", height: "100vh", padding: "8vh 6vw", boxSizing: "border-box" }}
      >
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "0.18em", color: "#BE9650", marginBottom: "1vh" }}>
            RESONANCIA
          </div>
          <div style={{ width: "4vw", height: "0.35vh", backgroundColor: "#BE9650" }} />
        </div>

        <div>
          <div style={{ fontSize: "1.6vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.12em", marginBottom: "2.5vh" }}>
            MODELO DE NEGOCIOS
          </div>
          <div style={{ fontSize: "5.8vw", fontWeight: 300, lineHeight: 1.06, letterSpacing: "-0.04em", color: "#EDE1D3" }}>
            La primera app de
          </div>
          <div style={{ fontSize: "5.8vw", fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.04em", color: "#BE9650", marginBottom: "3.5vh" }}>
            meditación nativa.
          </div>
          <div style={{ fontSize: "1.8vw", fontWeight: 400, color: "#7A8FA8", maxWidth: "40vw", lineHeight: 1.65 }}>
            580 millones de hispanohablantes. Una sola plataforma pensada desde su idioma, su cultura y su espiritualidad.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "1.4vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.08em" }}>
            CASA DEL CUENCO · 2026
          </div>
          <div style={{ fontSize: "1.4vw", fontWeight: 500, color: "#7A8FA8" }}>iOS · Android</div>
        </div>
      </div>

      {/* Right column */}
      <div style={{ width: "45vw", height: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(190,150,80,0.09) 0%, rgba(6,10,15,0) 65%)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "2.2vh", width: "34vw", zIndex: 1 }}>
          {[
            { val: "580M+", label: "hispanohablantes en el mundo" },
            { val: "USD 4/mes", label: "plan premium más accesible del mercado" },
            { val: "0", label: "competidores nativos en español de calidad" },
          ].map((item) => (
            <div key={item.val} style={{ backgroundColor: "#090E17", borderRadius: "1vw", padding: "2.8vh 2.2vw", boxSizing: "border-box", borderLeft: "3px solid #BE9650" }}>
              <div style={{ fontSize: "3.2vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>{item.val}</div>
              <div style={{ fontSize: "1.4vw", color: "#7A8FA8", marginTop: "0.8vh", lineHeight: 1.4 }}>{item.label}</div>
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", top: 0, left: 0, width: "10%", height: "100%", background: "linear-gradient(90deg, #060A0F 0%, rgba(6,10,15,0) 100%)", zIndex: 2 }} />
      </div>
    </div>
  );
}
