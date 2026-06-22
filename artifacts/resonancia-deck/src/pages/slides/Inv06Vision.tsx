const base = import.meta.env.BASE_URL;

export default function Inv06Vision() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5" }}
    >
      {/* Background image very subtle */}
      <img src={`${base}hero-bowl.png`} crossOrigin="anonymous" alt="" aria-hidden style={{ position: "absolute", right: "-5vw", bottom: "-5vh", width: "50vw", opacity: 0.06, filter: "blur(2px)" }} />

      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(74,12,12,0.3) 0%, transparent 65%)" }} />

      {/* Gold bar bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "0.5vh", background: "linear-gradient(90deg, transparent 0%, #D4AF37 30%, #E9C46A 60%, transparent 100%)" }} />

      <div className="relative" style={{ height: "100%", padding: "8vh 10vw", display: "flex", flexDirection: "column", zIndex: 2 }}>

        {/* Eyebrow */}
        <div style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.2em", color: "#D4AF37", textTransform: "uppercase", marginBottom: "1.5vh" }}>
          Visión y Oportunidad
        </div>

        {/* Main title */}
        <div style={{ fontSize: "4.2vw", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#F4DAD5", marginBottom: "2vh", textWrap: "balance" }}>
          De Casa del Cuenco a un ecosistema digital global.
        </div>

        <div style={{ width: "5vw", height: "0.3vh", background: "linear-gradient(90deg, #D4AF37, transparent)", marginBottom: "5vh" }} />

        {/* 3 objectives */}
        <div style={{ display: "flex", gap: "3vw", marginBottom: "6vh" }}>
          {[
            { n: "1", title: "Escalar", body: "Desde Chile a toda Latinoamérica — el mercado hispanohablante de bienestar digital." },
            { n: "2", title: "Transformar", body: "Convertir una empresa física de probado éxito en una plataforma digital escalable." },
            { n: "3", title: "Liderar", body: "Construir el referente hispano de bienestar basado en sonido a nivel global." },
          ].map(({ n, title, body }) => (
            <div key={n} style={{ flex: 1 }}>
              <div style={{ fontSize: "3.5vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1, marginBottom: "1.2vh" }}>
                {n}.
              </div>
              <div style={{ fontSize: "2vw", fontWeight: 700, color: "#F4DAD5", marginBottom: "1vh" }}>
                {title}
              </div>
              <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "rgba(242,231,228,0.6)", lineHeight: 1.5, textWrap: "pretty" }}>
                {body}
              </div>
            </div>
          ))}
        </div>

        {/* Closing quote */}
        <div style={{ marginTop: "auto", padding: "3vh 3vw", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "1vw", borderLeft: "0.35vw solid #D4AF37" }}>
          <div style={{ fontSize: "1.8vw", fontWeight: 500, color: "rgba(242,231,228,0.85)", lineHeight: 1.6, fontStyle: "italic", textWrap: "pretty" }}>
            "Buscamos socios estratégicos que compartan nuestra visión de llevar el poder transformador del sonido a millones de personas."
          </div>
        </div>
      </div>
    </div>
  );
}
