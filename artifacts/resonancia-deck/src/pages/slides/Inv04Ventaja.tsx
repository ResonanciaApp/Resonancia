export default function Inv04Ventaja() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}
    >
      {/* Gold accent bar top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.5vh", background: "linear-gradient(90deg, transparent 0%, #D4AF37 30%, #E9C46A 60%, transparent 100%)" }} />

      <div className="relative" style={{ height: "100%", padding: "7vh 7vw", display: "flex", flexDirection: "column", zIndex: 2 }}>

        {/* Header */}
        <div style={{ marginBottom: "4.5vh" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", textTransform: "uppercase", marginBottom: "0.8vh" }}>
            Nuestra Ventaja
          </div>
          <div style={{ fontSize: "3.8vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#F4DAD5", textWrap: "balance" }}>
            ¿Por qué nosotros?
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: "flex", gap: "5vw", flex: 1 }}>

          {/* Left — 6 strengths */}
          <div style={{ width: "52vw", display: "flex", flexDirection: "column", justifyContent: "center", gap: "2.2vh" }}>
            {[
              "Más de una década construyendo comunidad alrededor del sonido",
              "Marca reconocida: Casa del Cuenco",
              "Miles de clientes y estudiantes reales",
              "Catálogo propio de contenido — no dependemos de terceros",
              "Expertise genuino en sonoterapia y bienestar",
              "Canal de adquisición ya existente — crecimiento orgánico probado",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #E9C46A)", flexShrink: 0, marginTop: "0.85vh" }} />
                <div style={{ fontSize: "1.75vw", fontWeight: 400, color: "rgba(242,231,228,0.85)", lineHeight: 1.4, textWrap: "pretty" }}>
                  {text}
                </div>
              </div>
            ))}
          </div>

          {/* Right — 4 stat boxes */}
          <div style={{ width: "36vw", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.8vh" }}>
            {[
              { label: "Seguidores", hint: "Redes sociales" },
              { label: "Base de clientes", hint: "Activos" },
              { label: "Alumnos formados", hint: "Cursos y talleres" },
              { label: "Eventos realizados", hint: "Desde fundación" },
            ].map(({ label, hint }) => (
              <div key={label} style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: "1vw", padding: "3vh 2vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ fontSize: "3.2vw", fontWeight: 700, letterSpacing: "-0.04em", background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  [ — ]
                </div>
                <div>
                  <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "#F4DAD5", lineHeight: 1.2 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "rgba(242,231,228,0.4)" }}>
                    {hint}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div style={{ marginTop: "2vh", fontSize: "1.15vw", fontWeight: 400, color: "rgba(242,231,228,0.3)", fontStyle: "italic" }}>
          * Completar con cifras reales antes de presentar
        </div>
      </div>
    </div>
  );
}
