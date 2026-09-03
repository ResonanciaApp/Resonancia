import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
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
  getRoutineDateFromKey,
  getRoutineDateKey,
  ROUTINE_DAY_LABELS,
  useRutina,
} from "@/context/RutinaContext";
import { useDayRollover } from "@/hooks/useDayRollover";
import { useRoutineTheme } from "@/hooks/useRoutineTheme";

function repeatLabel(days: number[]): string {
  if (days.length === 7) return "Cada día";
  return days.map((day) => ROUTINE_DAY_LABELS[day]).join(" · ");
}

function DetailRow({
  icon,
  label,
  muted = false,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  muted?: boolean;
}) {
  const routineTheme = useRoutineTheme();
  return (
    <View style={styles.detailRow}>
      <Feather
        name={icon}
        size={18}
        color={muted ? routineTheme.textMuted : routineTheme.completion}
      />
      <Text
        style={[
          styles.detailText,
          { color: muted ? routineTheme.textMuted : routineTheme.completion },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ActionRow({
  label,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  disabled?: boolean;
}) {
  const routineTheme = useRoutineTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.actionRow,
        {
          backgroundColor: routineTheme.surface,
          borderColor: routineTheme.divider,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Feather name={icon} size={18} color={routineTheme.accent} />
      <Text style={[styles.actionText, { color: routineTheme.text }]}>{label}</Text>
      <Feather name="chevron-right" size={18} color={routineTheme.textMuted} />
    </Pressable>
  );
}

export default function RutinaDetailScreen() {
  const { id, dateKey: routeDateKey } = useLocalSearchParams<{
    id: string;
    dateKey?: string;
  }>();
  const insets = useSafeAreaInsets();
  const routineTheme = useRoutineTheme();
  const todayKey = useDayRollover();
  const {
    isHydrated,
    getActivityById,
    completeActivity,
    skipActivity,
    archiveActivity,
  } = useRutina();
  const activity = id ? getActivityById(id) : undefined;
  const dateKey =
    typeof routeDateKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(routeDateKey)
      ? routeDateKey
      : todayKey;
  const selectedDate = getRoutineDateFromKey(dateKey);
  const isToday = dateKey === todayKey;
  const completed = activity?.completedDates.includes(dateKey) ?? false;
  const skipped = activity?.skippedDates.includes(dateKey) ?? false;
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 18);

  const markComplete = useCallback(() => {
    if (!activity || completed || !isToday || activity.archivedAt) return;
    completeActivity(activity.id, dateKey);
    router.back();
  }, [activity, completeActivity, completed, dateKey, isToday]);

  const skipToday = useCallback(() => {
    if (!activity || skipped || !isToday || activity.archivedAt) return;
    skipActivity(activity.id, dateKey);
    router.back();
  }, [activity, dateKey, isToday, skipActivity, skipped]);

  const archive = useCallback(() => {
    if (!activity) return;
    Alert.alert(
      "Archivar rutina",
      "Dejará de aparecer en los próximos días, pero conservarás todo su historial.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Archivar",
          onPress: () => {
            archiveActivity(activity.id);
            router.back();
          },
        },
      ],
    );
  }, [activity, archiveActivity]);

  if (!isHydrated) return <View style={{ flex: 1, backgroundColor: routineTheme.background }} />;

  if (!activity) {
    return (
      <View style={[styles.root, { backgroundColor: routineTheme.background }]}>
        <SacredBackground variant="solid" />
        <View style={[styles.notFound, { paddingTop: topPad, paddingBottom: bottomPad }]}>
          <Feather name="calendar" size={28} color={routineTheme.accent} />
          <Text style={[styles.notFoundTitle, { color: routineTheme.text }]}>
            Esta rutina ya no está disponible
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={[styles.backText, { color: routineTheme.completion }]}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: routineTheme.background }]}>
      <StatusBar hidden />
      <SacredBackground variant="solid" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar detalle"
            hitSlop={12}
          >
            <Feather name="x" size={25} color={routineTheme.text} />
          </Pressable>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: completed
                  ? routineTheme.completionSoft
                  : skipped
                    ? routineTheme.surfaceElevated
                    : routineTheme.surface,
                borderColor: completed ? routineTheme.completion : routineTheme.divider,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: completed ? routineTheme.completion : routineTheme.textMuted },
              ]}
            >
              {completed ? "Completada" : skipped ? "Saltada hoy" : "Pendiente"}
            </Text>
          </View>
        </View>

        <View style={styles.mainCopy}>
          <Text style={[styles.eyebrow, { color: routineTheme.textMuted }]}>
            Nombre de la rutina
          </Text>
          <Text style={[styles.title, { color: routineTheme.text }]}>{activity.title}</Text>
          <Text style={[styles.dateContext, { color: routineTheme.accent }]}>
            {new Intl.DateTimeFormat("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(selectedDate)}
          </Text>

          <View style={[styles.divider, { backgroundColor: routineTheme.divider }]} />

          <Text style={[styles.eyebrow, { color: routineTheme.textMuted }]}>Descripción</Text>
          <Text style={[styles.description, { color: routineTheme.textMuted }]}>
            {activity.description || "Sin descripción"}
          </Text>

          <Text style={[styles.sectionLabel, { color: routineTheme.textMuted }]}>Detalles</Text>
          <View
            style={[
              styles.detailsCard,
              { backgroundColor: routineTheme.surface, borderColor: routineTheme.divider },
            ]}
          >
            <DetailRow icon="repeat" label={repeatLabel(activity.repeatDays)} />
            <View style={[styles.innerDivider, { backgroundColor: routineTheme.divider }]} />
            <DetailRow icon="plus-square" label="Adjuntar una práctica (próximamente)" muted />
            <View style={[styles.innerDivider, { backgroundColor: routineTheme.divider }]} />
            <DetailRow icon="tag" label={activity.category} />
          </View>
        </View>

        <View style={styles.actions}>
          <ActionRow
            icon={completed ? "check-circle" : "check"}
            label={
              completed
                ? "Completada"
                : isToday
                  ? "Marcar como completo"
                  : "Solo lectura para esta fecha"
            }
            onPress={markComplete}
            disabled={completed || !isToday || !!activity.archivedAt}
          />
          <ActionRow
            icon="clock"
            label={skipped ? "Saltada por hoy" : "Saltarme hoy"}
            onPress={skipToday}
            disabled={completed || skipped || !isToday || !!activity.archivedAt}
          />
          <ActionRow icon="archive" label="Archivar rutina" onPress={archive} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    minHeight: "100%",
    paddingHorizontal: 22,
  },
  header: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
  },
  mainCopy: {
    marginTop: 48,
  },
  eyebrow: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginBottom: 8,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 25,
    lineHeight: 33,
    fontWeight: "700",
  },
  dateContext: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 10,
    textTransform: "capitalize",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 28,
  },
  description: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 23,
  },
  sectionLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginTop: 34,
    marginBottom: 10,
  },
  detailsCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  detailRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 30,
  },
  actions: {
    marginTop: 48,
    gap: 10,
  },
  actionRow: {
    minHeight: 58,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  notFoundTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
  },
  backText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
});