import { useState } from "react";

const GOLD = "#BE9650";
const GOLD_LIGHT = "#D6A85B";
const BG = "#0B0F14";
const CARD = "#151A23";
const CARD2 = "#1C2230";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";
const BORDER = "rgba(190,150,80,0.15)";

// ── fake data (simula lo que ya existe en AsyncStorage) ──────────────────
const STREAK = 7;
const MAX_STREAK = 21;
const SESSIONS_COMPLETED = 34;
const TOTAL_MINUTES = 312;
const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const WEEK_DONE = [true, true, true, true, true, false, false]; // hoy=V

const CHALLENGES = [
  { id: 1, label: "Meditá 7 días seguidos", done: 7, total: 7, completed: true },
  { id: 2, label: "Completá 10 sesiones", done: 10, total: 10, completed: true },
  { id: 3, label: "Alcanzá 30 minutos seguidos", done: 18, total: 30, completed: false },
  { id: 4, label: "Explorá 3 categorías distintas", done: 2, total: 3, completed: false },
];

const HISTORY = [
  { id: 1, date: "Hoy", title: "Adentro de uno mismo", cat: "Meditaciones", minutes: 30, icon: "🧘" },
  { id: 2, date: "Ayer", title: "Cuencos del Alba", cat: "Ancestrales", minutes: 25, icon: "🔔" },
  { id: 3, date: "Lun", title: "Binaural Alpha 8Hz", cat: "Música", minutes: 45, icon: "🎵" },
  { id: 4, date: "Dom", title: "Piano y Cuencos", cat: "Música", minutes: 20, icon: "🎹" },
  { id: 5, date: "Sáb", title: "Delta Profundo", cat: "Sonidos", minutes: 60, icon: "〰️" },
];

// ── Heat-map data últimas 8 semanas ────────────────────────────────────────
const heatmapRows = Array.from({ length: 8 }, (_, weekIdx) =>
  Array.from({ length: 7 }, (_, dayIdx) => {
    const pos = weekIdx * 7 + dayIdx;
    if (pos > 53) return -1; // future
    const r = Math.random();
    return r < 0.3 ? 0 : r < 0.6 ? 1 : r < 0.85 ? 2 : 3;
  })
);
// Sobrescribir última semana con datos reales
[0, 1, 2, 3, 4].forEach((d) => (heatmapRows[7][d] = 2));

function HeatCell({ level }: { level: number }) {
  const colors = ["#1C2230", "rgba(190,150,80,0.3)", "rgba(190,150,80,0.6)", GOLD];
  if (level < 0) return <div style={{ width: 10, height: 10 }} />;
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: 2,
        backgroundColor: colors[level],
      }}
    />
  );
}

