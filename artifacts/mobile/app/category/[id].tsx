import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ZenStonesIcon } from "@/components/ZenStonesIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { CATEGORIES } from "@/data/categories";
import { getSessionsByCategory } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const category = CATEGORIES.find((c) => c.id === id);
  const allSessions = getSessionsByCategory(id ?? "");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
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
        </View>

        {/* Category Hero */}
        {category && (
          <View style={[styles.heroCard, { borderColor: "rgba(212,175,55,0.20)" }]}>
            <LinearGradient
              colors={[category.gradient[1], category.gradient[1]] as [string, string]}
              style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
            />
            <View
              style={[
                styles.iconBg,
                { backgroundColor: "rgba(212,175,55,0.15)", borderColor: "rgba(212,175,55,0.25)" },
              ]}
            >
              {category.id === "meditaciones-guiadas" ? (
                <ZenStonesIcon color={category.color} size={28} />
              ) : category.id === "musica-sonidos" ? (
                <Image source={require("../../assets/images/cat-musica.png")} style={{ width: 28, height: 28 }} resizeMode="contain" />
              ) : category.id === "mananas" ? (
                <Image source={require("../../assets/images/cat-mananas.png")} style={{ width: 28, height: 28 }} resizeMode="contain" />
              ) : category.id === "noches" ? (
                <Image source={require("../../assets/images/cat-noches.png")} style={{ width: 26, height: 26 }} resizeMode="contain" />
              ) : category.id === "podcast" ? (
                <Image source={require("../../assets/images/cat-sonidos.png")} style={{ width: 28, height: 28 }} resizeMode="contain" />
              ) : category.iconFamily === "MaterialCommunityIcons" ? (
                <MaterialCommunityIcons
                  name={category.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                  size={28}
                  color={category.color}
                />
              ) : (
                <Feather
                  name={category.icon as React.ComponentProps<typeof Feather>["name"]}
                  size={28}
                  color={category.color}
                />
              )}
            </View>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>{category.title}</Text>
            <Text style={[styles.heroSub, { color: colors.foreground }]}>
              {category.subtitle}
            </Text>
            <View style={styles.heroMeta}>
              <View style={[styles.metaBadge, { backgroundColor: "rgba(212,175,55,0.15)" }]}>
                <Text style={[styles.metaBadgeText, { color: colors.accent }]}>
                  {allSessions.length} Sesiones
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Sessions */}
        <View style={styles.sessionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {allSessions.length} Sesiones
          </Text>
          {allSessions.map((s) => (
            <SessionCard key={s.id} session={s} horizontal />
          ))}
          {allSessions.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="music" size={40} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Próximamente
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    overflow: "hidden",
    marginBottom: 28,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 32,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  heroMeta: {
    flexDirection: "row",
    gap: 8,
  },
  metaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sessionsSection: {
    gap: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
});
