import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  interpolateColor,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  getRoutineDateKey,
  isRoutineActivityScheduledForDate,
  useRutina,
  type RoutineActivity,
} from "@/context/RutinaContext";
import { useColors } from "@/hooks/useColors";
import { useDayRollover } from "@/hooks/useDayRollover";
import { useRoutineTheme } from "@/hooks/useRoutineTheme";

type Props = {
  style?: StyleProp<ViewStyle>;
};

const ROUTINE_CARD_HEIGHT = 74;
const ROUTINE_CARD_GAP = 9;
const ROUTINE_SLOT_HEIGHT = ROUTINE_CARD_HEIGHT + ROUTINE_CARD_GAP;
const COMPLETION_EXIT_DELAY = 1000;
const TOAST_DURATION = 2400;
const HANDLE_COLOR = "#7F7F7F";

const ActivityRow = React.memo(function ActivityRow({
  activity,
  initialIndex,
  completing,
  itemCount,
  orderSV,
  draggingId,
  dragOriginSlot,
  dragDeltaY,
  insertAt,
  onOpen,
  onComplete,
  onDragEnd,
}: {
  activity: RoutineActivity;
  completing: boolean;
  itemCount: number;
  orderSV: SharedValue<string[]>;
  draggingId: SharedValue<string>;
  dragOriginSlot: SharedValue<number>;
  dragDeltaY: SharedValue<number>;
  insertAt: SharedValue<number>;
  initialIndex: number;
  onOpen: (activityId: string) => void;
  onComplete: (activity: RoutineActivity) => void;
  onDragEnd: (from: number, to: number) => void;
}) {
  const routineTheme = useRoutineTheme();
  const completionProgress = useSharedValue(completing ? 1 : 0);
  const didActivate = useSharedValue(0);
  const activityId = activity.id;
  const sharedOrder = orderSV;
  const sharedDraggingId = draggingId;
  const sharedDragOriginSlot = dragOriginSlot;
  const sharedDragDeltaY = dragDeltaY;
  const sharedInsertAt = insertAt;
  const settledY = useSharedValue(initialIndex * ROUTINE_SLOT_HEIGHT);

  useEffect(() => {
    completionProgress.value = withTiming(completing ? 1 : 0, { duration: 450 });
  }, [completing, completionProgress]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(250)
        .onStart(() => {
          didActivate.value = 1;
          const slot = sharedOrder.value.indexOf(activityId);
          sharedDragOriginSlot.value = slot;
          sharedDragDeltaY.value = 0;
          sharedInsertAt.value = slot;
          sharedDraggingId.value = activityId;
        })
        .onUpdate((event) => {
          if (didActivate.value !== 1) return;
          sharedDragDeltaY.value = event.translationY;
          const rawSlot = Math.round(
            (sharedDragOriginSlot.value * ROUTINE_SLOT_HEIGHT + event.translationY) /
              ROUTINE_SLOT_HEIGHT,
          );
          const nextSlot = Math.max(0, Math.min(itemCount - 1, rawSlot));
          if (sharedInsertAt.value !== nextSlot) sharedInsertAt.value = nextSlot;
        })
        .onFinalize(() => {
          if (didActivate.value !== 1) return;
          didActivate.value = 0;
          const from = sharedDragOriginSlot.value;
          const to = sharedInsertAt.value;
          const nextOrder = [...sharedOrder.value];
          const [moved] = nextOrder.splice(from, 1);
          if (moved) nextOrder.splice(to, 0, moved);
          sharedOrder.value = nextOrder;
          sharedDraggingId.value = "";
          sharedDragDeltaY.value = 0;
          sharedDragOriginSlot.value = -1;
          sharedInsertAt.value = -1;
          runOnJS(onDragEnd)(from, to);
        }),
    [
      activityId,
      didActivate,
      itemCount,
      onDragEnd,
      sharedDragDeltaY,
      sharedDraggingId,
      sharedDragOriginSlot,
      sharedInsertAt,
      sharedOrder,
    ],
  );

  useAnimatedReaction(
    () => {
      const ownSlot = sharedOrder.value.indexOf(activityId);
      const origin = sharedDragOriginSlot.value;
      const destination = sharedInsertAt.value;
      let effectiveSlot = ownSlot;
      if (sharedDraggingId.value !== "" && origin >= 0 && destination >= 0) {
        if (destination <= origin) {
          if (ownSlot >= destination && ownSlot < origin) effectiveSlot = ownSlot + 1;
        } else if (ownSlot > origin && ownSlot <= destination) {
          effectiveSlot = ownSlot - 1;
        }
      }
      return {
        target: Math.max(0, effectiveSlot) * ROUTINE_SLOT_HEIGHT,
        dragging: sharedDraggingId.value === activityId,
      };
    },
    (current, previous) => {
      if (current.dragging) return;
      if (
        previous === null ||
        previous.dragging ||
        previous.target !== current.target
      ) {
        settledY.value = withTiming(current.target, { duration: 180 });
      }
    },
    [activityId],
  );

  const positionStyle = useAnimatedStyle(() => {
    const isDragging = sharedDraggingId.value === activityId;
    if (isDragging) {
      return {
        transform: [
          {
            translateY:
              sharedDragOriginSlot.value * ROUTINE_SLOT_HEIGHT +
              sharedDragDeltaY.value,
          },
        ],
        zIndex: 50,
        shadowOpacity: 0.24,
      };
    }

    return {
      transform: [{ translateY: settledY.value }],
      zIndex: 1,
      shadowOpacity: 0,
    };
  });

  const completionStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      completionProgress.value,
      [0, 1],
      [routineTheme.surface, routineTheme.completion],
    ),
  }));

  const completeFromTicket = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      if (!completing) onComplete(activity);
    },
    [activity, completing, onComplete],
  );

  return (
    <Reanimated.View
      style={[styles.activitySlot, positionStyle]}
      testID={`routine-activity-${activity.id}`}
    >
      <GestureDetector gesture={pan}>
        <Reanimated.View style={[styles.activityCard, completionStyle]}>
          <Pressable
            onPress={() => onOpen(activityId)}
            disabled={completing}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${activity.title}`}
            style={styles.activityOpenArea}
          >
            <Feather name="more-vertical" size={18} color={HANDLE_COLOR} />
            <View style={styles.activityCopy}>
              <Text
                style={[
                  styles.activityCategory,
                  { color: completing ? "rgba(255,255,255,0.78)" : routineTheme.accent },
                ]}
                numberOfLines={1}
              >
                {activity.category}
              </Text>
              <Text
                style={[
                  styles.activityTitle,
                  { color: completing ? "#FFFFFF" : routineTheme.text },
                ]}
                numberOfLines={2}
              >
                {activity.title}
              </Text>
            </View>
          </Pressable>
          <Pressable
            onPress={completeFromTicket}
            disabled={completing}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: completing }}
            accessibilityLabel={`Completar ${activity.title}`}
            testID={`routine-toggle-${activity.id}`}
            hitSlop={10}
            style={({ pressed }) => [
              styles.checkButton,
              {
                backgroundColor: completing
                  ? "rgba(255,255,255,0.92)"
                  : "transparent",
                opacity: pressed ? 0.58 : 1,
              },
            ]}
          >
            {!completing ? (
              <Feather name="check" size={20} color="#F9F9F9" />
            ) : null}
          </Pressable>
        </Reanimated.View>
      </GestureDetector>
    </Reanimated.View>
  );
});

export function MiRutinaSection({ style }: Props) {
  const colors = useColors();
  const routineTheme = useRoutineTheme();
  const todayKey = useDayRollover();
  const {
    activities,
    isHydrated,
    lastAddedId,
    completeActivity,
    reorderActivities,
  } = useRutina();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
  const completingIdsRef = useRef<Set<string>>(new Set());
  const lastSeenAddedId = useRef<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const today = useMemo(() => new Date(), [todayKey]);
  const dateKey = getRoutineDateKey(today);
  const todayActivities = useMemo(
    () =>
      activities.filter((activity) => {
        if (!isRoutineActivityScheduledForDate(activity, today)) return false;
        if (completingIds.has(activity.id)) return true;
        return (
          !activity.completedDates.includes(dateKey) &&
          !activity.skippedDates.includes(dateKey)
        );
      }),
    [activities, completingIds, dateKey, today],
  );
  const todayActivityIds = useMemo(
    () => todayActivities.map((activity) => activity.id),
    [todayActivities],
  );
  const todayActivityIdsKey = todayActivityIds.join(",");
  const orderSV = useSharedValue<string[]>(todayActivityIds);
  const draggingId = useSharedValue("");
  const dragOriginSlot = useSharedValue(-1);
  const dragDeltaY = useSharedValue(0);
  const insertAt = useSharedValue(-1);
  const previousActivityIdsKey = useRef(todayActivityIdsKey);

  useEffect(() => {
    if (previousActivityIdsKey.current === todayActivityIdsKey) return;
    previousActivityIdsKey.current = todayActivityIdsKey;
    const currentOrder = orderSV.value;
    const mergedOrder = currentOrder.filter((id) => todayActivityIds.includes(id));
    todayActivityIds.forEach((id) => {
      if (!mergedOrder.includes(id)) mergedOrder.push(id);
    });
    orderSV.value = mergedOrder;
  }, [orderSV, todayActivityIds, todayActivityIdsKey]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      exitTimersRef.current.forEach(clearTimeout);
      exitTimersRef.current.clear();
    },
    [],
  );

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!lastAddedId || lastSeenAddedId.current === lastAddedId) return;
      lastSeenAddedId.current = lastAddedId;
      showToast("Actividad añadida");
    }, [lastAddedId, showToast]),
  );

  useFocusEffect(
    useCallback(
      () => () => {
        if (toastTimerRef.current) {
          clearTimeout(toastTimerRef.current);
          toastTimerRef.current = null;
        }
        exitTimersRef.current.forEach(clearTimeout);
        exitTimersRef.current.clear();
        completingIdsRef.current = new Set();
        setCompletingIds(new Set());
        setToastMessage(null);
      },
      [],
    ),
  );

  const openCreate = useCallback(() => {
    router.push("/crear-rutina" as never);
  }, []);

  const openCalendar = useCallback(() => {
    router.push("/rutina-calendario" as never);
  }, []);

  const openActivity = useCallback(
    (activityId: string) => {
      router.push(`/rutina/${activityId}?dateKey=${dateKey}` as never);
    },
    [dateKey],
  );

  const handleComplete = useCallback(
    (activity: RoutineActivity) => {
      if (completingIdsRef.current.has(activity.id)) return;
      const nextCompleting = new Set(completingIdsRef.current);
      nextCompleting.add(activity.id);
      completingIdsRef.current = nextCompleting;
      completeActivity(activity.id, dateKey);
      setCompletingIds(nextCompleting);
      showToast("Actividad finalizada");
      const existingTimer = exitTimersRef.current.get(activity.id);
      if (existingTimer) clearTimeout(existingTimer);
      exitTimersRef.current.set(
        activity.id,
        setTimeout(() => {
          const next = new Set(completingIdsRef.current);
          next.delete(activity.id);
          completingIdsRef.current = next;
          setCompletingIds(next);
          exitTimersRef.current.delete(activity.id);
        }, COMPLETION_EXIT_DELAY),
      );
    },
    [completeActivity, dateKey, showToast],
  );

  const todayActivityIdsRef = useRef(todayActivityIds);
  todayActivityIdsRef.current = todayActivityIds;

  const handleDragEnd = useCallback(
    (from: number, to: number) => {
      const currentIds = todayActivityIdsRef.current;
      if (
        from < 0 ||
        to < 0 ||
        from >= currentIds.length ||
        to >= currentIds.length ||
        from === to
      ) {
        return;
      }
      const reorderedIds = [...currentIds];
      const [movedId] = reorderedIds.splice(from, 1);
      if (!movedId) return;
      reorderedIds.splice(to, 0, movedId);
      reorderActivities(reorderedIds);
    },
    [reorderActivities],
  );

  const hasScheduledToday = activities.some((activity) =>
    isRoutineActivityScheduledForDate(activity, today),
  );

  return (
    <View style={[styles.section, style]} testID="mi-rutina-section">
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mi rutina</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={openCalendar}
            accessibilityRole="button"
            accessibilityLabel="Abrir calendario de Mi Rutina"
            testID="mi-rutina-calendar"
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.58 : 1 })}
          >
            <Feather name="calendar" size={19} color={routineTheme.accent} />
          </Pressable>
          <Pressable
            onPress={openCreate}
            accessibilityRole="button"
            accessibilityLabel="Añadir una actividad a Mi rutina"
            testID="mi-rutina-add-header"
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.58 : 1 })}
          >
            <Feather name="plus" size={25} color="#F9F9F9" />
          </Pressable>
        </View>
      </View>

      {!isHydrated ? null : todayActivities.length > 0 ? (
        <View
          style={[
            styles.activityList,
            { height: todayActivities.length * ROUTINE_SLOT_HEIGHT },
          ]}
        >
          {todayActivities.map((activity, index) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              initialIndex={index}
              completing={completingIds.has(activity.id)}
              itemCount={todayActivities.length}
              orderSV={orderSV}
              draggingId={draggingId}
              dragOriginSlot={dragOriginSlot}
              dragDeltaY={dragDeltaY}
              insertAt={insertAt}
              onOpen={openActivity}
              onComplete={handleComplete}
              onDragEnd={handleDragEnd}
            />
          ))}
        </View>
      ) : hasScheduledToday ? (
        <Pressable
          onPress={openCalendar}
          style={[
            styles.completeState,
            {
              backgroundColor: routineTheme.completionSoft,
              borderColor: routineTheme.completion,
            },
          ]}
        >
          <View style={[styles.completeIcon, { backgroundColor: routineTheme.completion }]}>
            <Feather name="check" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.emptyCopy}>
            <Text style={[styles.completeTitle, { color: routineTheme.text }]}>
              Rutina del día completada
            </Text>
            <Text style={[styles.emptySubtitle, { color: routineTheme.textMuted }]}>
              Revisa tu progreso en el calendario.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={routineTheme.accent} />
        </Pressable>
      ) : null}

      <Pressable
        onPress={openCreate}
        accessibilityRole="button"
        accessibilityLabel="Añadir una actividad"
        testID="mi-rutina-add-button"
        style={({ pressed }) => [
          styles.addButton,
          {
            borderColor: "rgba(249,249,249,0.5)",
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <Feather name="plus" size={20} color="#F9F9F9" />
        <Text style={[styles.addButtonText, { color: "#F9F9F9" }]}>
          Añadir una actividad
        </Text>
      </Pressable>

      {toastMessage ? (
        <View
          style={[
            styles.toast,
            {
              backgroundColor: routineTheme.surfaceElevated,
              borderColor: routineTheme.divider,
            },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.toastIcon, { backgroundColor: routineTheme.completion }]}>
            <Feather name="check" size={14} color="#FFFFFF" />
          </View>
          <Text style={[styles.toastText, { color: routineTheme.text }]}>{toastMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 14,
    marginBottom: 53,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  title: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
    paddingLeft: 12,
  },
  activityList: {
    position: "relative",
  },
  activitySlot: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ROUTINE_CARD_HEIGHT,
    shadowColor: "#000000",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  activityCard: {
    height: ROUTINE_CARD_HEIGHT,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 11,
    overflow: "hidden",
  },
  activityOpenArea: {
    flex: 1,
    height: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  activityCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  activityCategory: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.25,
    marginBottom: 2,
  },
  activityTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  checkButton: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  completeState: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  completeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCopy: {
    flex: 1,
  },
  completeTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  addButton: {
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },
  addButtonText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
  },
  toast: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: -7,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  toastIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
  },
});