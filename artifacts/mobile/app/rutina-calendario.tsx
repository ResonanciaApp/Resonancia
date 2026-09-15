import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { RoutineCompletionBanner } from "@/components/RoutineCompletionBanner";
import {
  getRoutineActivityCategory,
  getRoutineDateKey,
  getRoutineOccurrenceKey,
  hasRoutineDateEntry,
  isRoutineActivityScheduledForDate,
  useRutina,
  type RoutineActivity,
} from "@/context/RutinaContext";
import { useDayRollover } from "@/hooks/useDayRollover";
import { useRoutineTheme } from "@/hooks/useRoutineTheme";
import {
  RoutineCompletionBannerProvider,
  useRoutineCompletionBanner,
} from "@/context/RoutineCompletionBannerContext";
import {
  consumeRoutineAdditionTransition,
  consumeRoutineCompletionTransition,
} from "@/lib/routineCompletionTransition";
import { claimRoutineCompletion } from "@/lib/routineCompletionQueue";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

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

function statusFor(activity: RoutineActivity, dateKey: string, occurrenceIndex: number) {
  const occurrenceKey = getRoutineOccurrenceKey(dateKey, occurrenceIndex);
  if (activity.completedDates.includes(occurrenceKey)) return "completed" as const;
  if (activity.skippedDates.includes(occurrenceKey)) return "skipped" as const;
  return "pending" as const;
}

