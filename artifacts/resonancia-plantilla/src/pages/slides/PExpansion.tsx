import { GOLD_GRADIENT } from "@/utils/goldText";

export default function PExpansion() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden font-display"
      style={{ background: "linear-gradient(180deg, #2E0510 0%, #160108 100%)", color: "#F4DAD5" }}
    >
      <div
        style={{
          position: "absolute",
          top: "6vh",
          right: "6vw",
          fontSize: "1.1vw",
          fontWeight: 600,
          letterSpacing: "0.22em",
          ...GOLD_GRADIENT,
        }}
      >
        LA EXPANSIÓN ESTÁ RECIÉN COMENZANDO
      </div>
    </div>
  );
}
