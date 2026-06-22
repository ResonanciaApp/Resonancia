export default function Inv07Traccion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}
    >
      {/* Gold top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.5vh", background: "linear-gradient(90deg, transparent 0%, #D4AF37 30%, #E9C46A 60%, transparent 100%)" }} />

      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.06) 0%, transparent 60%)" }} />

      <div className="relative" style={{ height: "100%", padding: "7vh 7vw", display: "flex", flexDirection: "column", zIndex: 2 }}>

        {/* Header */}
        <div style={{ marginBottom: "5vh" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", textTransform: "uppercase", marginBottom: "0.8vh" }}>
            Tracción
          </div>
          <div style={{ fontSize: "3.8vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#F4DAD5" }}>
            Casa del Cuenco en números.
          </div>
        </div>

        {/* 3×2 stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vh 3vw", flex: 1 }}>
          {[
            { stat: "[ — ]", label: "Años operando", sub: "En el mercado del bienestar" },
            { stat: "[ — ]", label: "Ventas acumuladas", sub: "Históricas desde fundación" },
            { stat: "[ — ]", label: "Clientes activos", sub: "Base real y fidelizada" },
            { stat: "[ — ]", label: "Seguidores", sub: "Alcance digital orgánico" },
            { stat: "[ — ]", label: "Alumnos formados", sub: "En cursos y talleres" },
            { stat: "[ — ]", label: "Eventos realizados", sub: "Retiros, conciertos, talleres" },
          ].map(({ stat, label, sub }) => (
            <div key={label} style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.13)", borderRadius: "1vw", padding: "3.5vh 2.5vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontSize: "3.8vw", fontWeight: 700, letterSpacing: "-0.04em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>
                {stat}
              </div>
              <div>
                <div style={{ fontSize: "1.7vw", fontWeight: 600, color: "#F4DAD5", lineHeight: 1.2, marginBottom: "0.4vh" }}>
                  {label}
                </div>
                <div style={{ fontSize: "1.3vw", fontWeight: 400, color: "rgba(242,231,228,0.4)" }}>
                  {sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div style={{ marginTop: "2.5vh", fontSize: "1.15vw", fontWeight: 400, color: "rgba(242,231,228,0.3)", fontStyle: "italic" }}>
          * Completar con cifras reales antes de presentar
        </div>
      </div>
    </div>
  );
}
