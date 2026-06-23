import { GOLD_GRADIENT } from "@/utils/goldText";
const pages = [
  {
    label: "Inicio",
    caption: "Más escuchadas, recientes y accesos rápidos.",
    color: "#5A9BAA",
    img: "/resonancia-plantilla/screenshots/inicio.jpg",
  },
  {
    label: "Mezclador",
    caption: "Mezcla tus sonidos en vivo, guárdalos y compártelos.",
    color: "#B8922A",
    img: "/resonancia-plantilla/screenshots/mezclador.jpg",
  },
  {
    label: "Biblioteca",
    caption: "Crea playlists y ordena tu contenido favorito.",
    color: "#7B5FA8",
    img: "/resonancia-plantilla/screenshots/biblioteca.jpg",
  },
  {
    label: "Explora",
    caption: "El hábitat principal de nuestro contenido.",
    color: "#9A6040",
    img: "/resonancia-plantilla/screenshots/explorar2.jpg",
  },
];

export default function PPantallas() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "4vh 6vw 3.5vh",
          zIndex: 2,
        }}
      >
        {/* ── Header ── */}
        <div style={{ marginBottom: "3vh", flexShrink: 0 }}>
          <div style={{ fontSize: "1.05vw", fontWeight: 600, letterSpacing: "0.22em", ...GOLD_GRADIENT, marginBottom: "0.8vh" }}>
            LA EXPERIENCIA
          </div>
          <div style={{ width: "4vw", height: "1px", backgroundColor: "#BE9650", opacity: 0.6, marginBottom: "1.2vh" }} />
          <div style={{ fontSize: "3.2vw", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#F4DAD5" }}>
            Las pantallas principales.
          </div>
          <div style={{ fontSize: "1.2vw", fontWeight: 400, color: "rgba(244,218,213,0.5)", marginTop: "0.7vh" }}>
            Acá es donde el contenido vive.
          </div>
        </div>

        {/* ── 4 Phones ── */}
        <div style={{ display: "flex", gap: "2vw", flex: 1, minHeight: 0 }}>
          {pages.map((p) => (
            <div key={p.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* phone frame */}
              <div
                style={{
                  height: "56vh",
                  width: "100%",
                  maxWidth: "17vw",
                  flexShrink: 0,
                  borderRadius: "1.2vw",
                  overflow: "hidden",
                  border: `1px solid ${p.color}50`,
                  boxShadow: "0 6px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(244,218,213,0.06)",
                  backgroundColor: "#1B060F",
                  position: "relative",
                }}
              >
                <img
                  src={p.img}
                  alt={p.label}
                  style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", height: "100%", width: "auto", minWidth: "100%" }}
                />
              </div>
              {/* title */}
              <div
                style={{
                  marginTop: "1.4vh",
                  fontSize: "1.25vw",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                  color: "#F4DAD5",
                  textAlign: "center",
                  maxWidth: "17vw",
                }}
              >
                {p.label}
              </div>
              {/* caption */}
              <div
                style={{
                  marginTop: "0.5vh",
                  fontSize: "1.0vw",
                  fontWeight: 400,
                  lineHeight: 1.55,
                  color: "rgba(244,218,213,0.5)",
                  textAlign: "center",
                  flexShrink: 0,
                  maxWidth: "17vw",
                }}
              >
                {p.caption}
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2vh", flexShrink: 0 }}>
          <div style={{ fontSize: "1.1vw", fontWeight: 400, letterSpacing: "0.12em", color: "rgba(244,218,213,0.3)" }}>04 / 10</div>
        </div>
      </div>
    </div>
  );
}
