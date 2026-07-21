const stops = [
  { hex: "#211538", label: "Primario" },
  { hex: "#1E173E", label: "Secundario" },
  { hex: "#181C3E", label: "Terciario" },
  { hex: "#19233F", label: "Cuaternario" },
];

const neutrals = [
  { hex: "#F9F9F9", label: "Texto principal" },
  { hex: "#F4F4F4", label: "Texto secundario" },
];

function Swatch({ hex, label, wide }: { hex: string; label: string; wide?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.4vh", flex: wide ? 1.4 : 1 }}>
      <div
        style={{
          width: "100%",
          height: "22vh",
          borderRadius: "1vw",
          backgroundColor: hex,
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 1vh 3vh rgba(0,0,0,0.35)",
        }}
      />
      <div style={{ fontSize: "0.95vw", fontWeight: 600, letterSpacing: "0.08em", color: "#F9F9F9" }}>{label}</div>
      <div style={{ fontSize: "0.85vw", letterSpacing: "0.14em", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
        {hex.toUpperCase()}
      </div>
    </div>
  );
}

export default function SlidePaletaIndigo() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{
        background: "linear-gradient(160deg, #211538 0%, #1E173E 33%, #181C3E 66%, #19233F 100%)",
        color: "#F4F4F4",
        padding: "7vh 6vw",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "0.95vw", fontWeight: 700, letterSpacing: "0.3em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
            Identidad Visual
          </div>
          <div style={{ fontSize: "2.6vw", fontWeight: 700, color: "#F9F9F9", marginTop: "0.8vh" }}>
            Paleta de colores · Tema Índigo
          </div>
        </div>
        <img
          src={`${import.meta.env.BASE_URL}logo-resonancia.png`}
          alt="RESONANCIA"
          style={{ width: "14vw", display: "block", opacity: 0.95 }}
        />
      </div>

      {/* Indigo stops */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "5vh" }}>
        {stops.map((s) => (
          <Swatch key={s.hex} hex={s.hex} label={s.label} />
        ))}
      </div>

      {/* Neutrals + gold gradient */}
      <div style={{ display: "flex", gap: "1.6vw", marginTop: "4.5vh", alignItems: "stretch" }}>
        {neutrals.map((n) => (
          <Swatch key={n.hex} hex={n.hex} label={n.label} />
        ))}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.4vh", flex: 2 }}>
          <div
            style={{
              width: "100%",
              height: "22vh",
              borderRadius: "1vw",
              background: "linear-gradient(90deg, #F7CB6B 0%, #FBA980 100%)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 1vh 3vh rgba(0,0,0,0.35)",
            }}
          />
          <div style={{ fontSize: "0.95vw", fontWeight: 600, letterSpacing: "0.08em", color: "#F9F9F9" }}>
            Degradado dorado
          </div>
          <div style={{ fontSize: "0.85vw", letterSpacing: "0.14em", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
            #F7CB6B → #FBA980
          </div>
        </div>
      </div>
    </div>
  );
}
