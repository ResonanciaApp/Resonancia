import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  interpolateColor,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { WIDGET_GREEN_SOLID } from "@/constants/colors";
import {
  getRoutineDateKey,
  getRoutineWeekday,
  useRutina,
  type RoutineActivity,
} from "@/context/RutinaContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { useDayRollover } from "@/hooks/useDayRollover";

type Props = {
  style?: StyleProp<ViewStyle>;
};

const ROUTINE_CARD_HEIGHT = 74;
const ROUTINE_CARD_GAP = 9;
const ROUTINE_SLOT_HEIGHT = ROUTINE_CARD_HEIGHT + ROUTINE_CARD_GAP;
const ROUTINE_HANDLE_COLOR = "#7F7F7F";
const ROUTINE_TOAST_DURATION = 2400;
const ROUTINE_TICKET_DEACTIVATION_DELAY = ROUTINE_TOAST_DURATION + 2000;

function ActivityRow({
  activity,
  dateKey,
  itemCount,
  neutralBackground,
  ticketBackground,
  orderSV,
  draggingId,
  dragOriginSlot,
  dragDeltaY,
  insertAt,
  onToggle,
  onDragEnd,
}: {
  activity: RoutineActivity;
  dateKey: string;
  itemCount: number;
  neutralBackground: string;
  ticketBackground: string;
  orderSV: SharedValue<string[]>;
  draggingId: SharedValue<string>;
  dragOriginSlot: SharedValue<number>;
  dragDeltaY: SharedValue<number>;
  insertAt: SharedValue<number>;
  onToggle: () => void;
  onDragEnd: (from: number, to: number) => void;
}) {
  const colors = useColors();
  const completed = activity.completedDates.includes(dateKey);
  const completionProgress = useSharedValue(completed ? 1 : 0);
  const didActivate = useSharedValue(0);
  const [ticketActive, setTicketActive] = useState(!completed);
  const ticketDeactivateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activityId = activity.id;
  const sharedOrder = orderSV;
  const sharedDraggingId = draggingId;
  const sharedDragOriginSlot = dragOriginSlot;
  const sharedDragDeltaY = dragDeltaY;
  const sharedInsertAt = insertAt;

  useEffect(() => {
    completionProgress.value = withTiming(completed ? 1 : 0, { duration: 450 });
  }, [completed, completionProgress]);

  useEffect(() => {
    if (!completed) {
      if (ticketDeactivateTimerRef.current) {
        clearTimeout(ticketDeactivateTimerRef.current);
        ticketDeactivateTimerRef.current = null;
      }
      setTicketActive(true);
    }
  }, [completed]);

  useEffect(
    () => () => {
      if (ticketDeactivateTimerRef.current) clearTimeout(ticketDeactivateTimerRef.current);
    },
    [],
  );

  const handleTicketPress = useCallback(() => {
    const wasCompleted = completed;
    onToggle();
    if (ticketDeactivateTimerRef.current) {
      clearTimeout(ticketDeactivateTimerRef.current);
      ticketDeactivateTimerRef.current = null;
    }
    setTicketActive(true);
    if (!wasCompleted) {
      ticketDeactivateTimerRef.current = setTimeout(() => {
        setTicketActive(false);
        ticketDeactivateTimerRef.current = null;
      }, ROUTINE_TICKET_DEACTIVATION_DELAY);
    }
  }, [completed, onToggle]);

  const pan = Gesture.Pan()
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
      sharedInsertAt.value = Math.max(0, Math.min(itemCount - 1, rawSlot));
    })
    .onFinalize(() => {
      if (didActivate.value !== 1) return;
      didActivate.value = 0;
      const from = sharedDragOriginSlot.value;
      const to = sharedInsertAt.value;
      const nextOrder = [...sharedOrder.value];
      const [moved] = nextOrder.splice(from, 1);
      nextOrder.splice(to, 0, moved);
      sharedOrder.value = nextOrder;
      sharedDraggingId.value = "";
      sharedDragDeltaY.value = 0;
      sharedDragOriginSlot.value = -1;
      sharedInsertAt.value = -1;
      runOnJS(onDragEnd)(from, to);
    });

  const positionStyle = useAnimatedStyle(() => {
    const isDragging = sharedDraggingId.value === activityId;
    const ownSlot = sharedOrder.value.indexOf(activityId);
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
      transform: [
        {
          translateY: withTiming(effectiveSlot * ROUTINE_SLOT_HEIGHT, {
            duration: 180,
          }),
        },
      ],
      zIndex: 1,
      shadowOpacity: 0,
    };
  });

  const completionStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      completionProgress.value,
      [0, 1],
      [neutralBackground, WIDGET_GREEN_SOLID],
    ),
  }));

  return (
    <Reanimated.View
      style={[styles.activitySlot, positionStyle]}
      testID={`routine-activity-${activity.id}`}
    >
      <GestureDetector gesture={pan}>
        <Reanimated.View style={[styles.activityCard, completionStyle]}>
          <Feather name="more-vertical" size={18} color={ROUTINE_HANDLE_COLOR} />
          <View style={styles.activityCopy}>
            <Text style={[styles.activityCategory, { color: colors.accent }]} numberOfLines={1}>
              {activity.category}
            </Text>
            <View style={styles.activityTitleRow}>
              <Text
                style={[
                  styles.activityTitle,
                  { color: completed ? "#FFFFFF" : colors.foreground },
                ]}
                numberOfLines={1}
              >
                {activity.title}
              </Text>
              <Feather name="more-horizontal" size={18} color={ROUTINE_HANDLE_COLOR} />
            </View>
            {activity.description ? (
              <Text
                style={[
                  styles.activityDescription,
                  {
                    color: completed
                      ? "rgba(255,255,255,0.76)"
                      : colors.mutedForeground,
                  },
                ]}
                numberOfLines={1}
              >
                {activity.description}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={handleTicketPress}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ticketActive }}
            accessibilityLabel={`${ticketActive ? "Desactivar" : "Activar"} ticket de ${activity.title}`}
            testID={`routine-toggle-${activity.id}`}
            hitSlop={10}
            style={({ pressed }) => [
              styles.checkButton,
              {
                backgroundColor: ticketBackground,
                opacity: pressed ? 0.58 : 1,
              },
            ]}
          >
            {ticketActive ? <Feather name="check" size={20} color={WIDGET_GREEN_SOLID} /> : null}
          </Pressable>
        </Reanimated.View>
      </GestureDetector>
    </Reanimated.View>
  );
}

