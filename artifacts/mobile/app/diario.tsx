import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
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
import { type DiarioEntry, useDiario } from "@/hooks/useDiario";
import { useColors } from "@/hooks/useColors";

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

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

type DiarioDayGroup = { key: string; createdAt: string; entries: DiarioEntry[] };

function groupByDay(entries: DiarioEntry[]): DiarioDayGroup[] {
  const groups: DiarioDayGroup[] = [];
  const index = new Map<string, DiarioDayGroup>();
  for (const entry of entries) {
    const key = dayKey(entry.createdAt);
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
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { entries, deleteAll, reload } = useDiario("reflexiones");

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
        <Text style={[styles.dateMonth, { color: colors.mutedForeground }]}>
          {formatMonth(group.createdAt)}
        </Text>
        <Text style={[styles.dateDay, { color: colors.mutedForeground }]}>
          {formatDay(group.createdAt)}
        </Text>
      </View>

      <View style={[styles.entryDivider, { backgroundColor: "rgba(237,225,211,0.18)" }]} />

      <View style={styles.dayEntries}>
        {group.entries.map((entry, i) => (
          <Pressable
            key={entry.id}
            onPress={() => router.push(`/diario-entrada?id=${entry.id}` as never)}
            style={[styles.entryBody, i > 0 && styles.entryBodySpacing]}
          >
            <Text style={[styles.entryTime, { color: colors.mutedForeground }]}>
              {formatTime(entry.createdAt)}
            </Text>
            <Text style={[styles.entryText, { color: colors.foreground }]} numberOfLines={2}>
              {entry.text}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 4 }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))}
          hitSlop={10}
          style={styles.topBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={handleMenu} hitSlop={10} style={styles.topBtn}>
          <Feather name="more-horizontal" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Title */}
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Diario</Text>

      {/* Body */}
      {entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No hay entradas</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
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
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.addBtnText}>Añade entrada</Text>
        </Pressable>
      </View>
    </View>
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
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.3,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  scroll: { flex: 1 },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  emptyText: { fontSize: 14, lineHeight: 21, textAlign: "center" },

  dayRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
  },
  dateCol: { width: 40, alignItems: "flex-start", paddingTop: 2 },
  dateMonth: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  dateDay: { fontSize: 20, fontWeight: "700", marginTop: 2 },
  entryDivider: { width: 1, alignSelf: "stretch", marginHorizontal: 14 },
  dayEntries: { flex: 1 },
  entryBody: { flex: 1 },
  entryBodySpacing: { marginTop: 16 },
  entryTime: { fontSize: 12, marginBottom: 4 },
  entryText: { fontSize: 15, lineHeight: 21 },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  addBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontSize: 16, fontWeight: "700", color: "#0B0F14" },
});
