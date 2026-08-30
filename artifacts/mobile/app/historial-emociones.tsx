import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMoodById } from "@/data/moods";
import { readMoodHistory, type MoodHistoryRecord } from "@/data/mood-history";
import { useSceneTheme } from "@/context/SceneThemeContext";

type DayGroup = {
  key: string;
  date: Date;
  records: MoodHistoryRecord[];
};

type MonthGroup = {
  key: string;
  label: string;
  days: DayGroup[];
};

function groupHistory(records: MoodHistoryRecord[]): MonthGroup[] {
  const days = new Map<string, DayGroup>();
  for (const record of records) {
    const date = new Date(record.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const current = days.get(key);
    if (current) {
      current.records.push(record);
    } else {
      days.set(key, { key, date, records: [record] });
    }
  }

  const months = new Map<string, MonthGroup>();
  [...days.values()]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .forEach((day) => {
      const key = `${day.date.getFullYear()}-${day.date.getMonth()}`;
      const current = months.get(key);
      if (current) {
        current.days.push(day);
      } else {
        months.set(key, {
          key,
          label: day.date
            .toLocaleDateString("es-CL", { month: "long", year: "numeric" })
            .toUpperCase(),
          days: [day],
        });
      }
    });
  return [...months.values()];
}

export default function HistorialEmocionesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const [records, setRecords] = useState<MoodHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await readMoodHistory());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const months = useMemo(() => groupHistory(records), [records]);

  return (
    <LinearGradient
      colors={theme.gradient as unknown as [string, string, ...string[]]}
      style={styles.root}
    >
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Feather name="arrow-left" size={21} color="#F9F9F9" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Historial de tu estado de ánimo
        </Text>
        <View style={styles.headerSide} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#F9F9F9" />
        </View>
      ) : months.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="smile" size={28} color="rgba(255,255,255,0.72)" />
          </View>
          <Text style={styles.emptyTitle}>Tu historia comienza aquí</Text>
          <Text style={styles.emptyText}>
            Registra una emoción para verla aparecer en tu historial.
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 42 }]}
        >
          {months.map((month) => (
            <View key={month.key} style={styles.monthSection}>
              <Text style={styles.monthTitle}>{month.label}</Text>
              {month.days.map((day, dayIndex) => (
                <View key={day.key} style={styles.dayRow}>
                  <View style={styles.dateRail}>
                    <View style={styles.dateCircle}>
                      <Text style={styles.dateText}>{day.date.getDate()}</Text>
                    </View>
                    {dayIndex < month.days.length - 1 && <View style={styles.railLine} />}
                  </View>
                  <View style={styles.dayMoods}>
                    {day.records.flatMap((record) =>
                      record.moodIds.map((moodId) => {
                        const mood = getMoodById(moodId);
                        if (!mood) return null;
                        return (
                          <View key={`${record.id}-${moodId}`} style={styles.moodChip}>
                            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                            <Text style={styles.moodLabel}>{mood.label}</Text>
                          </View>
                        );
                      }),
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080910",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 17,
    fontWeight: "700",
  },
  headerSide: {
    width: 42,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  monthSection: {
    marginBottom: 28,
  },
  monthTitle: {
    fontFamily: "Manrope",
    color: "rgba(249,249,249,0.72)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 18,
  },
  dayRow: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dateRail: {
    width: 48,
    alignItems: "center",
    alignSelf: "stretch",
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  dateText: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 14,
    fontWeight: "700",
  },
  railLine: {
    width: 1,
    flex: 1,
    minHeight: 30,
    marginTop: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  dayMoods: {
    flex: 1,
    gap: 7,
    paddingLeft: 7,
    paddingBottom: 15,
  },
  moodChip: {
    alignSelf: "flex-start",
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.17)",
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodLabel: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 46,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor: "rgba(139,92,246,0.20)",
  },
  emptyTitle: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Manrope",
    color: "rgba(245,242,248,0.62)",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});