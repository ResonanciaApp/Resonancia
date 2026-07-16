import { LotusIcon } from "./LotusIcon";

const GOLD = "#E9C26B";
const GRAY = "#5C5A76";
const BG   = "#1B060F";

export default function Zoom() {
  return (
    <div style={{
      background: BG,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      gap: 52,
      padding: "40px",
    }}>

      {/* Tamaño real en app (28 px) */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <span style={{ color: GRAY, fontSize: 10, letterSpacing: "1.2px", textTransform: "uppercase" }}>
          Tamaño real en app ≈ 28 px
        </span>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[0, 1, 3, 5, 7].map(s => (
            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <LotusIcon state={s} size={28} />
              <span style={{ color: s === 7 ? GOLD : GRAY, fontSize: 9 }}>D{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Referencia grande — Día 0 vs Día 7 */}
      <div style={{ display: "flex", gap: 80, alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <LotusIcon state={0} size={130} />
          <span style={{ color: GRAY, fontSize: 12, letterSpacing: "0.8px" }}>Día 0</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <LotusIcon state={7} size={130} />
          <span style={{ color: GOLD, fontSize: 12, letterSpacing: "0.8px", fontWeight: 600 }}>Día 7 ✦</span>
        </div>
      </div>

      {/* Bloom progression detail — states 0 3 5 7 at medium size */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <span style={{ color: GRAY, fontSize: 10, letterSpacing: "1.2px", textTransform: "uppercase" }}>
          Progresión
        </span>
        <div style={{ display: "flex", gap: 40, alignItems: "flex-end" }}>
          {[0, 2, 4, 6, 7].map(s => (
            <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <LotusIcon state={s} size={72} />
              <span style={{ color: s === 7 ? GOLD : GRAY, fontSize: 10 }}>Día {s}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
