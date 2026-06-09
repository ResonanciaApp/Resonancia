import { Volume2 } from "lucide-react";

const BG = "#0B0F14";
const MUTED = "#7A8FA8";
const BTN_BG = "rgba(255,255,255,0.03)";

function Btn({ playing }: { playing: boolean }) {
  const glowStyle: React.CSSProperties = playing
    ? {
        filter:
          "drop-shadow(0 0 4px rgba(255,255,255,0.90)) " +
          "drop-shadow(0 0 10px rgba(255,255,255,0.55)) " +
          "drop-shadow(0 0 22px rgba(255,255,255,0.20))",
      }
    : {};
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
      <div style={glowStyle}>
        <Volume2
          size={15}
          color={playing ? "rgba(255,255,255,0.96)" : MUTED}
          strokeWidth={1.8}
        />
      </div>
    </div>
  );
}

export function GlowC() {
  return (
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
        Opción C — Glow envolvente
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
      <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 10, margin: 0, maxWidth: 200, textAlign: "center", lineHeight: 1.6 }}>
        Atmosférico y envolvente.<br />Mayor impacto, elegancia conservada.
      </p>
    </div>
  );
}
