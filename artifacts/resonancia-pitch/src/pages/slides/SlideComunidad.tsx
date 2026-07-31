import fbImg from "../../assets/quienes/facebook.jpg";
import ttImg from "../../assets/quienes/tiktok.jpg";
import igImg from "../../assets/quienes/instagram.jpg";
import ytImg from "../../assets/quienes/youtube.jpg";

export default function SlideComunidad() {
  const redes = [
    { nombre: "Instagram", handle: "@casadelcuenco", stat: "333 mil", sub: "seguidores · 1.176 publicaciones", img: igImg },
    { nombre: "TikTok", handle: "@casadelcuenco", stat: "279 mil", sub: "seguidores · 1,7M me gusta", img: ttImg },
    { nombre: "Facebook", handle: "Casa del Cuenco", stat: "221 mil", sub: "seguidores", img: fbImg },
    { nombre: "YouTube", handle: "El Señor De Los Cuencos", stat: "6.416", sub: "suscriptores · 272 h vistas/28 días", img: ytImg },
  ];

  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col"
      style={{ background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)", color: "#F4F4F4", padding: "3.5vh 5.5vw 3vh", boxSizing: "border-box", gap: "1.6vh" }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2vw" }}>
        <div>
          <div style={{ fontSize: "1.2vw", fontWeight: 600, color: "rgba(244,244,244,0.50)", letterSpacing: "0.14em", marginBottom: "0.4vh" }}>
            QUIÉNES SOMOS · COMUNIDAD
          </div>
          <div style={{ fontSize: "3.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            No partimos de cero: <span style={{ backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>+839.000 seguidores.</span>
          </div>
          <div style={{ fontSize: "1.15vw", color: "rgba(244,244,244,0.55)", marginTop: "0.5vh" }}>
            Comunidad real de Casa del Cuenco, construida orgánicamente en 9 años — la audiencia de lanzamiento de la app.
          </div>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right", backgroundColor: "rgba(214,164,92,0.09)", border: "1px solid rgba(214,164,92,0.35)", borderRadius: "0.7vw", padding: "1.2vh 1.6vw" }}>
          <div style={{ fontSize: "2.4vw", fontWeight: 700, backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>+839 mil</div>
          <div style={{ fontSize: "0.85vw", color: "rgba(244,244,244,0.55)", marginTop: "0.5vh" }}>seguidores totales · 4 plataformas</div>
        </div>
      </div>

      {/* Grid 2x2 de screenshots */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "1.4vh 1.2vw", minHeight: 0 }}>
        {redes.map((r) => (
          <div key={r.nombre} style={{ display: "flex", flexDirection: "column", backgroundColor: "rgba(214,164,92,0.05)", border: "1px solid rgba(214,164,92,0.25)", borderRadius: "0.7vw", overflow: "hidden", minHeight: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0.9vh 1.1vw", flexShrink: 0, gap: "1vw" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.7vw", minWidth: 0 }}>
                <span style={{ fontSize: "1.05vw", fontWeight: 700, backgroundImage: "linear-gradient(180deg, #D6A45C 0%, #F7CB6B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{r.nombre}</span>
                <span style={{ fontSize: "0.82vw", color: "rgba(244,244,244,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.handle}</span>
              </div>
              <div style={{ flexShrink: 0, display: "flex", alignItems: "baseline", gap: "0.5vw" }}>
                <span style={{ fontSize: "1.25vw", fontWeight: 700, color: "#FFFFFF" }}>{r.stat}</span>
                <span style={{ fontSize: "0.78vw", color: "rgba(244,244,244,0.50)" }}>{r.sub}</span>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0, margin: "0 1.1vw 1.1vh", borderRadius: "0.5vw", overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)" }}>
              <img src={r.img} alt={`Perfil de ${r.nombre}`} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "left center", display: "block" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <div style={{ flexShrink: 0, fontSize: "0.85vw", color: "rgba(244,244,244,0.42)" }}>
        Instagram 333.000 · TikTok 279.100 · Facebook 221.000 · YouTube 6.416 · Total ≈ 839.500 seguidores. Capturas reales de los perfiles de Casa del Cuenco.
      </div>
    </div>
  );
}
