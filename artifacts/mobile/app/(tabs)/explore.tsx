import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
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

import { MessageDeck } from "@/components/MessageDeck";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { CATEGORIES } from "@/data/categories";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const COL_GAP = 12;
const COL_PAD = 20;
const CARD_W = (width - COL_PAD * 2 - COL_GAP) / 2;

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filters = ["Todos", "Cortas", "Sueño", "Sanación", "Guiadas"];

  const filteredSessions = SESSIONS.filter((s) => {
    const matchQuery =
      !query ||
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.categoryLabel.toLowerCase().includes(query.toLowerCase());
    const matchFilter =
      !activeFilter ||
      activeFilter === "Todos" ||
      (activeFilter === "Cortas" && s.duration <= 15) ||
      (activeFilter === "Sueño" && s.categoryId === "sleep-rest") ||
      (activeFilter === "Sanación" && s.categoryId === "sound-healing") ||
      (activeFilter === "Guiadas" && s.categoryId === "guided-meditations");
    return matchQuery && matchFilter;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: topPad + 12,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Biblioteca</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Descubre tu santuario sonoro
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar sesiones, cuencos, gongs..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((f) => {
            const active = activeFilter === f || (f === "Todos" && !activeFilter);
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f === "Todos" ? null : f)}
                style={[
                  styles.filterChip,
                  active
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {f}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {query || activeFilter ? (
          /* Search Results */
          <View style={styles.section}>
            <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>
              {filteredSessions.length} sesión{filteredSessions.length !== 1 ? "es" : ""} encontrada{filteredSessions.length !== 1 ? "s" : ""}
            </Text>
            {filteredSessions.map((s) => (
              <SessionCard key={s.id} session={s} horizontal />
            ))}
            {filteredSessions.length === 0 && (
              <View style={styles.emptyState}>
                <Feather name="search" size={40} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  Sin resultados
                </Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Prueba con otro término o filtro
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Categories Grid */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Explorar por Categoría
              </Text>
              <View style={styles.grid}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => router.push(`/category/${cat.id}` as never)}
                    style={({ pressed }) => [
                      styles.gridCard,
                      {
                        width: CARD_W,
                        opacity: pressed ? 0.82 : 1,
                        borderColor: "rgba(198,155,79,0.15)",
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={cat.gradient as [string, string]}
                      style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    />
                    <View
                      style={[
                        styles.gridIconBg,
                        { backgroundColor: "rgba(198,155,79,0.15)", borderColor: "rgba(198,155,79,0.3)" },
                      ]}
                    >
                      <Feather name={cat.icon as React.ComponentProps<typeof Feather>["name"]} size={20} color={cat.color} />
                    </View>
                    <Text style={[styles.gridTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {cat.title}
                    </Text>
                    <Text style={[styles.gridCount, { color: colors.accent }]}>
                      {cat.sessionCount} sesiones
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Un mensaje para ti */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Un mensaje para ti
              </Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                Deja que el universo te hable hoy
              </Text>
              <MessageDeck />
            </View>

            {/* All Sessions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Todas las Sesiones
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScroll}
              >
                {SESSIONS.slice(0, 8).map((s) => (
                  <SessionCard key={s.id} session={s} width={180} />
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 13,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 12,
    marginBottom: 20,
  },
  resultsLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: COL_GAP,
  },
  gridCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
    height: 140,
    justifyContent: "space-between",
  },
  gridIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
    flex: 1,
  },
  gridCount: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  hScroll: {
    paddingRight: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
  },
});