function CalendarActivityRow({
  activity,
  dateKey,
  occurrenceIndex,
  completionToken,
  onComplete,
}: {
  activity: RoutineActivity;
  dateKey: string;
  occurrenceIndex: number;
  completionToken: number;
  onComplete: () => void;
}) {
  const routineTheme = useRoutineTheme();
  const { toggleActivity } = useRutina();
  const status = statusFor(activity, dateKey, occurrenceIndex);
  const completed = status === "completed";
  const skipped = status === "skipped";
  const category = getRoutineActivityCategory(activity);
  const completionProgress = useSharedValue(0);
  useEffect(() => {
    if (!completionToken) return;
    completionProgress.value = 0;
    completionProgress.value = withTiming(1, { duration: 500 });
  }, [completionProgress, completionToken]);
  const completionOverlayStyle = useAnimatedStyle(() => ({
    opacity: completionProgress.value,
  }));
  const confirmUncheck = () => {
    Alert.alert(
      "¿Estás seguro que quieres desmarcar tu tarea?",
      "Puede afectar tu racha.",
      [
        { text: "Mejor no", style: "cancel" },
        {
          text: "Sí, seguro",
          style: "destructive",
          onPress: () => toggleActivity(activity.id, dateKey, occurrenceIndex),
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={
        completed
          ? undefined
          : () => router.push(`/rutina/${activity.id}?dateKey=${dateKey}&occurrence=${occurrenceIndex}&from=calendar` as never)
      }
      accessibilityRole="button"
      accessibilityLabel={`${activity.title}, ${
        completed ? "completada" : skipped ? "saltada" : "pendiente"
      }`}
      style={({ pressed }) => [
        styles.activityRow,
        {
          backgroundColor: "rgba(0,0,0,0.28)",
          opacity: pressed && !completed ? 0.72 : 1,
        },
      ]}
    >
      <Reanimated.View
        pointerEvents="none"
        style={[styles.completionOverlay, completionOverlayStyle]}
      />
      <View style={styles.activityCopy}>
        {category ? (
          <Text style={[styles.category, { color: "#B5B5B5" }]}>
            {category}
          </Text>
        ) : null}
        <Text
          numberOfLines={2}
          style={[
            styles.activityTitle,
            {
              color: completed ? "#B5B5B5" : routineTheme.text,
              textDecorationLine: completed ? "line-through" : "none",
            },
          ]}
        >
          {activity.title}
          {activity.timesPerDay > 1 ? ` · ${occurrenceIndex + 1}/${activity.timesPerDay}` : ""}
        </Text>
        <View style={styles.repeatRow}>
          <Feather name="repeat" size={12} color="#B5B5B5" />
          <Text style={[styles.repeatText, { color: "#B5B5B5" }]}>
             {activity.repeatEnabled
               ? activity.timesPerDay === 1
                 ? "Cada día"
                 : `${activity.timesPerDay} veces al día`
               : "No se repite"}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={(event) => {
          event.stopPropagation();
          if (completed) {
            confirmUncheck();
          } else if (!skipped) {
            onComplete();
          }
        }}
        disabled={skipped}
        accessibilityRole="button"
        accessibilityLabel={
          completed
            ? `Desmarcar ${activity.title}`
            : skipped
              ? `${activity.title} saltada`
              : `Completar ${activity.title}`
        }
        hitSlop={8}
        style={[
          styles.stateSquare,
          {
            backgroundColor: completed
              ? "#F9F9F9"
              : "rgba(255,255,255,0.1)",
            borderColor: completed
              ? "#F9F9F9"
              : "rgba(255,255,255,0.1)",
          },
        ]}
      >
        <Feather
          name={completed || !skipped ? "check" : "minus"}
          size={19}
          color={
            completed
              ? "#060A0F"
              : "#F9F9F9"
          }
        />
      </Pressable>
    </Pressable>
  );
}

function RutinaCalendarioScreenContent() {
  const insets = useSafeAreaInsets();
  const routineTheme = useRoutineTheme();
  const { height: screenHeight } = useWindowDimensions();
  const { announceActivityAdded, announceCompletion } = useRoutineCompletionBanner();
  const todayKey = useDayRollover();
  const today = useMemo(() => new Date(), [todayKey]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [completionTokens, setCompletionTokens] = useState<Record<string, number>>({});
  const {
    activities,
    acknowledgeLastAdded,
    clearCompletedActivitiesForDate,
    completeActivity,
    isHydrated,
  } = useRutina();
  const selectedKey = getRoutineDateKey(selectedDate);
  const isFutureDate = selectedKey > todayKey;
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 18);
  useFocusEffect(
    useCallback(() => {
      const addedActivityId = consumeRoutineAdditionTransition();
      if (addedActivityId) {
        announceActivityAdded();
        acknowledgeLastAdded(addedActivityId);
      }
      const transition = consumeRoutineCompletionTransition();
      if (!transition || transition.dateKey !== selectedKey) return;
      const itemId = `${transition.activityId}::${transition.occurrenceIndex}`;
      setCompletionTokens((current) => ({
        ...current,
        [itemId]: transition.token,
      }));
    }, [
      acknowledgeLastAdded,
      announceActivityAdded,
      selectedKey,
    ]),
  );
  const weekStart = useMemo(() => startOfWeek(today), [today]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const scheduledForDate = useMemo(
    () =>
      activities.flatMap((activity) => {
        const explicitlyTracked =
          hasRoutineDateEntry(activity.completedDates, selectedKey) ||
          hasRoutineDateEntry(activity.skippedDates, selectedKey);
        if (!explicitlyTracked && !isRoutineActivityScheduledForDate(activity, selectedDate)) {
          return [];
        }
        return Array.from({ length: activity.timesPerDay }, (_, occurrenceIndex) => ({
          activity,
          occurrenceIndex,
          itemId: `${activity.id}::${occurrenceIndex}`,
        })).filter(({ occurrenceIndex }) =>
          !activity.deletedDates.includes(
            getRoutineOccurrenceKey(selectedKey, occurrenceIndex),
          ),
        );
      }),
    [activities, selectedDate, selectedKey],
  );
  const historyForDate = useMemo(
    () =>
      scheduledForDate.filter(({ activity, occurrenceIndex }) => {
        const occurrenceKey = getRoutineOccurrenceKey(selectedKey, occurrenceIndex);
        return (
          activity.completedDates.includes(occurrenceKey) ||
          activity.skippedDates.includes(occurrenceKey)
        );
      }),
    [scheduledForDate, selectedKey],
  );
  const completedCount = historyForDate.filter(({ activity, occurrenceIndex }) =>
    activity.completedDates.includes(getRoutineOccurrenceKey(selectedKey, occurrenceIndex)),
  ).length;
  const completedCountRef = useRef(completedCount);
  const handledCompletionKeysRef = useRef(new Set<string>());
  useEffect(() => {
    completedCountRef.current = completedCount;
  }, [completedCount, selectedKey]);
  useEffect(() => {
    handledCompletionKeysRef.current.clear();
  }, [activities, selectedKey]);
  const handleComplete = useCallback(
    (activityId: string, occurrenceIndex: number, itemId: string) => {
      if (isFutureDate) return;
      const completionKey = `${selectedKey}:${itemId}`;
      if (!claimRoutineCompletion(handledCompletionKeysRef.current, completionKey)) return;
      const previousCount = completedCountRef.current;
      const nextCount = previousCount + 1;
      completedCountRef.current = nextCount;
      completeActivity(activityId, selectedKey, occurrenceIndex);
      setCompletionTokens((current) => ({
        ...current,
        [itemId]: (current[itemId] ?? 0) + 1,
      }));
      announceCompletion(previousCount, nextCount);
    },
    [announceCompletion, completeActivity, isFutureDate, selectedKey],
  );
  const visibleActivities = scheduledForDate;
  const handleClearCompleted = useCallback(() => {
    Alert.alert(
      "¿Estás seguro de borrar todas las tareas completadas?",
      undefined,
      [
        {
          text: "No borrar",
          style: "cancel",
        },
        {
          text: "Sí, borrar",
          style: "destructive",
          onPress: () => clearCompletedActivitiesForDate(selectedKey),
        },
      ],
    );
  }, [clearCompletedActivitiesForDate, selectedKey]);

  return (
    <View style={[styles.root, { backgroundColor: routineTheme.background }]}>
      <StatusBar hidden />
      <SacredBackground variant="gradient" />
      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={styles.stickyHeader}
        >
          <View pointerEvents="none" style={styles.stickyBackgroundClip}>
            <View style={{ height: screenHeight }}>
              <SacredBackground variant="gradient" />
            </View>
          </View>
          <View style={{ paddingTop: topPad }}>
            <View style={styles.header}>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                hitSlop={12}
                style={styles.backButton}
              >
                <Feather name="chevron-left" size={26} color="#F9F9F9" />
              </Pressable>
              <Text
                pointerEvents="none"
                style={[styles.headerDate, { color: routineTheme.text }]}
              >
                {selectedDateLabel(selectedDate, todayKey)}
              </Text>
              <Pressable
                onPress={handleClearCompleted}
                accessibilityRole="button"
                accessibilityLabel="Borrar todas las tareas completadas"
                hitSlop={10}
              >
                <Text style={styles.clearCompleted}>Borrar todo</Text>
              </Pressable>
            </View>

            <View style={styles.daysRow}>
              {weekDays.map((date, index) => {
                const dateKey = getRoutineDateKey(date);
                const selected = dateKey === selectedKey;
                const isToday = dateKey === todayKey;
                const hasCompletion = activities.some((activity) =>
                  hasRoutineDateEntry(activity.completedDates, dateKey),
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
                        {
                          color: "#B5B5B5",
                          opacity: 1,
                        },
                      ]}
                    >
                      {DAY_LABELS[index]}
                    </Text>
                    <View
                      style={[
                        styles.dayCircle,
                        {
                          backgroundColor: selected
                            ? "#F9F9F9"
                            : "rgba(0,0,0,0.28)",
                          borderColor:
                            isToday && !selected
                              ? "#FFFFFF"
                              : selected
                                ? "#F9F9F9"
                                : routineTheme.divider,
                          borderWidth: isToday && !selected ? 1 : StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          {
                            color: selected
                              ? "#060A0F"
                              : routineTheme.text,
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
          </View>
        </View>

        {scheduledForDate.length > 0 && (
          <Text style={[styles.progressTitle, { color: routineTheme.text }]}>
            {completedCount} / {scheduledForDate.length} completadas
          </Text>
        )}

        {!isHydrated ? null : visibleActivities.length ? (
          <View style={styles.activityList}>
            {visibleActivities.map(({ activity, occurrenceIndex, itemId }) => (
              <CalendarActivityRow
                key={itemId}
                activity={activity}
                dateKey={selectedKey}
                occurrenceIndex={occurrenceIndex}
                completionToken={completionTokens[itemId] ?? 0}
                onComplete={() => handleComplete(activity.id, occurrenceIndex, itemId)}
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
              No hay tareas programadas
            </Text>
            <Text style={[styles.emptyText, { color: routineTheme.textMuted }]}>
              Añade una actividad o elige otro día de la semana.
            </Text>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/crear-rutina?from=calendar" as never)}
        accessibilityRole="button"
        accessibilityLabel="Añadir una actividad a Mi Rutina"
        style={({ pressed }) => [
          styles.addActivity,
          {
            bottom: bottomPad + 38,
            backgroundColor: "#276FC2",
            opacity: pressed ? 0.78 : 1,
          },
        ]}
      >
        <Feather name="plus" size={19} color="#FFFFFF" />
        <Text style={styles.addActivityText}>Añadir actividad</Text>
      </Pressable>
      <RoutineCompletionBanner
        bottom={bottomPad + 22}
        backgroundColor="#0E0821"
        visible
        enteredOffset={35}
      />
    </View>
  );
}

export default function RutinaCalendarioScreen() {
  return (
    <RoutineCompletionBannerProvider>
      <RutinaCalendarioScreenContent />
    </RoutineCompletionBannerProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 16,
  },
  stickyHeader: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  stickyBackgroundClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  clearCompleted: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
    color: "#F0F0F0",
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
    width: 37,
    height: 37,
    borderRadius: 18.5,
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
    marginHorizontal: -16,
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
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#276FC2",
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
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    marginTop: 30,
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
    height: 47,
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