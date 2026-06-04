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

const CITIES = ["Todas", "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Madrid", "Barcelona"];

const ACTIVITIES = [
  {
    id: "1",
    title: "Baño de Cuencos al Atardecer",
    organizer: "Sofía Herrera",
    city: "Buenos Aires",
    date: "Sáb 31 mayo · 18:00",
    type: "Presencial",
    attendees: 12,
    icon: "disc" as const,
    color: "#f4c993",
    gradient: ["#7A5520", "#3E2208"] as [string, string],
  },
  {
    id: "2",
    title: "Meditación Grupal en Parque",
    organizer: "Martín Paz",
    city: "Córdoba",
    date: "Dom 1 jun · 09:00",
    type: "Presencial",
    attendees: 8,
    icon: "wind" as const,
    color: "#A8C4A8",
    gradient: ["#3A5438", "#1E2E1C"] as [string, string],
  },
  {
    id: "3",
    title: "Círculo de Gong — Ciclo Lunar",
    organizer: "Luna Vega",
    city: "Madrid",
    date: "Vie 6 jun · 20:00",
    type: "Presencial",
    attendees: 20,
    icon: "circle" as const,
    color: "#C8B4E0",
    gradient: ["#4A3260", "#251633"] as [string, string],
  },
  {
    id: "4",
    title: "Retiro de Silencio — Weekend",
    organizer: "Casa del Cuenco",
    city: "Mendoza",
    date: "14–15 jun",
    type: "Retiro",
    attendees: 16,
    icon: "feather" as const,
    color: "#A8C4A8",
    gradient: ["#3A5438", "#1E2E1C"] as [string, string],
  },
];

export default function ActividadesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [cityFilter, setCityFilter] = useState("Todas");

  const filtered = cityFilter === "Todas" ? ACTIVITIES : ACTIVITIES.filter(a => a.city === cityFilter);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 80, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Actividades Expansivas</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Conecta con practicantes cerca de ti
        </Text>

        {/* City filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={{ marginBottom: 24 }}
        >
          {CITIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCityFilter(c)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: cityFilter === c ? colors.primary : colors.card,
                  borderColor: cityFilter === c ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: cityFilter === c ? "#080F0A" : colors.mutedForeground }]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Activities */}
        <View style={styles.list}>
          {filtered.map((act) => (
            <Pressable
              key={act.id}
              onPress={() => router.push(`/actividad/${act.id}` as never)}
              style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient colors={act.gradient} style={styles.cardAccent} />
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {act.title}
                </Text>
                <Text style={[styles.cardOrg, { color: colors.accent }]}>{act.organizer}</Text>
                <View style={styles.cardMeta}>
                  <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>{act.city}</Text>
                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>·</Text>
                  <Feather name="calendar" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>{act.date}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <View style={[styles.typeBadge, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{act.type}</Text>
                  </View>
                  <View style={styles.attendeesRow}>
                    <Feather name="users" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.attendeesText, { color: colors.mutedForeground }]}>
                      {act.attendees} anotados
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={[styles.fab, { bottom: bottomPad + 24 }]}
        onPress={() => router.push("/crear-actividad" as never)}
      >
        <LinearGradient colors={["#C8C1B5", "#BE9650"]} style={styles.fabGrad}>
          <Feather name="plus" size={22} color="#080F0A" />
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
  filterRow: { gap: 8, paddingRight: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  list: { gap: 14 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    alignItems: "center",
    paddingRight: 16,
  },
  cardAccent: { width: 4, alignSelf: "stretch" },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    margin: 14,
  },
  cardBody: { flex: 1, paddingVertical: 14, paddingLeft: 14, gap: 4 },
  cardTitle: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  cardOrg: { fontSize: 11, fontWeight: "600" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  cardMetaText: { fontSize: 11 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: "700" },
  attendeesRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  attendeesText: { fontSize: 11 },
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
