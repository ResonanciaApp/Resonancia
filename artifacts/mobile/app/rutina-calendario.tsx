import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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
import {
  getRoutineDateKey,
  isRoutineActivityScheduledForDate,
  useRutina,
  type RoutineActivity,
} from "@/context/RutinaContext";
import { useDayRollover } from "@/hooks/useDayRollover";
import { useRoutineTheme } from "@/hooks/useRoutineTheme";

const DAY_LABELS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"] as const;

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  next.setHours(12, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const weekday = start.getDay() === 0 ? 6 : start.getDay() - 1;
  start.setDate(start.getDate() - weekday);
  start.setHours(12, 0, 0, 0);
  return start;
}

function shortMonth(date: Date): string {
  return new Intl.DateTimeFormat("es", { month: "short" })
    .format(date)
    .replace(".", "");
}

function selectedDateLabel(date: Date, todayKey: string): string {
  const prefix = getRoutineDateKey(date) === todayKey ? "Hoy, " : "";
  return `${prefix}${shortMonth(date)} ${date.getDate()}`;
}

function statusFor(activity: RoutineActivity, dateKey: string) {
  if (activity.completedDates.includes(dateKey)) return "completed" as const;
  if (activity.skippedDates.includes(dateKey)) return "skipped" as const;
  return "pending" as const;
}

