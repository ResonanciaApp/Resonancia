const base = import.meta.env.BASE_URL;

function IconHome({ size = "2vw", color = "#BE9650" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconBookOpen({ size = "2vw", color = "#BE9650" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function IconSliders({ size = "2vw", color = "#BE9650" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  );
}

function IconUser({ size = "2vw", color = "#BE9650" }: { size?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

const TABS = [
  {
    icon: <IconHome size="2.2vw" />,
    name: "Inicio",
    desc: "Sesión destacada del día, intención personal y acceso rápido.",
    screenshot: "mockup-home.jpg",
  },
  {
    icon: <IconBookOpen size="2.2vw" />,
    name: "Biblioteca",
    desc: "Exploración por categoría, artistas curados y guiadores de voz.",
    screenshot: "mockup-biblioteca.jpg",
  },
  {
    icon: <IconSliders size="2.2vw" />,
    name: "Mi Música",
    desc: "Mezclador de sonidos ambiente: naturaleza, cuencos, lluvia y más.",
    screenshot: "mockup-musica.jpg",
  },
  {
    icon: <IconUser size="2.2vw" />,
    name: "Perfil",
    desc: "Diario personal, favoritos, historial y configuración.",
    screenshot: "mockup-perfil.jpg",
  },
];

export default function SlideNavegacion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ backgroundColor: "#060A0F", color: "#EDE1D3", display: "flex", flexDirection: "column" }}
    >
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "7vh 6vw 0",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: "1.4vw", fontWeight: 700, letterSpacing: "-0.05em", color: "#BE9650", marginBottom: "1vh" }}>RESONANCIA</div>
          <div style={{ width: "4vw", height: "0.4vh", backgroundColor: "#BE9650" }} />
        </div>
        <h2 style={{ fontSize: "3vw", fontWeight: 300, color: "#EDE1D3", margin: 0, letterSpacing: "-0.02em" }}>
          4 secciones, <span style={{ fontWeight: 700, color: "#BE9650" }}>todo organizado.</span>
        </h2>
      </div>

      {/* 4-column grid */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "2vw",
        padding: "5vh 5vw 6vh",
        alignItems: "end",
      }}>
        {TABS.map((tab, i) => (
          <div key={tab.name} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2vh",
          }}>
            {/* iPhone mockup */}
            <div style={{ position: "relative", width: "100%" }}>
              {/* Ambient glow */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: "90%", height: "90%",
                borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(190, 150, 80,0.08) 0%, transparent 70%)",
                zIndex: 0,
              }} />
              <div style={{
                position: "relative",
                margin: "0 auto",
                width: "11vw",
                height: "23.9vw",
                backgroundColor: "#1C1C1E",
                borderRadius: "2.2vw",
                padding: "0.42vw",
                boxShadow: "0 1.5vw 5vw rgba(0,0,0,0.85), 0 0 0 0.1vw rgba(255,255,255,0.06)",
                zIndex: 1,
                boxSizing: "border-box",
              }}>
                <div style={{ position: "absolute", top: "1.1vw", left: "50%", transform: "translateX(-50%)", width: "2.8vw", height: "0.62vw", backgroundColor: "#000", borderRadius: "0.42vw", zIndex: 10 }} />
                <div style={{ width: "100%", height: "100%", borderRadius: "1.85vw", overflow: "hidden", backgroundColor: "#060A0F" }}>
                  <img
                    src={`${base}${tab.screenshot}`}
                    crossOrigin="anonymous"
                    alt={tab.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                  />
                </div>
              </div>
            </div>

            {/* Tab info */}
            <div style={{ textAlign: "center", width: "100%" }}>
              {/* Divider */}
              <div style={{ width: "2vw", height: "1px", backgroundColor: "rgba(190, 150, 80,0.35)", margin: "0 auto 1.5vh" }} />
              {/* Icon + name */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6vw", marginBottom: "0.8vh" }}>
                {tab.icon}
                <div style={{ fontSize: "1.6vw", fontWeight: 700, color: "#EDE1D3" }}>{tab.name}</div>
              </div>
              {/* Description */}
              <div style={{ fontSize: "1.1vw", color: "#7A8FA8", lineHeight: 1.5, padding: "0 0.5vw" }}>{tab.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 6vw 4vh",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#7A8FA8", letterSpacing: "0.05em" }}>CASA DEL CUENCO · 2026</div>
        <div style={{ fontSize: "1vw", fontWeight: 500, color: "#7A8FA8" }}>03</div>
      </div>
    </div>
  );
}
