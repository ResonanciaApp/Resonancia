import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { usePlayer } from "@/context/PlayerContext";
import { getSessionById } from "@/data/sessions";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { dayKey } from "@/utils/stats";

const WEEK_LABELS = ["LUN.", "MAR.", "MIÉ.", "JUE.", "VIE.", "SÁB.", "DOM."];
const EMBEDDED_WEEK_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const STREAK_VIOLET = "#985DD4";

function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Genera la grilla de días del mes (lunes-domingo), con huecos null al inicio. */
function buildMonthGrid(monthDate: Date): (Date | null)[] {
  const first = startOfMonth(monthDate);
  const dow = (first.getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < dow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
  }
  return cells;
}

function formatRelative(isoDate: string): string {
  const played = new Date(isoDate).getTime();
  const diffMs = Date.now() - played;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Justo ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} hora${diffH === 1 ? "" : "s"}`;
  const diffD = Math.floor(diffH / 24);
  return `Hace ${diffD} día${diffD === 1 ? "" : "s"}`;
}

function FavoriteHeartButton({
  favorited,
  onToggle,
}: {
  favorited: boolean;
  onToggle: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    onToggle();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={12}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {favorited ? (
          <Ionicons name="heart" size={20} color="rgba(255,255,255,0.95)" />
        ) : (
          <Ionicons name="heart-outline" size={20} color="rgba(255,255,255,0.9)" />
        )}
      </Animated.View>
    </Pressable>
  );
}

function DayCell({
  d,
  isToday,
  isSelected,
  hasCompleted,
  isFuture,
  embedded,
  color,
  onPress,
}: {
  d: Date;
  isToday: boolean;
  isSelected: boolean;
  hasCompleted: boolean;
  isFuture: boolean;
  embedded: boolean;
  color: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const bounce = () => {
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.15,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    onPress();
    if (isToday || isSelected || hasCompleted) bounce();
  };

  const dayFill = embedded
    ? !hasCompleted && isSelected
      ? "rgba(255,255,255,0.16)"
      : undefined
    : isToday
      ? color
      : undefined;
  const showLegacySelectedOutline = !embedded && isSelected && !isToday;
  const showCompletedBorder = embedded && hasCompleted;

  return (
    <Pressable
      onPress={handlePress}
      disabled={embedded && isFuture}
      style={styles.dayCell}
      accessibilityRole="button"
      accessibilityLabel={`${d.toLocaleDateString("es-CL", { day: "numeric", month: "long" })}${hasCompleted ? ", con sesión completada" : ""}`}
      accessibilityState={{ selected: isSelected, disabled: embedded && isFuture }}
    >
      <Animated.View
        style={[
          styles.dayCircle,
          !(embedded && isFuture) && dayFill && { backgroundColor: dayFill },
          showCompletedBorder && {
            borderWidth: 1.5,
            borderColor: STREAK_VIOLET,
          },
          embedded && isToday && !showCompletedBorder && {
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.88)",
            borderStyle: "dotted",
          },
          showLegacySelectedOutline && {
            borderWidth: 1.5,
            borderColor: color,
          },
          { transform: [{ scale }] },
        ]}
      >
        <Text
          style={[
            styles.dayNum,
            {
              color: embedded && isFuture
                ? "rgba(255,255,255,0.24)"
                : !embedded && isToday
                  ? "#1B060F"
                  : color,
            },
          ]}
        >
          {d.getDate()}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

type CalendarEntry = {
  sessionId: string;
  playedAt: string;
  categoryLabel?: string;
};

function formatSelectedDate(date: Date, today: Date): string {
  const month = date
    .toLocaleDateString("es-CL", { month: "short" })
    .replace(/\./g, "")
    .toUpperCase();
  const day = date.getDate();
  return isSameDay(date, today) ? `HOY, ${day} ${month}.` : `${day} ${month}.`;
}

export function HistorialCalendar({
  containerPadding = 0,
  embedded = false,
}: {
  containerPadding?: number;
  embedded?: boolean;
}) {
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const { history, statEvents, isFavorite, toggleFavorite, playSession } = usePlayer();
  const calendarBackground = activeSceneId === "indigo"
    ? "rgba(42,40,64,0.65)"
    : activeSceneId === "tibet"
      ? "rgba(0,0,0,0.15)"
      : "rgba(255,255,255,0.05)";

  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);
  const weeks = useMemo(() => {
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < grid.length; i += 7) {
      rows.push(grid.slice(i, i + 7));
    }
    const last = rows[rows.length - 1];
    while (last && last.length < 7) last.push(null);
    return rows;
  }, [grid]);

  const entries = useMemo<CalendarEntry[]>(
    () =>
      embedded
        ? statEvents
            .filter((event) => event.completed === true)
            .map((event) => ({
              sessionId: event.sessionId,
              playedAt: event.playedAt,
              categoryLabel: event.categoryLabel,
            }))
        : history,
    [embedded, history, statEvents],
  );

  const completedDayKeys = useMemo(
    () =>
      embedded
        ? new Set(entries.map((entry) => dayKey(new Date(entry.playedAt))))
        : new Set<string>(),
    [embedded, entries],
  );

  const isNewUser = !embedded && history.length === 0;

  const monthName = viewMonth.toLocaleDateString("es", { month: "long" });
  const monthLabel = embedded
    ? `${monthName.toLowerCase()}, ${viewMonth.getFullYear()}`
    : monthName.replace(/^./, (c) => c.toUpperCase());

  const dayEntries = useMemo(() => {
    return entries
      .filter((e) => isSameDay(new Date(e.playedAt), selectedDate))
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
  }, [entries, selectedDate]);

  const goPrevMonth = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    setViewMonth(next);
    if (embedded) {
      setSelectedDate(
        next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth()
          ? today
          : next,
      );
    }
  };
  const goNextMonth = () => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    setViewMonth(next);
    if (embedded) {
      setSelectedDate(
        next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth()
          ? today
          : next,
      );
    }
  };

  const p = containerPadding;

  return (
    <View style={embedded ? styles.embeddedCalendar : undefined}>
      {/* ── Mi calendario ── */}
      {!embedded && (
        <View style={[styles.sectionHeader, p ? { paddingHorizontal: p } : undefined]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mi calendario</Text>
        </View>
      )}

      <View style={[styles.calendarCard, { backgroundColor: calendarBackground }, p ? { marginHorizontal: p } : undefined]}>
        <View style={styles.calendarNav}>
          <Pressable onPress={goPrevMonth} hitSlop={10} style={styles.navBtn}>
            <Feather name="chevron-left" size={18} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
          <Pressable onPress={goNextMonth} hitSlop={10} style={styles.navBtn}>
            <Feather name="chevron-right" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={[styles.weekRow, embedded && styles.embeddedWeekRow]}>
          {(embedded ? EMBEDDED_WEEK_LABELS : WEEK_LABELS).map((label, index) => (
            <Text key={`${label}-${index}`} style={[styles.weekLabel, { color: colors.mutedForeground }]}>
              {label}
            </Text>
          ))}
        </View>

        {weeks.map((week, wi) => (
          <View key={`week-${wi}`} style={styles.daysGrid}>
            {week.map((d, i) => {
              if (!d) return <View key={`empty-${wi}-${i}`} style={styles.dayCell} />;
              return (
                <DayCell
                  key={dayKey(d)}
                  d={d}
                  isToday={isSameDay(d, today)}
                  isSelected={isSameDay(d, selectedDate)}
                  hasCompleted={completedDayKeys.has(dayKey(d))}
                  isFuture={d.getTime() > today.getTime()}
                  embedded={embedded}
                  color={colors.foreground}
                  onPress={() => setSelectedDate(d)}
                />
              );
            })}
          </View>
        ))}

        {embedded && (
        <View style={styles.embeddedSummary}>
          <Text style={[styles.embeddedDateLabel, { color: colors.mutedForeground }]}>
            {formatSelectedDate(selectedDate, today)}
          </Text>
          {dayEntries.length === 0 ? (
            <Text style={styles.embeddedEmptyText}>
              {isSameDay(selectedDate, today)
                ? "Aún no has completado nada hoy. Tómate un momento para pausar y comenzar tu práctica. 🌿"
                : "No hay actividad"}
            </Text>
          ) : (
            dayEntries.map((entry, i) => {
              const session = getSessionById(entry.sessionId);
              if (!session) return null;
              const fav = isFavorite(session.id);
              return (
                <Pressable
                  key={`${entry.sessionId}-${entry.playedAt}-${i}`}
                  style={({ pressed }) => [styles.embeddedEntryRow, { opacity: pressed ? 0.75 : 1 }]}
                  onPress={() => {
                    if (session.skipMiniPlayer) {
                      playSession(session);
                      return;
                    }
                    if (session.skipDetail) {
                      playSession(session);
                      router.push("/player" as never);
                    } else {
                      router.push(`/session/${session.id}` as never);
                    }
                  }}
                >
                  <View style={styles.embeddedEntryAccent} />
                  <View style={styles.embeddedEntryCopy}>
                    <Text style={[styles.embeddedEntryCategory, { color: colors.foreground }]}>
                      {entry.categoryLabel || session.categoryLabel || "Contenido"}
                    </Text>
                    <Text style={[styles.embeddedEntryTitle, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {session.title}
                    </Text>
                  </View>
                  <FavoriteHeartButton favorited={fav} onToggle={() => toggleFavorite(session.id)} />
                </Pressable>
              );
            })
          )}
        </View>
        )}
      </View>

      {/* ── Resumen del día ── */}
      {!embedded && (
        <View style={[styles.sectionHeader, { marginTop: 28 }, p ? { paddingHorizontal: p } : undefined]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mi historial</Text>
        </View>
      )}

      {!embedded && isNewUser ? (
        <View style={[styles.emptyWrap, { backgroundColor: colors.card }, p ? { marginHorizontal: p } : undefined]}>
          <Feather name="clock" size={26} color={colors.primary} style={{ marginBottom: 10 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Aquí aparecerán tu historial de Resonancia
          </Text>
        </View>
      ) : !embedded && dayEntries.length === 0 ? (
        <View style={[styles.emptyWrap, { backgroundColor: "rgba(255,255,255,0.045)" }, p ? { marginHorizontal: p } : undefined]}>
          <Feather name="clock" size={26} color={colors.primary} style={{ marginBottom: 10 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No hay sesiones registradas este día.
          </Text>
        </View>
      ) : !embedded ? (
        dayEntries.map((entry, i) => {
          const session = getSessionById(entry.sessionId);
          if (!session) return null;
          const fav = isFavorite(session.id);
          return (
            <Pressable
              key={`${entry.sessionId}-${entry.playedAt}-${i}`}
              style={({ pressed }) => [styles.entryRow, p ? { paddingHorizontal: p } : undefined, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => {
                if (session.skipMiniPlayer) {
                  playSession(session);
                  return;
                }
                if (session.skipDetail) {
                  playSession(session);
                  router.push("/player" as never);
                } else {
                  router.push(`/session/${session.id}` as never);
                }
              }}
            >
              <Image source={session.image} style={styles.entryThumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.entryTime, { color: colors.mutedForeground }]}>
                  {formatRelative(entry.playedAt)}
                </Text>
                <Text style={[styles.entryTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {session.title}
                </Text>
              </View>
              <FavoriteHeartButton favorited={fav} onToggle={() => toggleFavorite(session.id)} />
            </Pressable>
          );
        })
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  embeddedCalendar: { marginTop: 16 },
  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  calendarCard: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  calendarNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 14,
  },
  navBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", minWidth: 100, textAlign: "center" },
  weekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  embeddedWeekRow: { marginTop: 10 },
  weekLabel: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: { fontFamily: "Manrope", fontSize: 13, fontWeight: "500" },
  emptyWrap: {
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyText: { fontFamily: "Manrope", fontSize: 13, textAlign: "center" },
  embeddedSummary: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  embeddedDateLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 16,
  },
  embeddedEmptyText: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
    color: "#AAAAC4",
  },
  embeddedEntryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    paddingVertical: 4,
  },
  embeddedEntryAccent: {
    width: 3,
    alignSelf: "stretch",
    minHeight: 48,
    borderRadius: 2,
    backgroundColor: "#985DD4",
  },
  embeddedEntryCopy: {
    flex: 1,
    gap: 5,
  },
  embeddedEntryCategory: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
  embeddedEntryTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  entryThumb: {
    width: 77,
    height: 77,
    borderRadius: 14,
  },
  entryTime: { fontFamily: "Manrope", fontSize: 11, marginBottom: 5 },
  entryTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700" },
});