function CalendarActivityRow({
  activity,
  dateKey,
}: {
  activity: RoutineActivity;
  dateKey: string;
}) {
  const routineTheme = useRoutineTheme();
  const status = statusFor(activity, dateKey);
  const completed = status === "completed";
  const skipped = status === "skipped";

  return (
    <Pressable
      onPress={() => router.push(`/rutina/${activity.id}?dateKey=${dateKey}` as never)}
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}, ${
        completed ? "completada" : skipped ? "saltada" : "pendiente"
      }`}
      style={({ pressed }) => [
        styles.activityRow,
        {
          backgroundColor: routineTheme.surface,
          borderColor: routineTheme.divider,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <View style={styles.activityCopy}>
        <Text style={[styles.category, { color: routineTheme.accent }]}>
          {activity.category}
        </Text>
        <Text
          numberOfLines={2}
          style={[
            styles.activityTitle,
            {
              color: completed ? routineTheme.textMuted : routineTheme.text,
              textDecorationLine: completed ? "line-through" : "none",
            },
          ]}
        >
          {activity.title}
        </Text>
        <View style={styles.repeatRow}>
          <Feather name="repeat" size={12} color={routineTheme.textMuted} />
          <Text style={[styles.repeatText, { color: routineTheme.textMuted }]}>
            {activity.repeatDays.length === 7 ? "Cada día" : "Días seleccionados"}
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.stateSquare,
          {
            backgroundColor: completed
              ? routineTheme.completion
              : skipped
                ? routineTheme.surfaceElevated
                : routineTheme.ticketSurface,
            borderColor: completed ? routineTheme.completion : routineTheme.divider,
          },
        ]}
      >
        <Feather
          name={completed ? "check" : skipped ? "minus" : "clock"}
          size={19}
          color={
            completed
              ? "#FFFFFF"
              : skipped
                ? routineTheme.textMuted
                : routineTheme.accent
          }
        />
      </View>
    </Pressable>
  );
}

export default function RutinaCalendarioScreen() {
  const insets = useSafeAreaInsets();
  const routineTheme = useRoutineTheme();
  const todayKey = useDayRollover();
  const today = useMemo(() => new Date(), [todayKey]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [showAll, setShowAll] = useState(false);
  const { activities, isHydrated } = useRutina();
  const selectedKey = getRoutineDateKey(selectedDate);
  const isFutureDate = selectedKey > todayKey;
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 18);
  const weekStart = useMemo(() => startOfWeek(today), [today]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const scheduledForDate = useMemo(
    () =>
      activities.filter((activity) => {
        const explicitlyTracked =
          activity.completedDates.includes(selectedKey) ||
          activity.skippedDates.includes(selectedKey);
        return explicitlyTracked || isRoutineActivityScheduledForDate(activity, selectedDate);
      }),
    [activities, selectedDate, selectedKey],
  );
  const historyForDate = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.completedDates.includes(selectedKey) ||
          activity.skippedDates.includes(selectedKey),
      ),
    [activities, selectedKey],
  );
  const completedCount = historyForDate.filter((activity) =>
    activity.completedDates.includes(selectedKey),
  ).length;
  const visibleActivities = showAll
    ? historyForDate
    : historyForDate.filter((activity) => activity.completedDates.includes(selectedKey));

  return (
    <View style={[styles.root, { backgroundColor: routineTheme.background }]}>
      <StatusBar hidden />
      <SacredBackground variant="solid" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad, paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            hitSlop={12}
          >
            <Feather name="arrow-left" size={23} color={routineTheme.text} />
          </Pressable>
          <Text
            pointerEvents="none"
            style={[styles.headerDate, { color: routineTheme.text }]}
          >
            {selectedDateLabel(selectedDate, todayKey)}
          </Text>
          <Pressable
            onPress={() => setShowAll((current) => !current)}
            accessibilityRole="button"
            accessibilityState={{ selected: showAll }}
          >
            <Text style={[styles.showAll, { color: routineTheme.completion }]}>
              {showAll ? "Solo completadas" : "Mostrar todo"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.daysRow}>
          {weekDays.map((date, index) => {
            const dateKey = getRoutineDateKey(date);
            const selected = dateKey === selectedKey;
            const isPast = dateKey < todayKey;
            const isFuture = dateKey > todayKey;
            const hasCompletion = activities.some((activity) =>
              activity.completedDates.includes(dateKey),
            );
            return (
              <Pressable
                key={dateKey}
                onPress={() => setSelectedDate(date)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${DAY_LABELS[index]} ${date.getDate()} de ${shortMonth(date)}${
                  hasCompletion ? ", con tareas completadas" : ""
                }`}
                style={styles.dayColumn}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    { color: routineTheme.accent },
                  ]}
                >
                  {DAY_LABELS[index]}
                </Text>
                <View
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: selected
                        ? routineTheme.completion
                        : isFuture
                          ? "rgba(41,139,115,0.20)"
                        : hasCompletion
                          ? routineTheme.completionSoft
                          : routineTheme.surface,
                      borderColor: selected ? routineTheme.completion : routineTheme.divider,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      {
                        color: selected
                          ? "#FFFFFF"
                          : isFuture
                            ? routineTheme.completion
                            : isPast
                              ? routineTheme.accent
                              : routineTheme.text,
                        opacity: isFuture && !selected ? 0.9 : 1,
                      },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.divider, { backgroundColor: routineTheme.divider }]} />

        {!isFutureDate && (
          <Text style={[styles.progressTitle, { color: routineTheme.text }]}>
            {completedCount} / {scheduledForDate.length} completadas
          </Text>
        )}

        {!isHydrated ? null : visibleActivities.length ? (
          <View style={styles.activityList}>
            {visibleActivities.map((activity) => (
              <CalendarActivityRow
                key={activity.id}
                activity={activity}
                dateKey={selectedKey}
              />
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: routineTheme.surface, borderColor: routineTheme.divider },
            ]}
          >
            <Feather
              name={scheduledForDate.length ? "check-circle" : "calendar"}
              size={24}
              color={routineTheme.accent}
            />
            <Text style={[styles.emptyTitle, { color: routineTheme.text }]}>
              {scheduledForDate.length
                ? "Aún no hay tareas completadas"
                : "No hay tareas programadas"}
            </Text>
            <Text style={[styles.emptyText, { color: routineTheme.textMuted }]}>
              {scheduledForDate.length
                ? "Usa “Mostrar todo” para consultar también las tareas saltadas."
                : "Añade una actividad o elige otro día de la semana."}
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/crear-rutina" as never)}
        accessibilityRole="button"
        accessibilityLabel="Añadir una actividad a Mi Rutina"
        style={({ pressed }) => [
          styles.addActivity,
          {
            bottom: bottomPad + 18,
            backgroundColor: routineTheme.completion,
            opacity: pressed ? 0.78 : 1,
          },
        ]}
      >
        <Feather name="plus" size={19} color="#FFFFFF" />
        <Text style={styles.addActivityText}>Añadir actividad</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  headerDate: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
  showAll: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  dayColumn: {
    width: 42,
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
  },
  dayCircle: {
    width: 39,
    height: 39,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -20,
    marginTop: 22,
  },
  progressTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 16,
  },
  activityList: {
    gap: 10,
  },
  activityRow: {
    minHeight: 98,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  activityCopy: {
    flex: 1,
    minWidth: 0,
  },
  category: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  repeatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  repeatText: {
    fontFamily: "Manrope",
    fontSize: 11,
  },
  stateSquare: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    minHeight: 150,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },
  emptyText: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 5,
  },
  addActivity: {
    position: "absolute",
    right: 20,
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },
  addActivityText: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});