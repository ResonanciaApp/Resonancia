const GoldIcon = ({ paths }: { paths: string[] }) => (
  <svg
    viewBox="0 0 24 24"
    width="1.6vw"
    height="1.6vw"
    fill="none"
    stroke="url(#goldGradActivo)"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, minWidth: "1.6vw" }}
  >
    <defs>
      <linearGradient id="goldGradActivo" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#E9C46A" />
      </linearGradient>
    </defs>
    {paths.map((d, i) => <path key={i} d={d} />)}
  </svg>
);

export default function P02Activo() {
  const attributes = [
    {
      title: "Especialización étnica y ancestral",
      desc: "Contenido enraizado en la cosmovisión latinoamericana: cuencos tibetanos, sonoterapia chamánica y tradiciones indígenas. Ninguna app occidental replica esto.",
      icon: [
        "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
      ],
    },
    {
      title: "Ecosistema de 10 años",
      desc: "Una década de presencia física, cursos, talleres y comunidad real antes de convertirnos en plataforma digital.",
      icon: [
        "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z",
        "M12 6v6l4 2",
      ],
    },
    {
      title: "Red de músicos y sonoterapeutas",
      desc: "Productores y guiadores seleccionados a mano. Catálogo propio, no crowdsourced. Identidad sonora coherente y auténtica.",
      icon: [
        "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
        "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
        "M23 21v-2a4 4 0 0 0-3-3.87",
        "M16 3.13a4 4 0 0 1 0 7.75",
      ],
    },
    {
      title: "La voz y sabiduría de Nicolás",
      desc: "El fundador es el rostro, la voz y el contenido. Una figura con credibilidad real y presencia en toda la comunidad hispanohablante.",
      icon: [
        "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z",
        "M19 10v2a7 7 0 0 1-14 0v-2",
        "M12 19v4M8 23h8",
      ],
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

          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.25)" }}>06 / 10</div>
        </div>

        {/* Divider */}
        <div style={{ width: "1px", backgroundColor: "rgba(212,175,55,0.15)", margin: "8vh 0" }} />

        {/* Right — attributes */}
        <div style={{ flex: 1, padding: "8vh 7vw 8vh 4vw", display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: "3.2vh" }}>
          <div style={{ marginBottom: "0.5vh" }}>
            <div style={{ fontSize: "1.0vw", fontWeight: 600, letterSpacing: "0.22em", color: "rgba(212,175,55,0.45)" }}>NUESTRA ESENCIA</div>
            <div style={{ width: "3vw", height: "1px", backgroundColor: "#D4AF37", opacity: 0.25, marginTop: "0.8vh" }} />
          </div>
          {attributes.map((a, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.5vh" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
                <GoldIcon paths={a.icon} />
                <div style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F4DAD5" }}>{a.title}</div>
              </div>
              <div style={{ fontSize: "1.15vw", fontWeight: 400, lineHeight: 1.6, color: "rgba(244,218,213,0.5)", paddingLeft: "2.4vw" }}>
                {a.desc}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
