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
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";

const REQUESTS = [
  { id: "r1", name: "Valentina Ríos", mutual: 3, initials: "VR", color: "#D4709A" },
  { id: "r2", name: "Tomás Blanco", mutual: 1, initials: "TB", color: "#8AAAD4" },
];

const FRIENDS = [
  { id: "f1", name: "Sofía Herrera", activity: "Escuchando · Ondas Delta", initials: "SH", color: "#E8C87A" },
  { id: "f2", name: "Martín Paz", activity: "Activo hace 2h", initials: "MP", color: "#A8C4A8" },
  { id: "f3", name: "Luna Vega", activity: "Escuchando · El Lago de Cristal", initials: "LV", color: "#C8B4E0" },
  { id: "f4", name: "Carlos Medina", activity: "Activo ayer", initials: "CM", color: "#EDD9B8" },
];

export default function AmigosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [search, setSearch] = useState("");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Amigos</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Conectá con practicantes de tu comunidad
        </Text>

        {/* Search */}
        <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o usuario..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>

        {/* Solicitudes */}
        {REQUESTS.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Solicitudes · {REQUESTS.length}
            </Text>
            {REQUESTS.map((r) => (
              <View key={r.id} style={[styles.requestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.avatar, { backgroundColor: r.color + "33" }]}>
                  <Text style={[styles.initials, { color: r.color }]}>{r.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.friendName, { color: colors.foreground }]}>{r.name}</Text>
                  <Text style={[styles.friendSub, { color: colors.mutedForeground }]}>
                    {r.mutual} amigos en común
                  </Text>
                </View>
                <View style={styles.requestBtns}>
                  <Pressable style={styles.acceptBtn}>
                    <LinearGradient colors={["#D6A85B", "#C69B4F"]} style={styles.acceptGrad}>
                      <Feather name="check" size={14} color="#1A0E06" />
                    </LinearGradient>
                  </Pressable>
                  <Pressable style={[styles.rejectBtn, { borderColor: colors.border }]}>
                    <Feather name="x" size={14} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Amigos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Mis amigos · {FRIENDS.length}
          </Text>
          {FRIENDS.map((f) => (
            <Pressable
              key={f.id}
              style={({ pressed }) => [styles.friendRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[styles.avatar, { backgroundColor: f.color + "33" }]}>
                <Text style={[styles.initials, { color: f.color }]}>{f.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.friendName, { color: colors.foreground }]}>{f.name}</Text>
                <Text style={[styles.friendSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {f.activity}
                </Text>
              </View>
              <Feather name="more-horizontal" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        {/* Agregar */}
        <Pressable style={({ pressed }) => [styles.addBtn, { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
          <Feather name="user-plus" size={16} color={colors.primary} />
          <Text style={[styles.addText, { color: colors.primary }]}>Agregar amigo por usuario</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, height: 40 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 28,
  },
  searchInput: { flex: 1, fontSize: 14 },
  section: { marginBottom: 28, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 15, fontWeight: "700" },
  friendName: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  friendSub: { fontSize: 12 },
  requestBtns: { flexDirection: "row", gap: 8 },
  acceptBtn: { width: 34, height: 34, borderRadius: 10, overflow: "hidden" },
  acceptGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
  rejectBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    borderStyle: "dashed",
    paddingVertical: 14,
  },
  addText: { fontSize: 14, fontWeight: "600" },
});
