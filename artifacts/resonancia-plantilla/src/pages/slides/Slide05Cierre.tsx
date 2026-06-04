export default function Slide05Cierre() {
  const stats = [
    { val: "580M+", label: "hispanohablantes\nglobales (TAM)" },
    { val: "~120M", label: "usuarios activos de apps\nde bienestar LATAM + US Hispanic (SAM)" },
    { val: "USD 2.4M", label: "ARR proyectado año 1\n(50.000 suscriptores premium)" },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(190,150,80,0.06) 0%, rgba(6,10,15,0) 65%)" }} />

      <div style={{ position: "relative" }}>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7A8FA8", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          04 · MERCADO Y OPORTUNIDAD
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          Un mercado grande y{" "}
          <span style={{ color: "#BE9650" }}>sin competencia nativa.</span>
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", gap: "2.5vw" }}>
        {stats.map((s) => (
          <div key={s.val} style={{ flex: 1, backgroundColor: "#090E17", borderRadius: "1vw", padding: "4vh 2.5vw", boxSizing: "border-box" }}>
            <div style={{ fontSize: "4.8vw", fontWeight: 700, color: "#BE9650", lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: "1.45vw", color: "#7A8FA8", marginTop: "1.5vh", lineHeight: 1.5, whiteSpace: "pre-line" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#7A8FA8", marginBottom: "1.5vh" }}>Tendencias a favor</div>
        <div style={{ display: "flex", gap: "3vw" }}>
          {[
            "↑ Salud mental post-pandemia",
            "↑ Identidad cultural latina en auge",
            "↑ Penetración móvil en LATAM",
            "↑ Demanda de contenido auténtico en español",
          ].map((t) => (
            <div key={t} style={{ fontSize: "1.5vw", color: "#EDE1D3", fontWeight: 500 }}>{t}</div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "5vh", right: "6vw", fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.08em" }}>
        RESONANCIA
      </div>
    </div>
  );
}
