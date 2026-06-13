/**
 * Geometrix — Aprende: pantalla principal con listado de categorías
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Polygon, Rect } from "react-native-svg";

import { LinearGradient } from "expo-linear-gradient";

import { GEOMETRY_CATEGORIES, type GeometryCategory } from "@/data/geometries";
import { CATEGORY_META } from "@/data/geometry-learn";
import { useColors } from "@/hooks/useColors";

const GEO_BG = ["#251646", "#1F113C", "#110C2A"] as const;

// ── Íconos SVG por categoría ─────────────────────────────────────────────────
function CategoryIcon({ id, color }: { id: GeometryCategory; color: string }) {
  if (id === "circulares") {
    // Flor de la Vida simplificada
    const petals = Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3;
      return { cx: 18 + Math.cos(a) * 8, cy: 18 + Math.sin(a) * 8 };
    });
    return (
      <Svg width={36} height={36} viewBox="0 0 36 36">
        <Circle cx={18} cy={18} r={8} stroke={color} strokeWidth={1.2} fill="none" />
        {petals.map((p, i) => (
          <Circle key={i} cx={p.cx} cy={p.cy} r={8} stroke={color} strokeWidth={1.1} fill="none" opacity={0.65} />
        ))}
      </Svg>
    );
  }
  if (id === "rectilineas") {
    // Cubo axonométrico
    return (
      <Svg width={36} height={36} viewBox="0 0 36 36">
        <Polygon points="18,4 30,11 30,25 18,32 6,25 6,11" stroke={color} strokeWidth={1.2} fill="none" opacity={0.6} />
        <Line x1={18} y1={4} x2={18} y2={18} stroke={color} strokeWidth={1.1} />
        <Line x1={6} y1={11} x2={18} y2={18} stroke={color} strokeWidth={1.1} />
        <Line x1={30} y1={11} x2={18} y2={18} stroke={color} strokeWidth={1.1} />
      </Svg>
    );
  }
  // formas — pentagrama
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    return [18 + Math.cos(a) * 13, 18 + Math.sin(a) * 13];
  });
  const star = [pts[0], pts[2], pts[4], pts[1], pts[3]].map((p) => p.join(",")).join(" ");
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36">
      <Polygon points={star} stroke={color} strokeWidth={1.2} fill="none" opacity={0.75} />
    </Svg>
  );
}

export default function GeometrixAprendeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={GEO_BG} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { borderColor: colors.primary + "30" }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Aprende</Text>
        <Pressable style={[styles.iconBtn, { borderColor: colors.primary + "30" }]} hitSlop={8}>
          <Feather name="search" size={17} color={colors.primary} />
        </Pressable>
      </View>

      {/* Intro */}
      <Text style={[styles.intro, { color: "#BBA8E8" }]}>
        Descubre el significado y origen de cada forma sagrada. Elige una categoría para comenzar.
      </Text>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.primary + "22" }]} />

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {GEOMETRY_CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat.id];
          return (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: "rgba(123,100,255,0.05)",
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={() =>
                router.push(`/geometrix-aprende/${cat.id}`)
              }
            >
              {/* Icon */}
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + "0D" }]}>
                <CategoryIcon id={cat.id} color={colors.primary} />
              </View>

              {/* Text */}
              <View style={styles.cardText}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{cat.label}</Text>
                  <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{meta.count}</Text>
                  </View>
                </View>
                <Text style={[styles.cardDesc, { color: "#BBA8E8" }]}>{meta.desc}</Text>
              </View>

              {/* Chevron */}
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          );
        })}

        {/* Coming soon */}
        <View style={styles.comingSoon}>
          <View style={styles.csIcon}>
            <Feather name="clock" size={16} color={colors.primary + "55"} />
          </View>
          <View>
            <Text style={[styles.csTitle, { color: colors.foreground + "55" }]}>Más categorías próximamente</Text>
            <Text style={[styles.csDesc, { color: "#BBA8E880" }]}>Mandalas, Espirales, Fractales…</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 20, fontWeight: "700" },
  intro: { fontSize: 13, lineHeight: 20, paddingHorizontal: 22, marginBottom: 16 },
  divider: { height: 1, marginHorizontal: 20, marginBottom: 16 },
  list: { paddingHorizontal: 20, paddingTop: 4, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
  },
  iconWrap: {
    width: 58, height: 58, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  cardDesc: { fontSize: 12, lineHeight: 18 },
  comingSoon: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16,
  },
  csIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  csTitle: { fontSize: 13, fontWeight: "600" },
  csDesc: { fontSize: 11, marginTop: 2 },
});
