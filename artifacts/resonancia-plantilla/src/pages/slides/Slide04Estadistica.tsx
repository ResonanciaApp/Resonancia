export default function Slide04Estadistica() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-display bg-bg text-text">
      {/* Ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 70% 60%, rgba(190,150,80,0.07) 0%, rgba(11,15,20,0) 60%)",
        }}
      />

      <div
        className="relative flex flex-col justify-center"
        style={{ width: "100vw", height: "100vh", padding: "10vh 8vw", boxSizing: "border-box" }}
      >
        {/* Eyebrow */}
        <div
          className="text-primary"
          style={{ fontSize: "1.2vw", fontWeight: 600, letterSpacing: "0.14em", marginBottom: "2vh" }}
        >
          DATO CLAVE
        </div>

        {/* Hero stat */}
        <div
          className="text-primary"
          style={{ fontSize: "11vw", fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.04em" }}
        >
          00%
        </div>

        {/* Context */}
        <div
          className="text-muted"
          style={{ fontSize: "2vw", fontWeight: 400, lineHeight: 1.5, maxWidth: "50vw", marginTop: "3vh" }}
        >
          Contexto del número. Explicá qué representa esta cifra en una línea.
        </div>
      </div>

      {/* Brand mark footer */}
      <div
        className="text-muted absolute"
        style={{ bottom: "5vh", right: "8vw", fontSize: "1vw", fontWeight: 500, letterSpacing: "0.08em" }}
      >
        RESONANCIA
      </div>
    </div>
  );
}
