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
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useRoutineCompletionBanner } from "@/context/RoutineCompletionBannerContext";

type Props = {
  style?: StyleProp<ViewStyle>;
  cardBackgroundColor?: string;
};

const ROUTINE_CARD_HEIGHT = 74;
const ROUTINE_CARD_GAP = 9;
const ROUTINE_SLOT_HEIGHT = ROUTINE_CARD_HEIGHT + ROUTINE_CARD_GAP;
const COMPLETION_EXIT_DELAY = 1500;
const HANDLE_COLOR = "#7F7F7F";

function lightenHexColor(color: string, amount = 0.1) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return color;
  const value = Number.parseInt(match[1], 16);
  const channel = (shift: number) => {
    const original = (value >> shift) & 0xff;
    return Math.round(original + (255 - original) * amount);
  };
  return `#${[channel(16), channel(8), channel(0)]
    .map((part) => part.toString(16).padStart(2, "0"))
    .join("")}`;
}

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
  cardBackgroundColor,
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
  cardBackgroundColor?: string;
}) {
  const routineTheme = useRoutineTheme();
  const { theme } = useSceneTheme();
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
    completionProgress.value = withTiming(completing ? 1 : 0, { duration: 500 });
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

  const completionOverlayStyle = useAnimatedStyle(() => ({
    opacity: completionProgress.value,
  }));
  const ticketCircleColor = "#F9F9F9";
  const ticketCircleCompletedColor = useMemo(
    () => lightenHexColor(theme.gradient[0], 0.1),
    [theme.gradient],
  );
  const ticketCircleStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      completionProgress.value,
      [0, 1],
      [ticketCircleColor, ticketCircleCompletedColor],
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
        <Reanimated.View
          style={[
            styles.activityCard,
            { backgroundColor: cardBackgroundColor ?? routineTheme.surface },
          ]}
        >
          <Reanimated.View
            pointerEvents="none"
            style={[
              styles.completionOverlay,
              { backgroundColor: routineTheme.completion },
              completionOverlayStyle,
            ]}
          />
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
          <View style={styles.checkButtonWrap}>
            <Reanimated.View
              pointerEvents="none"
              style={[styles.checkButtonCircle, ticketCircleStyle]}
            />
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
                { opacity: pressed ? 0.58 : 1 },
              ]}
            >
              <Feather name="check" size={20} color={completing ? "#F9F9F9" : "#060A0F"} />
            </Pressable>
          </View>
        </Reanimated.View>
      </GestureDetector>
    </Reanimated.View>
  );
});

export function MiRutinaSection({ style, cardBackgroundColor }: Props) {
  const colors = useColors();
  const routineTheme = useRoutineTheme();
  const { announceActivityAdded, announceCompletion } = useRoutineCompletionBanner();
  const todayKey = useDayRollover();
  const {
    activities,
    isHydrated,
    lastAddedId,
    completeActivity,
    reorderActivities,
  } = useRutina();
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
  const completingIdsRef = useRef<Set<string>>(new Set());
  const lastSeenAddedId = useRef<string | null>(null);
  const exitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const today = useMemo(() => new Date(), [todayKey]);
  const dateKey = getRoutineDateKey(today);
  const completedTodayCount = useMemo(
    () =>
      activities.filter((activity) => activity.completedDates.includes(dateKey)).length,
    [activities, dateKey],
  );
  const completedTodayCountRef = useRef(completedTodayCount);
  const completedTodayDateRef = useRef(dateKey);
  if (completedTodayDateRef.current !== dateKey) {
    completedTodayDateRef.current = dateKey;
    completedTodayCountRef.current = completedTodayCount;
  }
  useEffect(() => {
    completedTodayCountRef.current = completedTodayCount;
  }, [completedTodayCount]);
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
  const listHeight = useSharedValue(todayActivities.length * ROUTINE_SLOT_HEIGHT);
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
  useEffect(() => {
    listHeight.value = withTiming(
      todayActivities.length * ROUTINE_SLOT_HEIGHT,
      { duration: 350 },
    );
  }, [listHeight, todayActivities.length]);
  const listHeightStyle = useAnimatedStyle(() => ({
    height: listHeight.value,
  }));

  useEffect(
    () => () => {
      exitTimersRef.current.forEach(clearTimeout);
      exitTimersRef.current.clear();
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      if (!lastAddedId || lastSeenAddedId.current === lastAddedId) return;
      lastSeenAddedId.current = lastAddedId;
      announceActivityAdded();
    }, [announceActivityAdded, lastAddedId]),
  );

  useFocusEffect(
    useCallback(
      () => () => {
        exitTimersRef.current.forEach(clearTimeout);
        exitTimersRef.current.clear();
        completingIdsRef.current = new Set();
        setCompletingIds(new Set());
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
      if (activity.completedDates.includes(dateKey)) return;
      if (!isRoutineActivityScheduledForDate(activity, today)) return;
      const nextCompleting = new Set(completingIdsRef.current);
      nextCompleting.add(activity.id);
      completingIdsRef.current = nextCompleting;
      const previousCount = completedTodayCountRef.current;
      const nextCount = previousCount + 1;
      completedTodayCountRef.current = nextCount;
      completeActivity(activity.id, dateKey);
      setCompletingIds(nextCompleting);
      announceCompletion(previousCount, nextCount);
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
    [announceCompletion, completeActivity, dateKey, today],
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
  const showCompleteState =
    isHydrated && todayActivities.length === 0 && hasScheduledToday;
  const completeFade = useSharedValue(0);
  useEffect(() => {
    completeFade.value = showCompleteState
      ? withTiming(1, { duration: 300 })
      : 0;
  }, [completeFade, showCompleteState]);
  const completeFadeStyle = useAnimatedStyle(() => ({
    opacity: completeFade.value,
  }));

  return (
    <View style={[styles.section, style]} testID="mi-rutina-section">
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mi rutina expansiva</Text>
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
        <Reanimated.View style={[styles.activityList, listHeightStyle]}>
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
              cardBackgroundColor={cardBackgroundColor}
            />
          ))}
        </Reanimated.View>
      ) : hasScheduledToday ? (
        <Reanimated.View style={[styles.completeState, completeFadeStyle]}>
          <View style={styles.completeCopy}>
            <Text style={styles.completeTitle}>
              Rutina completa
            </Text>
            <Text style={styles.completeSubtitle}>
              Hasta mañana.
            </Text>
          </View>
          <Pressable
            onPress={openCreate}
            accessibilityRole="button"
            accessibilityLabel="Añadir una actividad"
            testID="mi-rutina-complete-add-button"
            style={({ pressed }) => [
              styles.completeAddButton,
              { opacity: pressed ? 0.78 : 1 },
            ]}
          >
            <Text style={styles.completeAddButtonText}>Añadir una actividad</Text>
          </Pressable>
        </Reanimated.View>
      ) : null}

      {!(isHydrated && todayActivities.length === 0 && hasScheduledToday) ? (
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
      ) : null}

      <View style={styles.sectionSpacer} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 14,
  },
  sectionSpacer: {
    height: 53,
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
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  checkButtonWrap: {
    width: 34,
    height: 34,
  },
  checkButtonCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 17,
  },
  completeState: {
    minHeight: 156,
    borderRadius: 16,
    backgroundColor: "rgba(191,207,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  completeCopy: {
    alignItems: "center",
    marginBottom: 17,
  },
  completeTitle: {
    color: "#F0F0F0",
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  completeSubtitle: {
    color: "#F0F0F0",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: "center",
  },
  completeAddButton: {
    alignSelf: "center",
    height: 25,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  completeAddButtonText: {
    color: "#060A0F",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
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
});