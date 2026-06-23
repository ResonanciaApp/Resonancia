export default function PUsuarios() {
  const profiles = [
    {
      num: "01",
      archetype: "La que busca calma",
      context: "28–42 años · Profesional urbana",
      description:
        "Ansiedad cotidiana, agenda densa y poco tiempo real para parar. Prueba apps en inglés pero el idioma crea distancia emocional. Necesita que el bienestar le hable como ella piensa y siente.",
      want: "Meditaciones guiadas + sesiones cortas para el día a día",
    },
    {
      num: "02",
      archetype: "El explorador del sonido",
      context: "30–55 años · Práctica espiritual o curiosidad ancestral",
      description:
        "Ya conoce los cuencos, los chakras, las frecuencias. Busca profundidad, no superficialidad. Quiere una herramienta que esté a la altura de su práctica — no un tutorial para principiantes.",
      want: "Sonidos Ancestrales + Geometrix + Mezclador avanzado",
    },
    {
      num: "03",
      archetype: "El insomne moderno",
      context: "22–38 años · Mente activa, pantallas hasta tarde",
      description:
        "No se identifica con la meditación clásica, pero sabe que necesita desconectarse. ASMR, naturaleza, loops de sonido ambiente — lo que sea para soltar el día y dormir.",
      want: "Sonidos de naturaleza + música ambient + timer de sueño",
    },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 30%, rgba(212,175,55,0.05) 0%, transparent 55%)" }} />

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", padding: "7vh 8vw", zIndex: 2 }}>

        {/* Header */}
        <div style={{ marginBottom: "5vh" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.22em", color: "#D4AF37", marginBottom: "1.5vh" }}>
            ¿QUIÉNES SON NUESTROS USUARIOS?
          </div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.45 }} />
        </div>

        {/* Profiles grid */}
        <div style={{ display: "flex", gap: "2.5vw", flex: 1, alignItems: "stretch" }}>
          {profiles.map((p) => (
            <div
              key={p.num}
              style={{
                flex: 1,
                borderLeft: "1px solid rgba(212,175,55,0.2)",
                paddingLeft: "2vw",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* Number */}
                <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "rgba(212,175,55,0.18)", letterSpacing: "-0.04em", marginBottom: "1.5vh", lineHeight: 1 }}>
                  {p.num}
                </div>

                {/* Archetype name */}
                <div style={{ fontSize: "2vw", fontWeight: 700, color: "#F4DAD5", lineHeight: 1.2, marginBottom: "0.8vh" }}>
                  {p.archetype}
                </div>

                {/* Context tag */}
                <div style={{ fontSize: "1.1vw", fontWeight: 500, color: "#D4AF37", letterSpacing: "0.05em", marginBottom: "2.5vh", opacity: 0.8 }}>
                  {p.context}
                </div>

                {/* Description */}
                <div style={{ fontSize: "1.3vw", fontWeight: 400, lineHeight: 1.7, color: "rgba(244,218,213,0.6)" }}>
                  {p.description}
                </div>
              </div>

              {/* What they want */}
              <div style={{ marginTop: "3vh", paddingTop: "2vh", borderTop: "1px solid rgba(244,218,213,0.07)" }}>
                <div style={{ fontSize: "1vw", fontWeight: 600, letterSpacing: "0.14em", color: "rgba(212,175,55,0.5)", marginBottom: "0.6vh" }}>
                  USA PRINCIPALMENTE
                </div>
                <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "rgba(244,218,213,0.55)", lineHeight: 1.4 }}>
                  {p.want}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: "4vh", display: "flex", justifyContent: "flex-end" }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>03 / 10</div>
        </div>
      </div>
    </div>
  );
}
