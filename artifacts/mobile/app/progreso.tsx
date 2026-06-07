import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { usePlayer } from "@/context/PlayerContext";
import { getSessionById } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

// ── Date helpers ──────────────────────────────────────────────────────────────

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

function relativeLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return new Date(iso).toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// ── Streak helpers ────────────────────────────────────────────────────────────

function computeCurrentStreak(events: { playedAt: string }[]): number {
  if (!events.length) return 0;
  const days = new Set(events.map((e) => dayKey(new Date(e.playedAt))));
  const today = new Date();
  const todayKey = dayKey(today);
  const yKey = dayKey(daysAgo(1));

  let cursor: Date;
  if (days.has(todayKey)) cursor = startOfDay(today);
  else if (days.has(yKey)) cursor = daysAgo(1);
  else return 0;

  let count = 0;
  const walk = new Date(cursor);
  while (days.has(dayKey(walk))) {
    count++;
    walk.setDate(walk.getDate() - 1);
  }
  return count;
}

function computeMaxStreak(events: { playedAt: string }[]): number {
  if (!events.length) return 0;
  const days = Array.from(
    new Set(events.map((e) => dayKey(new Date(e.playedAt))))
  ).sort();
  let max = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const next = new Date(days[i]);
    const diff = Math.round(
      (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 1) {
      cur++;
      if (cur > max) max = cur;
    } else {
      cur = 1;
    }
  }
  return max;
}

// ── Heat-map ──────────────────────────────────────────────────────────────────

/** Returns 0-3 intensity level for a given day */
function heatLevel(minutesByDay: Map<string, number>, key: string): number {
  const m = minutesByDay.get(key) ?? 0;
  if (m === 0) return 0;
  if (m < 10) return 1;
  if (m < 30) return 2;
  return 3;
}

const WEEK_INITIALS = ["L", "M", "M", "J", "V", "S", "D"];

// Day-of-week index Mon=0 … Sun=6 (ISO aligned)
function isoDow(d: Date): number {
  return (d.getDay() + 6) % 7;
}

// ── Challenges ────────────────────────────────────────────────────────────────

interface Challenge {
  id: string;
  icon: string;
  label: string;
  done: number;
  total: number;
}

function buildChallenges(
  totalSessions: number,
  totalMinutes: number,
  currentStreak: number,
  categoriesUsed: number
): Challenge[] {
  return [
    {
      id: "streak7",
      icon: "🔥",
      label: "Medita 7 días seguidos",
      done: Math.min(currentStreak, 7),
      total: 7,
    },
    {
      id: "sessions10",
      icon: "🧘",
      label: "Completa 10 sesiones",
      done: Math.min(totalSessions, 10),
      total: 10,
    },
    {
      id: "minutes300",
      icon: "⏱️",
      label: "Acumula 5 horas de escucha",
      done: Math.min(totalMinutes, 300),
      total: 300,
    },
    {
      id: "categories3",
      icon: "🗺️",
      label: "Explora 3 categorías distintas",
      done: Math.min(categoriesUsed, 3),
      total: 3,
    },
    {
      id: "streak21",
      icon: "🏆",
      label: "Racha de 21 días",
      done: Math.min(currentStreak, 21),
      total: 21,
    },
  ];
}

const BG_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;

