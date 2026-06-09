import { Volume2 } from "lucide-react";

const BG = "#0B0F14";
const MUTED = "#7A8FA8";
const BTN_BG = "rgba(255,255,255,0.03)";

const css = `
@keyframes breathe {
  0%, 100% {
    filter: drop-shadow(0 0 5px rgba(255,255,255,0.65)) drop-shadow(0 0 12px rgba(255,255,255,0.25));
  }
  50% {
    filter: drop-shadow(0 0 3px rgba(255,255,255,0.38)) drop-shadow(0 0 7px rgba(255,255,255,0.14));
  }
}
.breathe {
  animation: breathe 3s ease-in-out infinite;
}
`;

function Btn({ playing }: { playing: boolean }) {
  return (
    <div
      style={{
        width: 37,
        height: 37,
        borderRadius: "50%",
        backgroundColor: BTN_BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className={playing ? "breathe" : undefined}>
        <Volume2
          size={15}
          color={playing ? "rgba(255,255,255,0.9)" : MUTED}
          strokeWidth={1.8}
        />
      </div>
    </div>
  );
}

export function GlowB() {
  return (
    <>
      <style>{css}</style>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <p style={{ color: MUTED, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0, marginBottom: -20 }}>
          Opción B — Glow medio + respiración
        </p>
        <div style={{ display: "flex", gap: 56, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Btn playing={false} />
            <span style={{ color: MUTED, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Sin audio</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <Btn playing={true} />
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Reproduciendo</span>
          </div>
        </div>
        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 10, margin: 0, maxWidth: 220, textAlign: "center", lineHeight: 1.6 }}>
          Glow blanco medio + respiración muy sutil.<br />Ciclo 3 s — sin movimiento del icono.
        </p>
      </div>
    </>
  );
}
