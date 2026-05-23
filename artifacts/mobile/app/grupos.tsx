import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { useColors } from "@/hooks/useColors";

const GRUPOS = [
  {
    id: "g1",
    name: "Meditación Vipassana",
    description: "Práctica y diálogo sobre la meditación de visión profunda",
    members: 234,
    lastMsg: "¿Alguien tiene recomendaciones para retiros?",
    lastTime: "hace 5 min",
    unread: 12,
    icon: "wind" as const,
    color: "#EDD9B8",
    gradient: ["#BF9B70", "#6B4E28"] as [string, string],
    moderator: "Sofía H.",
  },
  {
    id: "g2",
    name: "Cuencos y Frecuencias",
    description: "Todo sobre cuencos tibetanos, de cristal y terapia de sonido",
    members: 567,
    lastMsg: "Compartí fotos de mi set nuevo 🎶",
    lastTime: "hace 22 min",
    unread: 3,
    icon: "disc" as const,
    color: "#E8C87A",
    gradient: ["#7A5520", "#3E2208"] as [string, string],
    moderator: "Casa del Cuenco",
  },
  {
    id: "g3",
    name: "Sueños Lúcidos",
    description: "Técnicas y experiencias de lucidez onírica",
    members: 189,
    lastMsg: "Anoche lo logré por primera vez 🌙",
    lastTime: "hace 1h",
    unread: 0,
    icon: "moon" as const,
    color: "#C8B4E0",
    gradient: ["#4A3260", "#251633"] as [string, string],
    moderator: "Luna V.",
  },
  {
    id: "g4",
    name: "Camino del Alma",
    description: "Reflexiones sobre espiritualidad, propósito y vida consciente",
    members: 421,
    lastMsg: "Gracias por el espacio 🙏",
    lastTime: "hace 3h",
    unread: 0,
    icon: "sun" as const,
    color: "#F0CC82",
    gradient: ["#C49A52", "#7A5C20"] as [string, string],
    moderator: "Martín P.",
  },
];

export default function GruposScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [tab, setTab] = useState<"todos" | "mios">("todos");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerRow, { paddingHorizontal: 20 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Grupos</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Conversaciones sobre temas espirituales
          </Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { paddingHorizontal: 20, marginBottom: 24 }]}>
          {(["todos", "mios"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tab,
                { borderBottomColor: tab === t ? colors.primary : "transparent",
                  borderBottomWidth: 2 },
              ]}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
                {t === "todos" ? "Explorar" : "Mis grupos"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Groups list */}
        <View style={[styles.list, { paddingHorizontal: 20 }]}>
          {GRUPOS.map((g) => (
            <Pressable
              key={g.id}
              onPress={() => router.push(`/grupo/${g.id}` as never)}
              style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
            >
              {/* Icon */}
              <View style={styles.cardLeft}>
                <LinearGradient colors={g.gradient} style={styles.groupIcon}>
                  <Feather name={g.icon} size={22} color={g.color} />
                </LinearGradient>
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={[styles.groupName, { color: colors.foreground }]} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{g.lastTime}</Text>
                </View>
                <Text style={[styles.groupDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {g.lastMsg}
                </Text>
                <View style={styles.cardMeta}>
                  <Feather name="users" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{g.members}</Text>
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>· Mod. {g.moderator}</Text>
                </View>
              </View>

              {/* Unread badge */}
              {g.unread > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{g.unread}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable style={[styles.fab, { bottom: bottomPad + 24 }]}>
        <LinearGradient colors={["#D6A85B", "#C69B4F"]} style={styles.fabGrad}>
          <Feather name="plus" size={22} color="#1A0E06" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, height: 40 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  tabRow: { flexDirection: "row", gap: 24 },
  tab: { paddingVertical: 8 },
  tabText: { fontSize: 15, fontWeight: "600" },
  list: { gap: 12 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  cardLeft: {},
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1, gap: 3 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  groupName: { fontSize: 14, fontWeight: "700", flex: 1, marginRight: 8 },
  timeText: { fontSize: 11 },
  groupDesc: { fontSize: 12, lineHeight: 17 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { fontSize: 11 },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#1A0E06", fontSize: 11, fontWeight: "700" },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  fabGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
});
