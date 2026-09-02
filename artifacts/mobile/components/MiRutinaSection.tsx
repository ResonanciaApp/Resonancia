import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { WIDGET_GREEN_SOLID } from "@/constants/colors";
import {
  getRoutineDateKey,
  getRoutineWeekday,
  useRutina,
  type RoutineActivity,
} from "@/context/RutinaContext";
import { useColors } from "@/hooks/useColors";
import { useDayRollover } from "@/hooks/useDayRollover";

type Props = {
  style?: StyleProp<ViewStyle>;
};

function ActivityRow({
  activity,
  dateKey,
  onToggle,
}: {
  activity: RoutineActivity;
  dateKey: string;
  onToggle: () => void;
}) {
  const colors = useColors();
  const completed = activity.completedDates.includes(dateKey);

  return (
    <View
      style={[
        styles.activityCard,
        {
          backgroundColor: colors.card,
          borderColor: completed ? `${WIDGET_GREEN_SOLID}88` : colors.border,
        },
      ]}
      testID={`routine-activity-${activity.id}`}
    >
      <View style={styles.activityRail}>
        <View style={[styles.activityDot, { backgroundColor: completed ? WIDGET_GREEN_SOLID : `${WIDGET_GREEN_SOLID}66` }]} />
      </View>
      <View style={styles.activityCopy}>
        <Text style={[styles.activityCategory, { color: WIDGET_GREEN_SOLID }]}>{activity.category}</Text>
        <Text
          style={[
            styles.activityTitle,
            { color: colors.foreground, textDecorationLine: completed ? "line-through" : "none" },
          ]}
          numberOfLines={2}
        >
          {activity.title}
        </Text>
        {activity.description ? (
          <Text style={[styles.activityDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
            {activity.description}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={`${completed ? "Desmarcar" : "Marcar"} ${activity.title}`}
        testID={`routine-toggle-${activity.id}`}
        hitSlop={8}
        style={({ pressed }) => [
          styles.checkButton,
          {
            borderColor: completed ? WIDGET_GREEN_SOLID : colors.border,
            backgroundColor: completed ? WIDGET_GREEN_SOLID : "transparent",
            opacity: pressed ? 0.72 : 1,
          },
        ]}
      >
        {completed ? <Feather name="check" size={17} color="#FFFFFF" /> : null}
      </Pressable>
    </View>
  );
}

export function MiRutinaSection({ style }: Props) {
  const colors = useColors();
  const todayKey = useDayRollover();
  const { activities, isHydrated, lastAddedId, toggleActivity } = useRutina();
  const [toastVisible, setToastVisible] = useState(false);
  const lastSeenAddedId = useRef<string | null>(null);

  const today = useMemo(() => new Date(), [todayKey]);
  const todayDay = getRoutineWeekday(today);
  const todayActivities = useMemo(
    () => activities.filter((activity) => activity.repeatDays.includes(todayDay)),
    [activities, todayDay],
  );

  useFocusEffect(
    useCallback(() => {
      if (!lastAddedId || lastSeenAddedId.current === lastAddedId) return;
      lastSeenAddedId.current = lastAddedId;
      setToastVisible(true);
      const timeout = setTimeout(() => setToastVisible(false), 2400);
      return () => clearTimeout(timeout);
    }, [lastAddedId]),
  );

  const openCreate = useCallback(() => {
    router.push("/crear-rutina" as never);
  }, []);

  return (
    <View style={[styles.section, style]} testID="mi-rutina-section">
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.foreground }]}>Mi rutina</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Pequeños pasos para volver a lo esencial
          </Text>
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
            <Feather name="plus" size={25} color={WIDGET_GREEN_SOLID} />
          </Pressable>
        </View>
      </View>

      {!isHydrated ? null : todayActivities.length > 0 ? (
        <View style={styles.activityList}>
          {todayActivities.map((activity) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              dateKey={getRoutineDateKey(today)}
              onToggle={() => toggleActivity(activity.id, getRoutineDateKey(today))}
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

      {toastVisible ? (
        <View style={styles.toast} pointerEvents="none">
          <View style={styles.toastIcon}>
            <Feather name="check" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.toastText}>Actividad añadida</Text>
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
    gap: 9,
  },
  activityCard: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  activityRail: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activityDot: {
    width: 4,
    height: 30,
    borderRadius: 3,
  },
  activityCopy: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingRight: 10,
  },
  activityCategory: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  activityTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
  },
  activityDescription: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  checkButton: {
    width: 34,
    height: 34,
    marginRight: 13,
    borderRadius: 10,
    borderWidth: 1.5,
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