export function TuProgreso() {
  const [tab, setTab] = useState<"logros" | "historial">("logros");

  return (
    <div
      style={{
        width: 390,
        minHeight: 844,
        backgroundColor: BG,
        fontFamily: "'Inter', system-ui, sans-serif",
        color: FG,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Status bar placeholder */}
      <div style={{ height: 44 }} />

      {/* Header */}
      <div style={{ padding: "0 20px 0", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 22, color: MUTED, cursor: "pointer" }}>←</span>
        <span style={{ fontSize: 22 }}>🏆</span>
        <span style={{ fontSize: 22, fontWeight: 700 }}>Tu progreso</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 0, position: "relative" }}>
        {(["logros", "historial"] as const).map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 600,
              color: tab === t ? FG : MUTED,
              cursor: "pointer",
              position: "relative",
            }}
          >
            {t === "logros" ? "Logros" : "Historial"}
            {tab === t && (
              <div style={{ position: "absolute", bottom: 0, left: "25%", right: "25%", height: 2, backgroundColor: FG, borderRadius: 1 }} />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: LOGROS ── */}
      {tab === "logros" && (
        <div style={{ padding: "20px 20px 100px" }}>

          {/* Racha card */}
          <div style={{ backgroundColor: CARD, borderRadius: 18, padding: "20px 18px", marginBottom: 14, border: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <span style={{ fontSize: 40 }}>🔥</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{STREAK} días de racha</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Medita todos los días para mantener tu llama encendida</div>
              </div>
            </div>

            {/* Week circles */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {WEEK_DAYS.map((d, i) => {
                const done = WEEK_DONE[i];
                const isToday = i === 4; // viernes
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{d}</span>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      backgroundColor: done ? GOLD : "transparent",
                      border: `2px solid ${done ? GOLD : isToday ? FG : "rgba(255,255,255,0.15)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {done && <span style={{ fontSize: 14 }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Racha máxima fila */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(190,150,80,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Racha máxima</div>
                  <div style={{ fontSize: 11, color: MUTED }}>Tu récord personal</div>
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: GOLD }}>{MAX_STREAK} días</div>
            </div>
          </div>

          {/* Stats 3-col */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {[
              { icon: "🧘", value: SESSIONS_COMPLETED, label: "Sesiones\ncompletadas" },
              { icon: "⏱️", value: `${Math.floor(TOTAL_MINUTES / 60)}h ${TOTAL_MINUTES % 60}m`, label: "Tiempo\ntotal" },
              { icon: "🏆", value: `${MAX_STREAK} d`, label: "Racha\nmáxima" },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, backgroundColor: CARD, borderRadius: 14, padding: "14px 10px", textAlign: "center", border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: GOLD_LIGHT }}>{s.value}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 3, whiteSpace: "pre-line", lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Desafíos */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Desafíos</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {CHALLENGES.map((c) => (
                <div key={c.id} style={{ backgroundColor: CARD, borderRadius: 14, padding: "14px 16px", border: `1px solid ${c.completed ? "rgba(190,150,80,0.3)" : BORDER}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: c.completed ? 0 : 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: c.completed ? "rgba(190,150,80,0.2)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                      {c.completed ? "✓" : "🌱"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.completed ? GOLD_LIGHT : FG }}>{c.label}</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{c.done} / {c.total}</div>
                    </div>
                  </div>
                  {!c.completed && (
                    <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${(c.done / c.total) * 100}%`, backgroundColor: GOLD, borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Próximas funciones */}
          <div style={{ backgroundColor: "rgba(190,150,80,0.08)", border: `1px solid rgba(190,150,80,0.25)`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, marginBottom: 6, letterSpacing: 0.5 }}>PRÓXIMAMENTE</div>
            <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
              Insignias, comparti tu progreso y ranking de la comunidad llegan en futuras versiones.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: HISTORIAL ── */}
      {tab === "historial" && (
        <div style={{ padding: "20px 20px 100px" }}>

          {/* Heat map */}
          <div style={{ backgroundColor: CARD, borderRadius: 18, padding: "16px 16px", marginBottom: 14, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Actividad — últimas 8 semanas</div>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>Cada celda = 1 día meditado</div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
              {/* Day labels */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 2 }}>
                {["L", "M", "M", "J", "V", "S", "D"].map((d) => (
                  <div key={d} style={{ height: 10, fontSize: 8, color: MUTED, lineHeight: "10px" }}>{d}</div>
                ))}
              </div>
              {/* Grid */}
              <div style={{ display: "flex", gap: 4 }}>
                {heatmapRows.map((week, wi) => (
                  <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {week.map((level, di) => (
                      <HeatCell key={di} level={level} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 10, color: MUTED }}>Menos</span>
              {[0, 1, 2, 3].map((l) => <HeatCell key={l} level={l} />)}
              <span style={{ fontSize: 10, color: MUTED }}>Más</span>
            </div>
          </div>

          {/* Stats semanales */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Esta semana", value: "5 días", icon: "🗓️" },
              { label: "Minutos", value: "218 min", icon: "⏱️" },
            ].map((s) => (
              <div key={s.label} style={{ flex: 1, backgroundColor: CARD, borderRadius: 14, padding: "14px 14px", border: `1px solid ${BORDER}` }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: GOLD_LIGHT }}>{s.value}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Sesiones recientes */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Sesiones recientes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {HISTORY.map((h) => (
                <div key={h.id} style={{ backgroundColor: CARD, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, border: `1px solid ${BORDER}` }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(190,150,80,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {h.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{h.cat}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: GOLD, fontWeight: 600 }}>{h.minutes} min</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{h.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
