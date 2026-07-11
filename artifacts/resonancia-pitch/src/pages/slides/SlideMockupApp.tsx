export default function SlideMockupApp() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg, #2d1c52 0%, #24245d 33%, #1f2a62 66%, #2d4081 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Logo esquina */}
      <img
        src={`${import.meta.env.BASE_URL}logo-pulso4.png`}
        alt="Pulso 4"
        style={{ position: "absolute", top: "3vh", right: "3vw", height: "4.5vh", opacity: 0.50 }}
      />

      {/* Imagen mockup centrada */}
      <img
        src={`${import.meta.env.BASE_URL}app-mockup.png`}
        alt="App Resonancia"
        style={{
          width: "90%",
          maxHeight: "90%",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
