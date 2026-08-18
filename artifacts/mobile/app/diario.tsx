import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { GhostPill } from "@/components/GhostPill";
import { router, Stack, useFocusEffect } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
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

import { type DiarioEntry, useDiario } from "@/hooks/useDiario";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { dayKey } from "@/utils/stats";

function formatMonth(iso: string) {
  const d = new Date(iso);
  return d
    .toLocaleDateString("es-ES", { month: "short" })
    .replace(/\.$/, "")
    .toUpperCase();
}

function formatDay(iso: string) {
  const d = new Date(iso);
  return String(d.getDate()).padStart(2, "0");
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-ES", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}


type DiarioDayGroup = { key: string; createdAt: string; entries: DiarioEntry[] };

function groupByDay(entries: DiarioEntry[]): DiarioDayGroup[] {
  const groups: DiarioDayGroup[] = [];
  const index = new Map<string, DiarioDayGroup>();
  for (const entry of entries) {
    const key = dayKey(new Date(entry.createdAt));
    let group = index.get(key);
    if (!group) {
      group = { key, createdAt: entry.createdAt, entries: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
}

export default function DiarioScreen() {
  const goBack = useBackOverride();
  const colors = useColors();
  const { theme: sceneTheme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { entries, loading, deleteAll, reload } = useDiario("reflexiones");

  // Recargar al volver de la pantalla de entrada (nueva/edición).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleMenu = () => {
    if (entries.length === 0) return;
    Alert.alert("Diario", undefined, [
      {
        text: "Borrar todo el diario",
        style: "destructive",
        onPress: () =>
          Alert.alert("Borrar todo", "¿Eliminar todas las entradas de tu diario?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Borrar todo", style: "destructive", onPress: () => deleteAll() },
          ]),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const groups = groupByDay(entries);

  const renderGroup = (group: DiarioDayGroup) => (
    <View key={group.key} style={styles.dayRow}>
      <View style={styles.dateCol}>
        <Text style={[styles.dateMonth, { color: "#F4F4F4" }]}>
          {formatMonth(group.createdAt)}
        </Text>
        <Text style={[styles.dateDay, { color: "#F4F4F4" }]}>
          {formatDay(group.createdAt)}
        </Text>
      </View>

      <View style={[styles.entryDivider, { backgroundColor: "rgba(255,255,255,0.1)" }]} />

      <View style={styles.dayEntries}>
        {group.entries.map((entry, i) => (
          <Pressable
            key={entry.id}
            onPress={() => router.push(`/diario-entrada?id=${entry.id}` as never)}
            style={[styles.entryBody, i > 0 && styles.entryBodySpacing]}
          >
            <Text style={[styles.entryTime, { color: "#F4F4F4" }]}>
              {formatTime(entry.createdAt)}
            </Text>
            <Text style={[styles.entryText, { color: "#F9F9F9" }]} numberOfLines={2}>
              {entry.text}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ contentStyle: { backgroundColor: sceneTheme.gradient[0] } }} />
      <LinearGradient

        style={[styles.root, { backgroundColor: sceneTheme.solid }]}

        colors={sceneTheme.gradient}

        start={{ x: 0, y: 0 }}

      end={{ x: 0, y: 1 }}

    >
      <StatusBar hidden />

      {/* Floating back */}
      <BackPill onPress={goBack ?? (() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} style={{ position: "absolute", left: 20, top: topPad + 8, zIndex: 10 }} />

      {/* Top bar (solo menú) */}
      <View style={[styles.topBar, { paddingTop: topPad + 4, justifyContent: "flex-end" }]}>
        <Pressable onPress={handleMenu} hitSlop={10} style={styles.topBtn}>
          <Feather name="more-horizontal" size={22} color={"#F9F9F9"} />
        </Pressable>
      </View>

      {/* Title */}
      <Text style={[styles.screenTitle, { color: "#F9F9F9" }]}>Diario</Text>

      {/* Body */}
      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={"#F9F9F9"} size="large" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: "#F9F9F9" }]}>No hay entradas</Text>
          <Text style={[styles.emptyText, { color: "#F4F4F4" }]}>
            Toca "Añade entrada" para comenzar una entrada en tu diario.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 + bottomPad }}
          showsVerticalScrollIndicator={false}
        >
          {groups.map(renderGroup)}
        </ScrollView>
      )}

      {/* Footer button */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 12 }]}>
        <Pressable
          onPress={() => router.push("/diario-entrada" as never)}
          style={({ pressed }) => [
            styles.addBtn,
            { overflow: "hidden", opacity: pressed ? 0.85 : 1, backgroundColor: colors.primary },
          ]}
        >
          <Text style={styles.addBtnText}>Añade entrada</Text>
        </Pressable>
      </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  topBtn: { padding: 4 },
  screenTitle: {
    fontFamily: "Manrope",
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: 0.3,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 20,
  },
  scroll: { flex: 1 },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
  },
  emptyTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", marginBottom: 8 },
  emptyText: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21, textAlign: "center" },

  dayRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
  },
  dateCol: { width: 40, alignItems: "flex-start", paddingTop: 2 },
  dateMonth: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  dateDay: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", marginTop: 2 },
  entryDivider: { width: 1, alignSelf: "stretch", marginHorizontal: 14 },
  dayEntries: { flex: 1 },
  entryBody: { flex: 1 },
  entryBodySpacing: { marginTop: 16 },
  entryTime: { fontFamily: "Manrope", fontSize: 12, marginBottom: 4 },
  entryText: { fontFamily: "Manrope", fontSize: 15, lineHeight: 21 },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  addBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: undefined,
  },
  addBtnText: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700", color: "#050619" },
});
