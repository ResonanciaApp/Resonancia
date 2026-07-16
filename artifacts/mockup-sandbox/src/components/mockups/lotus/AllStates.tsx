import { LotusIcon } from "./LotusIcon";

const GOLD = "#E9C26B";
const GRAY = "#5C5A76";
const BG   = "#1B060F";

export default function AllStates() {
  return (
    <div style={{
      background: BG,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      gap: 36,
      padding: "40px 48px",
    }}>
      {/* Row of 8 states */}
      <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
        {[0,1,2,3,4,5,6,7].map(s => (
          <div
            key={s}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <LotusIcon state={s} size={60} />
            <span style={{
              color: s === 7 ? GOLD : GRAY,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
            }}>
              Día {s}
            </span>
          </div>
        ))}
      </div>

      {/* Label */}
      <p style={{
        color: GRAY,
        fontSize: 11,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        margin: 0,
        opacity: 0.7,
      }}>
        El loto florece un pétalo por día
      </p>
    </div>
  );
}
