export default function SlideContacto() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4" }}
    >
      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.05) 0%, transparent 60%)", zIndex: 0 }} />

      {/* Center block */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6vh", maxWidth: "52vw", textAlign: "center" }}>

        {/* RESONANCIA logo */}
        <img
          src={`${import.meta.env.BASE_URL}logo-resonancia.png`}
          alt="RESONANCIA"
          style={{ width: "28vw", display: "block", opacity: 0.95 }}
        />

        {/* Heading */}
        <div>
          <div style={{ fontSize: "3.5vw", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.60)", marginBottom: "0.6vh" }}>
            Juntos expandimos
          </div>
          <div style={{ fontSize: "3.5vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            la vibración.
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "5vw", height: "1.5px", backgroundColor: "rgba(255,255,255,0.18)" }} />

        {/* Contact info */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2.4vh" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.6vh" }}>
            <div style={{ fontSize: "2.0vw", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              Nicolás Blanch
            </div>
            <div style={{ fontSize: "1.1vw", fontWeight: 400, color: "rgba(255,255,255,0.40)", letterSpacing: "0.08em" }}>
              Fundador · Casa del Cuenco
            </div>
          </div>

          <div style={{ display: "flex", gap: "4vw", alignItems: "center" }}>
            {/* Phone */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4vh" }}>
              <div style={{ fontSize: "0.8vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(255,255,255,0.30)" }}>
                TELÉFONO
              </div>
              <div style={{ fontSize: "1.3vw", fontWeight: 500, color: "rgba(255,255,255,0.80)" }}>
                +56 9 9799 671
              </div>
            </div>

            {/* Dot separator */}
            <div style={{ width: "0.35vw", height: "0.35vw", backgroundColor: "rgba(255,255,255,0.22)", borderRadius: "50%" }} />

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4vh" }}>
              <div style={{ fontSize: "0.8vw", fontWeight: 600, letterSpacing: "0.18em", color: "rgba(255,255,255,0.30)" }}>
                CORREO
              </div>
              <div style={{ fontSize: "1.3vw", fontWeight: 500, color: "rgba(255,255,255,0.80)" }}>
                contacto@casadelcuenco.cl
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