export function MiRutinaSection({ style }: Props) {
  const colors = useColors();
  const { activeSceneId, theme } = useSceneTheme();
  const todayKey = useDayRollover();
  const {
    activities,
    isHydrated,
    lastAddedId,
    toggleActivity,
    reorderActivities,
  } = useRutina();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const lastSeenAddedId = useRef<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const today = useMemo(() => new Date(), [todayKey]);
  const dateKey = getRoutineDateKey(today);
  const todayDay = getRoutineWeekday(today);
  const todayActivities = useMemo(
    () => activities.filter((activity) => activity.repeatDays.includes(todayDay)),
    [activities, todayDay],
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
  const neutralCardBackground =
    activeSceneId === "tibet"
      ? "rgba(0,0,0,0.15)"
      : activeSceneId === "indigo"
        ? "rgba(42,40,64,0.65)"
        : "rgba(255,255,255,0.05)";
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
    },
    [],
  );

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, ROUTINE_TOAST_DURATION);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!lastAddedId || lastSeenAddedId.current === lastAddedId) return;
      lastSeenAddedId.current = lastAddedId;
      showToast("Actividad añadida");
    }, [lastAddedId, showToast]),
  );

  const openCreate = useCallback(() => {
    router.push("/crear-rutina" as never);
  }, []);

  const handleToggle = useCallback(
    (activity: RoutineActivity) => {
      const wasCompleted = activity.completedDates.includes(dateKey);
      toggleActivity(activity.id, dateKey);
      if (!wasCompleted) showToast("Actividad finalizada");
    },
    [dateKey, showToast, toggleActivity],
  );

  const handleDragEnd = useCallback(
    (from: number, to: number) => {
      if (
        from < 0 ||
        to < 0 ||
        from >= todayActivityIds.length ||
        to >= todayActivityIds.length ||
        from === to
      ) {
        return;
      }
      const reorderedIds = [...todayActivityIds];
      const [movedId] = reorderedIds.splice(from, 1);
      reorderedIds.splice(to, 0, movedId);
      reorderActivities(reorderedIds);
    },
    [reorderActivities, todayActivityIds],
  );

  return (
    <View style={[styles.section, style]} testID="mi-rutina-section">
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.foreground }]}>Mi rutina</Text>
        </View>
        <View style={styles.headerActions}>
          <Feather name="calendar" size={19} color={colors.mutedForeground} />
          <Pressable
            onPress={openCreate}
            accessibilityRole="button"
            accessibilityLabel="Añadir una actividad a Mi rutina"
            testID="mi-rutina-add-header"
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
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
          {todayActivities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              dateKey={dateKey}
              itemCount={todayActivities.length}
              neutralBackground={neutralCardBackground}
              ticketBackground={theme.gradient[0]}
              orderSV={orderSV}
              draggingId={draggingId}
              dragOriginSlot={dragOriginSlot}
              dragDeltaY={dragDeltaY}
              insertAt={insertAt}
              onToggle={() => handleToggle(activity)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </View>
      ) : activities.length > 0 ? (
        <View style={[styles.emptyState, { borderColor: `${WIDGET_GREEN_SOLID}AA` }]}>
          <Feather name="calendar" size={21} color={WIDGET_GREEN_SOLID} />
          <View style={styles.emptyCopy}>
            <Text style={[styles.emptyTitle, { color: WIDGET_GREEN_SOLID }]}>No hay prácticas para hoy</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Programa una práctica para este día o crea una nueva.
            </Text>
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={openCreate}
        accessibilityRole="button"
        accessibilityLabel="Añadir una actividad"
        testID="mi-rutina-add-button"
        style={({ pressed }) => [
          styles.addButton,
          {
            borderColor: `${WIDGET_GREEN_SOLID}AA`,
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        <Feather name="plus" size={20} color={WIDGET_GREEN_SOLID} />
        <Text style={[styles.addButtonText, { color: WIDGET_GREEN_SOLID }]}>Añadir una actividad</Text>
      </Pressable>

      {toastMessage ? (
        <View style={styles.toast} pointerEvents="none">
          <View style={styles.toastIcon}>
            <Feather name="check" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 14,
    marginBottom: 36,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginTop: 4,
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
    gap: 10,
    paddingLeft: 15,
    paddingRight: 11,
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
  activityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: 5,
  },
  activityTitle: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  activityDescription: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    minHeight: 76,
    borderRadius: 16,
    borderWidth: 1.2,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 13,
  },
  emptyCopy: {
    flex: 1,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  addButton: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1.2,
    borderStyle: "dashed",
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
    paddingHorizontal: 15,
    backgroundColor: "#080808",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
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
    backgroundColor: WIDGET_GREEN_SOLID,
  },
  toastText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});