import { Search, Plus } from "lucide-react";

const TEXT = "#e8e8e8";

const TABS = ["Todo", "Playlists", "Mezclas", "Favoritos"];

function Chips() {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 35, paddingLeft: 15, paddingRight: 15 }}>
      {TABS.map((t, i) => (
        <div
          key={t}
          style={{
            paddingInline: 16,
            paddingBlock: 8,
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            color: i === 0 ? "#16040A" : TEXT,
            backgroundColor: i === 0 ? "#D4AF37" : "rgba(255,255,255,0.06)",
          }}
        >
          {t}
        </div>
      ))}
    </div>
  );
}

export function ReversedBurgundyNavy() {
  return (
    <div style={{ minHeight: "100vh", background: "#2a2144", fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          position: "relative",
          paddingTop: 54,
          paddingBottom: 12,
          background: "linear-gradient(180deg, #16040a 0%, #2a2144 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingInline: 15, paddingBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 27, fontWeight: 700, color: TEXT, letterSpacing: 0.5 }}>Universo</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Donde viven tus creaciones</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 43, height: 43, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Search size={25} color={TEXT} />
            </div>
            <div style={{ width: 43, height: 43, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={28} color={TEXT} />
            </div>
          </div>
        </div>
        <Chips />
      </div>
      <div style={{ padding: 24, color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
        Invertido · #16040a → #2a2144
      </div>
    </div>
  );
}
