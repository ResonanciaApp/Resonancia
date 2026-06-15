export default function Slide06Competencia() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display flex flex-col justify-between"
      style={{ backgroundColor: "#1B060F", color: "#F4DAD5", padding: "9vh 6vw", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: "1.5vw", fontWeight: 600, color: "rgba(242,231,228,0.50)", letterSpacing: "0.14em", marginBottom: "1.5vh" }}>
          05 · LA COMPETENCIA
        </div>
        <div style={{ fontSize: "4.2vw", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: "70vw" }}>
          Los gigantes validan el modelo, <span style={{ background: "linear-gradient(90deg, #FF6B3D, #FF9E4D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>pero no son nativos en español.</span>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "flex", gap: "2.5vw" }}>
        <div style={{ flex: 1, backgroundColor: "#27070E", borderRadius: "1vw", padding: "3.5vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#F4DAD5", marginBottom: "2vh" }}>Calm</div>
          <div style={{ fontSize: "3.2vw", fontWeight: 700, background: "linear-gradient(90deg, #FF6B3D, #FF9E4D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>~US$ 227M</div>
          <div style={{ fontSize: "1.5vw", color: "rgba(242,231,228,0.50)", marginBottom: "2vh" }}>ingresos anuales</div>
          <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.45 }}>
            ~4,5 millones de suscriptores pagos. Pensado en inglés; español traducido.
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "#27070E", borderRadius: "1vw", padding: "3.5vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2vw", fontWeight: 700, color: "#F4DAD5", marginBottom: "2vh" }}>Headspace</div>
          <div style={{ fontSize: "3.2vw", fontWeight: 700, background: "linear-gradient(90deg, #FF6B3D, #FF9E4D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>~US$ 348M</div>
          <div style={{ fontSize: "1.5vw", color: "rgba(242,231,228,0.50)", marginBottom: "2vh" }}>ingresos anuales</div>
          <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.45 }}>
            ~2,8 millones de suscriptores pagos. Pensado en inglés; español traducido.
          </div>
        </div>
        <div style={{ flex: 1, border: "1.5px solid #D4AF37", borderRadius: "1vw", padding: "3.5vh 2vw", boxSizing: "border-box" }}>
          <div style={{ fontSize: "2vw", fontWeight: 700, background: "linear-gradient(90deg, #D4AF37, #E9C46A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "2vh" }}>RESONANCIA</div>
          <div style={{ fontSize: "3.2vw", fontWeight: 700, color: "#F4DAD5", lineHeight: 1 }}>Español</div>
          <div style={{ fontSize: "1.5vw", color: "rgba(242,231,228,0.50)", marginBottom: "2vh" }}>nativo, no traducido</div>
          <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.45 }}>
            Pensado desde el español y la cultura hispanohablante, no adaptado.
          </div>
        </div>
      </div>

      {/* Closing line */}
      <div style={{ fontSize: "1.6vw", fontWeight: 400, color: "rgba(242,231,228,0.50)", lineHeight: 1.5, maxWidth: "78vw" }}>
        Calm, Headspace e Insight Timer tienen contenido en español, pero ninguno es nativo ni curado para nuestra cultura. Ahí está la oportunidad.
        <span style={{ color: "rgba(242,231,228,0.50)", fontSize: "1.5vw", display: "block", marginTop: "1vh" }}>
          Fuentes: Business of Apps (cifras aproximadas de ingresos y suscriptores).
        </span>
      </div>
    </div>
  );
}
