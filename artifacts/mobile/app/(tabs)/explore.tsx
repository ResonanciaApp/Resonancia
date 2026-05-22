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

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { CATEGORIES, getPrimaryCategories, getSecondaryCategories } from "@/data/categories";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 10;
const PRIMARY_W = (width - H_PAD * 2 - GAP) / 2;
const SEC_W = 88;

const TIME_BUCKETS = [
  { label: "5 min",  min: 0,   max: 5   },
  { label: "10 min", min: 6,   max: 10  },
  { label: "15 min", min: 11,  max: 15  },
  { label: "20 min", min: 16,  max: 20  },
  { label: "30 min", min: 21,  max: 30  },
  { label: "30+ min",min: 31,  max: 9999},
];

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredSessions = SESSIONS.filter((s) => {
    if (!query) return false;
    const q = query.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.categoryLabel.toLowerCase().includes(q) ||
      s.subtitle.toLowerCase().includes(q)
    );
  });

  function handleTimeBucket(bucket: typeof TIME_BUCKETS[number]) {
    router.push({
      pathname: "/medita-tiempo",
      params: { min: String(bucket.min), max: String(bucket.max), label: bucket.label },
    } as never);
  }

  const primaryCats = getPrimaryCategories();
  const secondaryCats = getSecondaryCategories();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Biblioteca</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Descubre tu santuario sonoro
          </Text>
        </View>

        {/* ── Search bar ── */}
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

        {/* ── Search results ── */}
        {query.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>
              {filteredSessions.length} sesión{filteredSessions.length !== 1 ? "es" : ""} encontrada{filteredSessions.length !== 1 ? "s" : ""}
            </Text>
            {filteredSessions.map((s) => (
              <SessionCard key={s.id} session={s} horizontal />
            ))}
            {filteredSessions.length === 0 && (
              <View style={styles.emptyState}>
                <Feather name="search" size={36} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin resultados</Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  Prueba con otro término
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* ── Categorías ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Categorías</Text>

              {/* Primarias — 2 columnas, tarjetas grandes */}
              <View style={styles.primaryRow}>
                {primaryCats.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => router.push(`/category/${cat.id}` as never)}
                    style={({ pressed }) => [styles.primaryCard, { width: PRIMARY_W, opacity: pressed ? 0.82 : 1 }]}
                  >
                    <LinearGradient
                      colors={cat.gradient as [string, string]}
                      style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                    />
                    <View style={[styles.primaryBorder, { borderColor: "rgba(255,220,140,0.15)" }]} />
                    <Feather
                      name={cat.icon as React.ComponentProps<typeof Feather>["name"]}
                      size={38}
                      color={cat.color}
                      style={styles.primaryIcon}
                    />
                    <Text style={styles.primaryLabel} numberOfLines={2}>{cat.title}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Secundarias — scroll horizontal, tarjetas compactas */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.secondaryScroll}
              >
                {secondaryCats.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => router.push(`/category/${cat.id}` as never)}
                    style={({ pressed }) => [styles.secondaryCard, { width: SEC_W, opacity: pressed ? 0.82 : 1 }]}
                  >
                    <LinearGradient
                      colors={cat.gradient as [string, string]}
                      style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                    />
                    <View style={[styles.secondaryBorder, { borderColor: "rgba(255,220,140,0.12)" }]} />
                    <Feather
                      name={cat.icon as React.ComponentProps<typeof Feather>["name"]}
                      size={26}
                      color={cat.color}
                      style={styles.secondaryIcon}
                    />
                    <Text style={styles.secondaryLabel} numberOfLines={2}>{cat.title}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* ── ¿Cuánto tiempo tienes? ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>¿Cuánto tiempo tienes?</Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                Elige y te mostraremos las sesiones que encajan
              </Text>
              <View style={styles.timeGrid}>
                {TIME_BUCKETS.map((bucket) => (
                  <Pressable
                    key={bucket.label}
                    onPress={() => handleTimeBucket(bucket)}
                    style={({ pressed }) => [
                      styles.timeChip,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.primary + "44",
                        opacity: pressed ? 0.78 : 1,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={["rgba(198,155,79,0.1)", "rgba(198,155,79,0.03)"]}
                      style={[StyleSheet.absoluteFill, { borderRadius: 14 }]}
                    />
                    <Feather name="clock" size={14} color={colors.primary} style={styles.timeIcon} />
                    <Text style={[styles.timeLabel, { color: colors.foreground }]}>{bucket.label}</Text>
                  </Pressable>
                ))}
              </View>
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

  header: { paddingHorizontal: H_PAD, marginBottom: 18 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontSize: 13 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_PAD,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginBottom: 24,
  },
  searchInput: { flex: 1, fontSize: 14 },

  section: { paddingHorizontal: H_PAD, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3, marginBottom: 6 },
  sectionSub: { fontSize: 12, marginBottom: 16 },

  resultsLabel: { fontSize: 12, marginBottom: 12 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptySub: { fontSize: 13 },

  // Primary categories
  primaryRow: {
    flexDirection: "row",
    gap: GAP,
    marginBottom: 10,
  },
  primaryCard: {
    height: 148,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  primaryBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
  },
  primaryIcon: { marginBottom: 12 },
  primaryLabel: {
    color: "#F5EDD8",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },

  // Secondary categories
  secondaryScroll: { gap: GAP, paddingRight: 4 },
  secondaryCard: {
    height: 100,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  secondaryBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryIcon: { marginBottom: 8 },
  secondaryLabel: {
    color: "#F5EDD8",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
  },

  // Time buckets
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeChip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    minWidth: (width - H_PAD * 2 - 10) / 3,
    justifyContent: "center",
  },
  timeIcon: { marginRight: 6 },
  timeLabel: { fontSize: 14, fontWeight: "600" },
});