export default function ProgresoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { statEvents, history } = usePlayer();
  const [tab, setTab] = useState<"logros" | "historial">("logros");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const currentStreak = computeCurrentStreak(statEvents);
    const maxStreak = computeMaxStreak(statEvents);
    const totalSessions = statEvents.length;
    const totalMinutes = Math.round(statEvents.reduce((s, e) => s + e.minutes, 0));
    const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyMinutes = Math.round(
      statEvents.filter((e) => new Date(e.playedAt).getTime() >= weekCutoff)
        .reduce((s, e) => s + e.minutes, 0)
    );
    const categoriesUsed = new Set(statEvents.map((e) => e.categoryId)).size;

    const minutesByDay = new Map<string, number>();
    for (const e of statEvents) {
      const k = dayKey(new Date(e.playedAt));
      minutesByDay.set(k, (minutesByDay.get(k) ?? 0) + e.minutes);
    }

    // This-week day activity (Mon=0..Sun=6)
    const weekActivity: boolean[] = Array(7).fill(false);
    const today = new Date();
    const todayDow = isoDow(today);
    for (let d = 0; d <= todayDow; d++) {
      const target = new Date(today);
      target.setDate(today.getDate() - (todayDow - d));
      weekActivity[d] = minutesByDay.has(dayKey(target));
    }

    // Heat-map grid: 8 cols (weeks, oldest left) × 7 rows (Mon-Sun)
    // Anchor: today is the last real cell; future cells in current column are empty
    const NUM_WEEKS = 8;
    const todayDowIdx = isoDow(today); // 0=Mon, 6=Sun
    const totalDaysInGrid = NUM_WEEKS * 7;
    // The grid ends on Sunday of the current week
    // Offset from today to that Sunday = 6 - todayDowIdx
    const daysFromTodayToGridEnd = 6 - todayDowIdx;

    const heatGrid: number[][] = Array.from({ length: NUM_WEEKS }, () =>
      Array(7).fill(-1)
    );
    for (let weekCol = 0; weekCol < NUM_WEEKS; weekCol++) {
      for (let dayRow = 0; dayRow < 7; dayRow++) {
        const daysFromEnd =
          (NUM_WEEKS - 1 - weekCol) * 7 + (6 - dayRow) - daysFromTodayToGridEnd;
        if (daysFromEnd < 0) {
          // future cell
          heatGrid[weekCol][dayRow] = -1;
          continue;
        }
        const cellDay = daysAgo(daysFromEnd);
        if (daysFromEnd > totalDaysInGrid) {
          heatGrid[weekCol][dayRow] = -1;
        } else {
          heatGrid[weekCol][dayRow] = heatLevel(minutesByDay, dayKey(cellDay));
        }
      }
    }

    const challenges = buildChallenges(
      totalSessions,
      totalMinutes,
      currentStreak,
      categoriesUsed
    );

    return {
      currentStreak,
      maxStreak,
      totalSessions,
      totalMinutes,
      weeklyMinutes,
      categoriesUsed,
      weekActivity,
      heatGrid,
      challenges,
    };
  }, [statEvents]);

  // ── Recent history ────────────────────────────────────────────────────────
  const recentSessions = useMemo(() => {
    const seen = new Set<string>();
    return history
      .slice(0, 20)
      .map((e) => {
        const session = getSessionById(e.sessionId);
        return session ? { session, playedAt: e.playedAt } : null;
      })
      .filter((x): x is NonNullable<typeof x> => {
        if (!x) return false;
        const key = x.session.id + dayKey(new Date(x.playedAt));
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 10);
  }, [history]);

  // ── Total hours/minutes display ───────────────────────────────────────────
  const timeDisplay =
    stats.totalMinutes >= 60
      ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`
      : `${stats.totalMinutes} min`;

  return (
    <LinearGradient

      style={styles.root}

      colors={BG_GRADIENT}

      locations={[0, 0.5, 1]}

      start={{ x: 0, y: 0 }}

      end={{ x: 0, y: 1 }}

    >
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 120 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(tabs)/profile" as never)
            }
            hitSlop={10}
            style={[
              styles.backBtn,
              { backgroundColor: "rgba(255,255,255,0.03)" },
            ]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerTitleRow}>
            <Text style={{ fontSize: 20 }}>🏆</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Tu progreso
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* ── Tabs ── */}
        <View
          style={[styles.tabBar, { borderBottomColor: colors.border }]}
        >
          {(["logros", "historial"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={styles.tabBtn}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color:
                      tab === t ? colors.foreground : colors.mutedForeground,
                    fontWeight: tab === t ? "700" : "500",
                  },
                ]}
              >
                {t === "logros" ? "Logros" : "Historial"}
              </Text>
              {tab === t && (
                <View
                  style={[styles.tabIndicator, { backgroundColor: colors.primary }]}
                />
              )}
            </Pressable>
          ))}
        </View>

        {/* ══════════════════ TAB: LOGROS ══════════════════ */}
        {tab === "logros" && (
          <View style={styles.tabContent}>

            {/* Racha card */}
            <View style={[styles.card, { backgroundColor: "rgba(255,255,255,0.03)" }]}>
              <View style={styles.streakTop}>
                <View style={[styles.flameBubble, { backgroundColor: "rgba(190,150,80,0.12)" }]}>
                  <Text style={styles.flameEmoji}>
                    {stats.currentStreak > 0 ? "🔥" : "✨"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.streakValue, { color: colors.foreground }]}>
                    {stats.currentStreak > 0
                      ? `${stats.currentStreak} día${stats.currentStreak !== 1 ? "s" : ""} de racha`
                      : "Comienza tu racha"}
                  </Text>
                  <Text style={[styles.streakSub, { color: colors.mutedForeground }]}>
                    {stats.currentStreak > 0
                      ? "Sigue así, no pierdas tu constancia"
                      : "Escucha una sesión hoy para empezar"}
                  </Text>
                </View>
              </View>

              {/* Week day circles */}
              <View style={styles.weekRow}>
                {WEEK_INITIALS.map((label, i) => {
                  const done = stats.weekActivity[i];
                  const isToday = i === isoDow(new Date());
                  return (
                    <View key={i} style={styles.dayPill}>
                      <Text
                        style={[
                          styles.dayLabel,
                          { color: isToday ? colors.foreground : colors.mutedForeground },
                        ]}
                      >
                        {label}
                      </Text>
                      <View
                        style={[
                          styles.dayCircle,
                          {
                            backgroundColor: done
                              ? colors.primary
                              : "transparent",
                            borderColor: done
                              ? colors.primary
                              : isToday
                              ? colors.foreground
                              : colors.border,
                          },
                        ]}
                      >
                        {done && (
                          <Feather name="check" size={13} color="#090F17" />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Max streak row */}
              <View style={[styles.maxStreakRow, { borderTopColor: colors.border }]}>
                <View
                  style={[
                    styles.maxStreakIcon,
                    { backgroundColor: "rgba(190,150,80,0.1)" },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>🛡️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.maxStreakLabel, { color: colors.foreground }]}>
                    Racha máxima
                  </Text>
                  <Text style={[styles.maxStreakSub, { color: colors.mutedForeground }]}>
                    Tu récord personal
                  </Text>
                </View>
                <Text style={[styles.maxStreakValue, { color: colors.primary }]}>
                  {stats.maxStreak > 0 ? `${stats.maxStreak} días` : "—"}
                </Text>
              </View>
            </View>

            {/* Stats 3-col */}
            <View style={styles.statsRow}>
              {[
                {
                  icon: "🧘",
                  value: stats.totalSessions.toString(),
                  line1: "Sesiones",
                  line2: "completadas",
                },
                {
                  icon: "⏱️",
                  value: timeDisplay,
                  line1: "Tiempo",
                  line2: "total",
                },
                {
                  icon: "🏆",
                  value: stats.maxStreak > 0 ? `${stats.maxStreak} d` : "—",
                  line1: "Racha",
                  line2: "máxima",
                },
              ].map((s) => (
                <View
                  key={s.line1}
                  style={[
                    styles.statCard,
                    { backgroundColor: "rgba(255,255,255,0.03)" },
                  ]}
                >
                  <Text style={styles.statIcon}>{s.icon}</Text>
                  <Text style={[styles.statValue, { color: colors.accent }]}>
                    {s.value || "—"}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.mutedForeground }]}
                  >
                    {s.line1}{"\n"}{s.line2}
                  </Text>
                </View>
              ))}
            </View>

            {/* Desafíos */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Desafíos
            </Text>
            {stats.challenges.map((c) => {
              const completed = c.done >= c.total;
              const pct = Math.min(c.done / c.total, 1);
              return (
                <View
                  key={c.id}
                  style={[
                    styles.challengeCard,
                    { backgroundColor: "rgba(255,255,255,0.03)" },
                  ]}
                >
                  <View style={styles.challengeTop}>
                    <View
                      style={[
                        styles.challengeIconBubble,
                        {
                          backgroundColor: completed
                            ? "rgba(190,150,80,0.15)"
                            : "rgba(255,255,255,0.05)",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 16 }}>
                        {completed ? "✓" : c.icon}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.challengeLabel,
                          {
                            color: completed
                              ? colors.accent
                              : colors.foreground,
                          },
                        ]}
                      >
                        {c.label}
                      </Text>
                      <Text
                        style={[
                          styles.challengeProgress,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {c.done} / {c.total}
                      </Text>
                    </View>
                  </View>
                  {!completed && (
                    <View
                      style={[
                        styles.progressBar,
                        { backgroundColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${pct * 100}%` as never,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              );
            })}

            <View
              style={[
                styles.comingSoonCard,
                { backgroundColor: "rgba(190,150,80,0.07)", borderColor: "rgba(190,150,80,0.22)" },
              ]}
            >
              <Text style={[styles.comingSoonLabel, { color: colors.primary }]}>
                {"PRÓXIMAMENTE"}
              </Text>
              <Text style={[styles.comingSoonText, { color: colors.mutedForeground }]}>
                {"Insignias, compartir tu progreso y ranking de la comunidad llegan en futuras versiones."}
              </Text>
            </View>
          </View>
        )}

        {/* ══════════════════ TAB: HISTORIAL ══════════════════ */}
        {tab === "historial" && (
          <View style={styles.tabContent}>

            {/* Heat-map */}
            <View
              style={[
                styles.card,
                { backgroundColor: "rgba(255,255,255,0.03)" },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Actividad — últimas 8 semanas
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                Cada celda equivale a un día de escucha
              </Text>

              <View style={styles.heatmapContainer}>
                {/* Day labels */}
                <View style={styles.heatmapDayLabels}>
                  {WEEK_INITIALS.map((d, i) => (
                    <Text
                      key={i}
                      style={[styles.heatDayLabel, { color: colors.mutedForeground }]}
                    >
                      {d}
                    </Text>
                  ))}
                </View>
                {/* Grid columns */}
                <View style={styles.heatmapGrid}>
                  {stats.heatGrid.map((col, wi) => (
                    <View key={wi} style={styles.heatCol}>
                      {col.map((level, di) => (
                        <View
                          key={di}
                          style={[
                            styles.heatCell,
                            {
                              backgroundColor:
                                level < 0
                                  ? "transparent"
                                  : level === 0
                                  ? colors.card === "rgba(255,255,255,0.03)"
                                    ? "#1C2230"
                                    : colors.border
                                  : level === 1
                                  ? "rgba(190,150,80,0.25)"
                                  : level === 2
                                  ? "rgba(190,150,80,0.55)"
                                  : colors.primary,
                            },
                          ]}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </View>

              {/* Legend */}
              <View style={styles.heatLegend}>
                <Text style={[styles.heatLegendLabel, { color: colors.mutedForeground }]}>
                  Menos
                </Text>
                {[0, 1, 2, 3].map((l) => (
                  <View
                    key={l}
                    style={[
                      styles.heatLegendCell,
                      {
                        backgroundColor:
                          l === 0
                            ? "#1C2230"
                            : l === 1
                            ? "rgba(190,150,80,0.25)"
                            : l === 2
                            ? "rgba(190,150,80,0.55)"
                            : colors.primary,
                      },
                    ]}
                  />
                ))}
                <Text style={[styles.heatLegendLabel, { color: colors.mutedForeground }]}>
                  Más
                </Text>
              </View>
            </View>

            {/* Weekly summary */}
            <View style={styles.statsRow}>
              {[
                {
                  icon: "🗓️",
                  value: `${stats.weekActivity.filter(Boolean).length} días`,
                  line1: "Esta",
                  line2: "semana",
                },
                {
                  icon: "⏱️",
                  value:
                    stats.weeklyMinutes >= 60
                      ? `${Math.floor(stats.weeklyMinutes / 60)}h ${stats.weeklyMinutes % 60}m`
                      : `${stats.weeklyMinutes} min`,
                  line1: "Minutos",
                  line2: "esta semana",
                },
              ].map((s) => (
                <View
                  key={s.line1}
                  style={[
                    styles.statCard,
                    { backgroundColor: "rgba(255,255,255,0.03)", flex: 1 },
                  ]}
                >
                  <Text style={styles.statIcon}>{s.icon}</Text>
                  <Text style={[styles.statValue, { color: colors.accent }]}>
                    {s.value}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.mutedForeground }]}
                  >
                    {s.line1}{"\n"}{s.line2}
                  </Text>
                </View>
              ))}
            </View>

            {/* Recent sessions */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Sesiones recientes
            </Text>

            {recentSessions.length === 0 ? (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: "rgba(255,255,255,0.03)" },
                ]}
              >
                <Feather
                  name="headphones"
                  size={28}
                  color="rgba(190,150,80,0.3)"
                />
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Tu historial aparecerá{"\n"}después de tu primera sesión.
                </Text>
              </View>
            ) : (
              recentSessions.map(({ session, playedAt }) => (
                <View key={session.id + playedAt} style={styles.historyItem}>
                  <View style={styles.historyMeta}>
                    <Text
                      style={[
                        styles.historyDate,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {relativeLabel(playedAt)}
                    </Text>
                  </View>
                  <SessionCard session={session} />
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  headerTitle: { fontSize: 22, fontWeight: "700" },

  // Tabs
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    position: "relative",
  },
  tabLabel: { fontSize: 15 },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 2,
    borderRadius: 1,
  },

  tabContent: { gap: 12 },

  // Card
  card: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  cardSub: { fontSize: 11, marginBottom: 14 },

  // Racha
  streakTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  flameBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  flameEmoji: { fontSize: 24 },
  streakValue: { fontSize: 17, fontWeight: "700", marginBottom: 3 },
  streakSub: { fontSize: 12, lineHeight: 16 },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  dayPill: { alignItems: "center", gap: 5 },
  dayLabel: { fontSize: 11, fontWeight: "600" },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  maxStreakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  maxStreakIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  maxStreakLabel: { fontSize: 13, fontWeight: "600" },
  maxStreakSub: { fontSize: 11, marginTop: 1 },
  maxStreakValue: { fontSize: 17, fontWeight: "700" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 17, fontWeight: "700" },
  statLabel: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 3,
    lineHeight: 14,
  },

  // Challenges
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 4 },
  challengeCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  challengeTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  challengeIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  challengeLabel: { fontSize: 13, fontWeight: "600" },
  challengeProgress: { fontSize: 11, marginTop: 2 },
  progressBar: { height: 4, borderRadius: 2 },
  progressFill: { height: "100%", borderRadius: 2 },

  // Heat-map
  heatmapContainer: { flexDirection: "row", alignItems: "flex-start", gap: 5 },
  heatmapDayLabels: { flexDirection: "column", gap: 4, paddingTop: 1 },
  heatDayLabel: { fontSize: 8, height: 11, lineHeight: 11 },
  heatmapGrid: { flex: 1, flexDirection: "row", gap: 4 },
  heatCol: { flex: 1, flexDirection: "column", gap: 4 },
  heatCell: { height: 11, borderRadius: 2 },
  heatLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    justifyContent: "flex-end",
  },
  heatLegendLabel: { fontSize: 9 },
  heatLegendCell: { width: 10, height: 10, borderRadius: 2 },

  // History
  historyItem: { gap: 6 },
  historyMeta: { flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 4 },
  historyDate: { fontSize: 12, fontWeight: "600" },

  // Empty
  emptyState: {
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  emptyStateText: { fontSize: 13, textAlign: "center", lineHeight: 20 },

  // Coming soon
  comingSoonCard: { borderRadius: 14, padding: 16, backgroundColor: "rgba(255,255,255,0.03)" },
  comingSoonLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 6 },
  comingSoonText: { fontSize: 13, lineHeight: 19 },
});
