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

import { readMoodHistory, type MoodHistoryRecord } from "@/data/mood-history";
import { buildMoodCalendarRange } from "@/data/mood-calendar";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getLibraryTabSurface } from "@/components/BibliotecaScreen";
import { MoodCalendar } from "@/components/MoodCalendar";

export default function HistorialEmocionesScreen() {
  const insets = useSafeAreaInsets();
  const { theme, activeSceneId } = useSceneTheme();
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

  const months = useMemo(() => buildMoodCalendarRange(records), [records]);

  return (
    <LinearGradient
      colors={theme.gradient as unknown as [string, string, ...string[]]}
      style={styles.root}
    >
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: getLibraryTabSurface(activeSceneId) }]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Feather name="chevron-left" size={28} color="#F9F9F9" style={{ transform: [{ translateX: -1 }] }} />
        </Pressable>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle}>Historial estado de ánimo</Text>
        </View>
        <View style={[styles.headerSide, { backgroundColor: getLibraryTabSurface(activeSceneId) }]} />
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
              <MoodCalendar month={month.date} records={records} showMonthTitle />
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
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    transform: [{ translateY: 8 }],
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSide: {
    width: 40,
    height: 40,
    opacity: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  monthSection: {
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.14)",
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
    backgroundColor: "rgba(0,0,0,0.28)",
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