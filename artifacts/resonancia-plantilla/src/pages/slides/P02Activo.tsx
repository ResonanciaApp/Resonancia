export default function P02Activo() {
  const attributes = [
    {
      label: "Especialización étnica y ancestral",
      desc: "Contenido enraizado en la cosmovisión latinoamericana: cuencos tibetanos, sonoterapia chamánica y tradiciones indígenas. Ninguna app occidental replica esto.",
    },
    {
      label: "Ecosistema de 10 años",
      desc: "Una década de presencia física, cursos, talleres y comunidad real antes de convertirnos en plataforma digital.",
    },
    {
      label: "Red de músicos y sonoterapeutas",
      desc: "Productores y guiadores seleccionados a mano. Catálogo propio, no crowdsourced. Identidad sonora coherente y auténtica.",
    },
    {
      label: "La voz y sabiduría de Nicolás",
      desc: "El fundador es el rostro, la voz y el contenido. Una figura con credibilidad real en la comunidad hispanohablante.",
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden font-display" style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}>

      <div style={{ position: "relative", height: "100%", display: "flex", zIndex: 2 }}>

        {/* Left */}
        <div style={{ width: "44vw", padding: "8vh 4vw 8vh 8vw", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "1.1vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", marginBottom: "1.5vh" }}>
              NUESTRO PRINCIPAL ACTIVO
            </div>
            <div style={{ width: "4vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.5, marginBottom: "4vh" }} />

            <div style={{ fontSize: "5vw", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "4vh" }}>
              10 años de comunidad.<br />
              <span style={{ color: "#D4AF37" }}>Este es el moat.</span>
            </div>

            <div style={{ fontSize: "1.45vw", fontWeight: 400, lineHeight: 1.75, color: "rgba(244,218,213,0.55)", maxWidth: "32vw" }}>
              RESONANCIA no nace de cero. Nace de una década de presencia real, confianza ganada y una comunidad que eligió quedarse.
            </div>
          </div>

          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>06 / 09</div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.15)", margin: "8vh 0" }} />

        {/* Right — attributes */}
        <div style={{ flex: 1, padding: "8vh 7vw 8vh 4vw", display: "flex", flexDirection: "column", justifyContent: "center", gap: "3.5vh" }}>
          {attributes.map((a, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.8vh" }}>
              {/* Chip */}
              <div style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                paddingTop: "0.5vh",
                paddingBottom: "0.5vh",
                paddingLeft: "1.1vw",
                paddingRight: "1.1vw",
                borderRadius: "100px",
                border: "1px solid rgba(212,175,55,0.45)",
                backgroundColor: "rgba(212,175,55,0.07)",
                fontSize: "1.05vw",
                fontWeight: 600,
                color: "#E9C46A",
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}>
                {a.label}
              </div>
              {/* Description */}
              <div style={{ fontSize: "1.2vw", fontWeight: 400, lineHeight: 1.6, color: "rgba(244,218,213,0.55)", paddingLeft: "0.2vw" }}>
                {a.desc}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
