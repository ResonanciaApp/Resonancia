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
  color,
  onPress,
}: {
  d: Date;
  isToday: boolean;
  isSelected: boolean;
  color: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const showSelectedOutline = isSelected && !isToday;

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
    if (isToday || showSelectedOutline) bounce();
  };

  return (
    <Pressable onPress={handlePress} style={styles.dayCell}>
      <Animated.View
        style={[
          styles.dayCircle,
          isToday && { backgroundColor: color },
          showSelectedOutline && {
            borderWidth: 1.5,
            borderColor: color,
          },
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.dayNum, { color: isToday ? "#1B060F" : color }]}>
          {d.getDate()}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function HistorialCalendar({ containerPadding = 0 }: { containerPadding?: number }) {
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const { history, isFavorite, toggleFavorite, playSession } = usePlayer();
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

  const isNewUser = history.length === 0;

  const monthLabel = viewMonth
    .toLocaleDateString("es", { month: "long" })
    .replace(/^./, (c) => c.toUpperCase());

  const dayEntries = useMemo(() => {
    return history
      .filter((e) => isSameDay(new Date(e.playedAt), selectedDate))
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
  }, [history, selectedDate]);

  const goPrevMonth = () => {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };

  const p = containerPadding;

  return (
    <View>
      {/* ── Mi calendario ── */}
      <View style={[styles.sectionHeader, p ? { paddingHorizontal: p } : undefined]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mi calendario</Text>
      </View>

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

        <View style={styles.weekRow}>
          {WEEK_LABELS.map((label) => (
            <Text key={label} style={[styles.weekLabel, { color: colors.mutedForeground }]}>
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
                  color={colors.foreground}
                  onPress={() => setSelectedDate(d)}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* ── Mi historial ── */}
      <View style={[styles.sectionHeader, { marginTop: 28 }, p ? { paddingHorizontal: p } : undefined]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mi historial</Text>
      </View>

      {isNewUser ? (
        <View style={[styles.emptyWrap, { backgroundColor: colors.card }, p ? { marginHorizontal: p } : undefined]}>
          <Feather name="clock" size={26} color={colors.primary} style={{ marginBottom: 10 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Aquí aparecerán tu historial de Resonancia
          </Text>
        </View>
      ) : dayEntries.length === 0 ? (
        <View style={[styles.emptyWrap, { backgroundColor: "rgba(255,255,255,0.045)" }, p ? { marginHorizontal: p } : undefined]}>
          <Feather name="clock" size={26} color={colors.primary} style={{ marginBottom: 10 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No hay sesiones registradas este día.
          </Text>
        </View>
      ) : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
