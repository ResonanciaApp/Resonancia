import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { usePlayer } from "@/context/PlayerContext";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { getSessionById } from "@/data/sessions";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigo2ThemeId, isIndigoThemeId } from "@/config/scene-themes";
import { useColors } from "@/hooks/useColors";
import { dayKey } from "@/utils/stats";
import { CARD_TEXT_BELOW, WIDGET_GREEN_SOLID } from "@/constants/colors";
import { dedupeCompletedHistoryByDay, formatCompletedSessionCount } from "@/lib/history-calendar";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";

const WEEK_LABELS = ["LUN", "MAR", "MIER", "JUE", "VIE", "SAB", "DOM"];
const EMBEDDED_WEEK_LABELS = ["LUN", "MAR", "MIER", "JUE", "VIE", "SAB", "DOM"];
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
  const [isPressed, setIsPressed] = useState(false);

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
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      hitSlop={12}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {favorited || isPressed ? (
          <Ionicons name="heart" size={20} color={WIDGET_GREEN_SOLID} />
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
  textSizeAdjustment = 0,
  onPress,
}: {
  d: Date;
  isToday: boolean;
  isSelected: boolean;
  hasCompleted: boolean;
  isFuture: boolean;
  embedded: boolean;
  color: string;
  textSizeAdjustment?: number;
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
    ? hasCompleted
      ? "rgba(249,249,249,0.1)"
      : undefined
    : undefined;
  const showLegacySelectedOutline = !embedded && isSelected && !isToday;
  const showEmbeddedSelectedOutline = embedded && isSelected && !isToday;
  const showTodayCompletedBorder = embedded && isToday && hasCompleted;

  return (
    <Pressable
      onPress={handlePress}
        disabled={isFuture}
      style={[styles.dayCell, embedded && styles.embeddedDayCell]}
      accessibilityRole="button"
      accessibilityLabel={`${d.toLocaleDateString("es-CL", { day: "numeric", month: "long" })}${hasCompleted ? ", con sesión completada" : ""}`}
        accessibilityState={{ selected: isSelected, disabled: isFuture }}
    >
      <Animated.View
        style={[
          styles.dayCircle,
          !isFuture && dayFill && { backgroundColor: dayFill },
          !embedded && isSelected && !isFuture && { backgroundColor: "#F9F9F9" },
          showTodayCompletedBorder && {
            borderWidth: 1.5,
            borderColor: "#F9F9F9",
          },
          embedded && isToday && !hasCompleted && {
            borderWidth: 1.5,
            borderColor: "#F9F9F9",
            borderStyle: "dotted",
          },
          showEmbeddedSelectedOutline && {
            borderWidth: 1,
            borderColor: "rgba(249,249,249,0.7)",
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
            embedded && styles.embeddedDayNum,
            embedded && textSizeAdjustment !== 0 && { fontSize: styles.embeddedDayNum.fontSize + textSizeAdjustment },
            {
              color: isFuture
                ? "rgba(255,255,255,0.24)"
                : !embedded && isSelected
                  ? "#060A0F"
                : embedded && hasCompleted
                   ? "#F9F9F9"
                  : embedded && isToday
                    ? "#F9F9F9"
                    : embedded && isSelected
                      ? "#F9F9F9"
                      : isToday
                        ? "#FFFFFF"
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
  showCompletedSessionCount = false,
  dayContentTextColor,
  backgroundColor,
  outlined = false,
  cardHorizontalPadding,
  cardVerticalPadding,
  canonicalVerticalInsets = false,
  profileCalendarLayout = false,
  animateEntrance = false,
  entranceReplayKey = "history-calendar",
  entranceBaseDelay = 0,
  calendarTextSizeAdjustment = 0,
  calendarDayTextSizeAdjustment = calendarTextSizeAdjustment,
}: {
  containerPadding?: number;
  embedded?: boolean;
  showCompletedSessionCount?: boolean;
  dayContentTextColor?: string;
  backgroundColor?: string;
  outlined?: boolean;
  cardHorizontalPadding?: number;
  cardVerticalPadding?: number;
  canonicalVerticalInsets?: boolean;
  profileCalendarLayout?: boolean;
  animateEntrance?: boolean;
  entranceReplayKey?: string | number;
  entranceBaseDelay?: number;
  calendarTextSizeAdjustment?: number;
  calendarDayTextSizeAdjustment?: number;
}) {
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const calendarAccent = isIndigo2ThemeId(activeSceneId) ? colors.accent : colors.mutedForeground;
  const { history, statEvents, isFavorite, toggleFavorite, playSession } = usePlayer();
  const calendarBackground = isIndigo2ThemeId(activeSceneId)
    ? "rgba(191,207,255,0.096)"
    : isIndigoThemeId(activeSceneId)
      ? "rgba(181,211,255,0.057)"
      : activeSceneId === "tibet"
        ? "rgba(0,0,0,0.15)"
        : "rgba(181,211,255,0.057)";

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
        ? dedupeCompletedHistoryByDay(
            statEvents
              .filter((event) => event.completed === true)
              .map((event) => ({
                sessionId: event.sessionId,
                playedAt: event.playedAt,
                categoryLabel: event.categoryLabel,
              })),
          )
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
  const lastVisibleDayEntryIndex = useMemo(() => {
    if (!canonicalVerticalInsets) return dayEntries.length - 1;
    for (let i = dayEntries.length - 1; i >= 0; i--) {
      const entry = dayEntries[i];
      if (entry && getSessionById(entry.sessionId)) return i;
    }
    return -1;
  }, [canonicalVerticalInsets, dayEntries]);

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
  const atCurrentMonth = viewMonth.getTime() >= startOfMonth(today).getTime();
  const goNextMonth = () => {
    if (profileCalendarLayout && atCurrentMonth) return;
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
  const canonicalEmbeddedInsets = canonicalVerticalInsets && embedded;

  return (
    <View style={embedded ? styles.embeddedCalendar : undefined}>
      {/* ── Mi calendario ── */}
      {!embedded && (
        <View style={[styles.sectionHeader, p ? { paddingHorizontal: p } : undefined]}>
          <Text style={[styles.sectionTitle, styles.calendarSectionTitle, { color: colors.foreground }]}>Mi calendario</Text>
        </View>
      )}

      <View
        style={[
          styles.calendarCard,
          { backgroundColor: backgroundColor ?? calendarBackground },
          outlined && styles.outlinedCalendarCard,
          cardHorizontalPadding !== undefined && {
            paddingHorizontal: cardHorizontalPadding,
          },
          cardVerticalPadding !== undefined && {
            paddingVertical: cardVerticalPadding,
          },
          canonicalVerticalInsets && embedded && styles.canonicalCalendarVerticalInsets,
          profileCalendarLayout && embedded && styles.profileCalendarInsets,
          p ? { marginHorizontal: p } : undefined,
        ]}
      >
        <CalendarEntrance
          animated={animateEntrance}
          replayKey={`${entranceReplayKey}:nav`}
          delay={entranceBaseDelay}
        >
        <View style={[styles.calendarNav, profileCalendarLayout && embedded && styles.profileCalendarNav]}>
          <Pressable
            onPress={goPrevMonth}
            hitSlop={10}
            style={[styles.navBtn, canonicalEmbeddedInsets && styles.canonicalEmbeddedNavButton]}
          >
            <Feather name="chevron-left" size={18} color={colors.foreground} />
          </Pressable>
          <Text
            style={[
              styles.monthLabel,
              embedded && styles.embeddedMonthLabel,
              canonicalEmbeddedInsets && styles.canonicalEmbeddedMonthLabel,
              { color: colors.foreground },
            ]}
          >
            {monthLabel}
          </Text>
          {profileCalendarLayout && atCurrentMonth ? (
            <View pointerEvents="none" style={[styles.navBtn, canonicalEmbeddedInsets && styles.canonicalEmbeddedNavButton]} />
          ) : (
          <Pressable
            onPress={goNextMonth}
            hitSlop={10}
            style={[styles.navBtn, canonicalEmbeddedInsets && styles.canonicalEmbeddedNavButton]}
          >
            <Feather name="chevron-right" size={18} color={colors.foreground} />
          </Pressable>
          )}
        </View>
        </CalendarEntrance>

        <CalendarEntrance
          animated={animateEntrance}
          replayKey={`${entranceReplayKey}:labels`}
          delay={entranceBaseDelay + 180}
        >
        <View style={[styles.weekRow, embedded && styles.embeddedWeekRow, profileCalendarLayout && embedded && styles.profileWeekRow]}>
          {(embedded ? EMBEDDED_WEEK_LABELS : WEEK_LABELS).map((label, index) => (
            <Text key={`${label}-${index}`} style={[styles.weekLabel, { color: calendarAccent }, calendarTextSizeAdjustment !== 0 && { fontSize: styles.weekLabel.fontSize + calendarTextSizeAdjustment }]}>
              {label}
            </Text>
          ))}
        </View>
        </CalendarEntrance>

        {weeks.map((week, wi) => (
          <CalendarEntrance
            key={`week-${wi}`}
            animated={animateEntrance}
            replayKey={`${entranceReplayKey}:week-${wi}`}
            delay={entranceBaseDelay + 360 + wi * 150}
          >
            <View style={[styles.daysGrid, embedded && styles.embeddedDaysGrid]}>
              {week.map((d, i) => {
                if (!d) {
                  return (
                    <View
                      key={`empty-${wi}-${i}`}
                      style={[styles.dayCell, embedded && styles.embeddedDayCell]}
                    />
                  );
                }
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
                    textSizeAdjustment={calendarDayTextSizeAdjustment}
                    onPress={() => setSelectedDate(d)}
                  />
                );
              })}
            </View>
          </CalendarEntrance>
        ))}

        {embedded && (
        <CalendarEntrance
          animated={animateEntrance}
          replayKey={`${entranceReplayKey}:summary`}
          delay={entranceBaseDelay + 360 + weeks.length * 150}
        >
        <View style={styles.embeddedSummary}>
          <View style={showCompletedSessionCount && dayEntries.length > 0 ? styles.embeddedDateSummary : undefined}>
            <Text style={[
              styles.embeddedDateLabel,
              showCompletedSessionCount && dayEntries.length > 0 && styles.embeddedDateLabelWithCount,
              { color: calendarAccent },
            ]}>
              {formatSelectedDate(selectedDate, today)}
            </Text>
            {showCompletedSessionCount && dayEntries.length > 0 && (
              <Text testID="profile-calendar-completed-count" style={[styles.embeddedCompletedCount, dayContentTextColor !== undefined && { color: dayContentTextColor }]}>
                {formatCompletedSessionCount(dayEntries.length)}
              </Text>
            )}
          </View>
          {dayEntries.length === 0 ? (
            <Text style={[styles.embeddedEmptyText, { color: dayContentTextColor ?? "#F9F9F9" }]}>
              {isSameDay(selectedDate, today)
                ? "Aún no has completado nada hoy"
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
                  style={({ pressed }) => [
                    styles.embeddedEntryRow,
                    canonicalVerticalInsets &&
                      i === lastVisibleDayEntryIndex &&
                      styles.embeddedEntryRowAtCardEdge,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
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
                  <View style={styles.embeddedEntryImageWrap}>
                    <Image
                      source={session.image}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                    <SessionDurationBadge
                      label={session.durationLabel}
                      style={styles.embeddedEntryDuration}
                      textStyle={[styles.embeddedEntryDurationText, dayContentTextColor !== undefined && { color: dayContentTextColor }]}
                    />
                  </View>
                  <View style={styles.embeddedEntryCopy}>
                    <Text style={[styles.embeddedEntryTitle, { color: dayContentTextColor ?? calendarAccent }]} numberOfLines={2}>
                      {session.title}
                    </Text>
                    <Text style={[styles.embeddedEntryCategory, { color: dayContentTextColor ?? colors.foreground }]}>
                      {entry.categoryLabel || session.categoryLabel || "Contenido"}
                    </Text>
                  </View>
                  <FavoriteHeartButton favorited={fav} onToggle={() => toggleFavorite(session.id)} />
                </Pressable>
              );
            })
          )}
        </View>
        </CalendarEntrance>
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
        <View style={[styles.emptyWrap, { backgroundColor: "rgba(0,0,0,0.16)" }, p ? { marginHorizontal: p } : undefined]}>
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
          const guideIds = session.guideIds?.length
            ? session.guideIds
            : session.guideId
              ? [session.guideId]
              : [];
          const authorName = guideIds.length
            ? guideIds.map((guideId) => getGuide(guideId).name).join(" · ")
            : session.artistId
              ? getArtist(session.artistId).name
              : session.subtitle ?? "Casa del Cuenco";
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
                <Text
                  style={[styles.entryAuthor, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {authorName}
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

function CalendarEntrance({
  animated,
  children,
  delay,
  replayKey,
}: {
  animated: boolean;
  children: React.ReactNode;
  delay: number;
  replayKey: string | number;
}) {
  if (!animated) return <>{children}</>;
  return (
    <CinematicFadeSlide
      replayKey={replayKey}
      delay={delay}
      duration={1050}
      scaleFrom={0.98}
      translateYFrom={12}
    >
      {children}
    </CinematicFadeSlide>
  );
}

const styles = StyleSheet.create({
  embeddedCalendar: { marginTop: 0 },
  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  calendarSectionTitle: { fontSize: 17 },
  calendarCard: {
    borderRadius: 19,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  canonicalCalendarVerticalInsets: {
    paddingTop: 18,
    paddingBottom: 18,
  },
  profileCalendarInsets: { paddingTop: 26, paddingBottom: 16 },
  profileCalendarNav: { marginBottom: 6 },
  profileWeekRow: { marginTop: 20 },
  outlinedCalendarCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  calendarNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 14,
  },
  canonicalEmbeddedNavButton: { height: 18 },
  navBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", minWidth: 100, textAlign: "center" },
  embeddedMonthLabel: { fontSize: 13 },
  canonicalEmbeddedMonthLabel: { lineHeight: 18 },
  weekRow: {
    flexDirection: "row",
    marginBottom: 6,
    marginHorizontal: -4,
  },
  embeddedWeekRow: {
    marginTop: 10,
    marginHorizontal: -4,
  },
  weekLabel: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    marginHorizontal: -4,
  },
  embeddedDaysGrid: {
    marginHorizontal: -4,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
  },
  embeddedDayCell: {
    paddingVertical: 7,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: { fontFamily: "Manrope", fontSize: 15, fontWeight: "500" },
  embeddedDayNum: {
    fontSize: 17,
  },
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
  embeddedDateSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 4,
    marginBottom: 16,
  },
  embeddedDateLabelWithCount: { marginBottom: 0 },
  embeddedCompletedCount: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
    color: CARD_TEXT_BELOW,
  },
  embeddedEmptyText: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 22,
    fontWeight: "600",
    color: "#AAAAC4",
  },
  embeddedEntryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 72,
    paddingVertical: 4,
  },
  embeddedEntryRowAtCardEdge: {
    paddingBottom: 0,
  },
  embeddedEntryImageWrap: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  embeddedEntryDuration: {
    position: "absolute",
    left: 5,
    bottom: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  embeddedEntryDurationText: {
    fontSize: 9,
  },
  embeddedEntryCopy: {
    flex: 1,
    gap: 5,
  },
  embeddedEntryCategory: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "550" as any,
  },
  embeddedEntryTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  entryThumb: {
    width: 85,
    height: 85,
    borderRadius: 14,
  },
  entryTime: { fontFamily: "Manrope", fontSize: 11, marginBottom: 5 },
  entryTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700" },
  entryAuthor: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginTop: 4,
  },
});
