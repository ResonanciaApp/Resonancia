export default function Slide05Cierre() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex font-display bg-bg text-text">
      {/* Ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(190,150,80,0.09) 0%, rgba(11,15,20,0) 65%)",
        }}
      />

      <div
        className="relative flex flex-col items-center justify-center text-center"
        style={{ width: "100vw", height: "100vh", padding: "10vh 8vw", boxSizing: "border-box" }}
      >
        <div
          className="text-primary"
          style={{ fontSize: "2vw", fontWeight: 700, letterSpacing: "0.16em", marginBottom: "3vh" }}
        >
          RESONANCIA
        </div>

        <div
          style={{ fontSize: "4.4vw", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.03em", maxWidth: "60vw" }}
        >
          Gracias.
        </div>

        <div
          className="text-muted"
          style={{ fontSize: "1.6vw", fontWeight: 400, lineHeight: 1.5, marginTop: "3vh" }}
        >
          contacto@casadelcuenco.com
        </div>
      </div>
    </div>
  );
}
