import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
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

import { LinearGradient } from "expo-linear-gradient";
import { SessionCard } from "@/components/SessionCard";
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

function formatSectionTitle(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return d.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function getDayKey(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function HistorialScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history, clearHistory } = usePlayer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const grouped = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const valid = history.filter((e) => new Date(e.playedAt).getTime() > cutoff);

    const map = new Map<string, typeof valid>();
    for (const entry of valid) {
      const key = getDayKey(entry.playedAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }

    return Array.from(map.entries()).map(([, entries]) => ({
      dayLabel: formatSectionTitle(entries[0].playedAt),
      entries,
    }));
  }, [history]);

  const handleClearAll = () => {
    if (Platform.OS === "web") {
      if (window.confirm("¿Borrar todo el historial de escucha?")) {
        clearHistory();
      }
      return;
    }
    Alert.alert(
      "Borrar historial",
      "¿Querés eliminar todo el historial de escucha? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar todo", style: "destructive", onPress: () => clearHistory() },
      ]
    );
  };

  return (
    <LinearGradient
      style={styles.root}
      colors={["#2E0510", "#160108"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 120 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Feather name="clock" size={26} color={colors.primary} />
            <View>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Historial</Text>
              <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
                Últimos 30 días
              </Text>
            </View>
          </View>
          {grouped.length > 0 && (
            <Pressable
              onPress={handleClearAll}
              hitSlop={12}
              style={({ pressed }) => [styles.clearBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.clearBtnText, { color: colors.mutedForeground }]}>
                Borrar todo
              </Text>
            </Pressable>
          )}
        </View>

        {grouped.length === 0 ? (
          <View style={[styles.emptyWrap, { backgroundColor: colors.card }]}>
            <Feather name="clock" size={34} color={colors.primary} style={{ marginBottom: 14 }} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Aún no hay sesiones
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Cuando empieces a escuchar, todo aparecerá aquí.
            </Text>
          </View>
        ) : (
          grouped.map(({ dayLabel, entries }) => (
            <View key={dayLabel} style={styles.group}>
              <View style={styles.dayRow}>
                <View style={[styles.dayLine, { backgroundColor: "rgba(212,175,55,0.18)" }]} />
                <View style={[styles.dayPill, { backgroundColor: colors.card }]}>
                  <Text style={[styles.dayText, { color: colors.accent }]}>{dayLabel}</Text>
                </View>
                <View style={[styles.dayLine, { backgroundColor: "rgba(212,175,55,0.18)" }]} />
              </View>

              {entries.map((entry) => {
                const session = SESSIONS.find((s) => s.id === entry.sessionId);
                if (!session) return null;
                return (
                  <View key={`${entry.sessionId}-${entry.playedAt}`} style={styles.entryRow}>
                    <Text style={[styles.entryTime, { color: colors.mutedForeground }]}>
                      {formatTime(entry.playedAt)}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <SessionCard session={session} horizontal />
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}

        {grouped.length > 0 && (
          <View style={[styles.footerNote]}>
            <Feather name="info" size={13} color={colors.mutedForeground} />
            <Text style={[styles.footerNoteText, { color: colors.mutedForeground }]}>
              Las sesiones se eliminan automáticamente al cumplir 30 días.
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: { fontSize: 26, fontWeight: "700", letterSpacing: 0.3 },
  pageSub: { fontSize: 12, marginTop: 2 },
  clearBtn: { paddingVertical: 6, paddingHorizontal: 4 },
  clearBtnText: { fontSize: 13, fontWeight: "600" },
  group: { marginBottom: 24 },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  dayLine: { flex: 1, height: 1 },
  dayPill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  dayText: { fontSize: 12, fontWeight: "600" },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  entryTime: {
    fontSize: 11,
    width: 42,
    textAlign: "right",
    flexShrink: 0,
  },
  emptyWrap: {
    borderRadius: 20,
    paddingVertical: 52,
    paddingHorizontal: 28,
    alignItems: "center",
    marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 18,
    marginTop: 4,
  },
  footerNoteText: { fontSize: 12, flex: 1, lineHeight: 17 },
});
