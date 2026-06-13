/**
 * Geometrix — Aprende: lista de geometrías de una categoría
 * Ruta: /geometrix-aprende/[categoria]
 */
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import Svg, { Circle, Line, Polygon } from "react-native-svg";

import { LinearGradient } from "expo-linear-gradient";

import {
  GEOMETRIES,
  GEOMETRY_CATEGORIES,
  type GeometryCategory,
} from "@/data/geometries";
import { getGeometryLearn, CATEGORY_META } from "@/data/geometry-learn";
import { useColors } from "@/hooks/useColors";

const GEO_BG = ["#10091F", "#0E071A", "#070512"] as const;

function MiniGlyph({ id, color }: { id: string; color: string }) {
  // Flor de la Vida mini
  if (id === "flor-vida" || id === "semilla-vida") {
    const petals = Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3;
      return { cx: 14 + Math.cos(a) * 5, cy: 14 + Math.sin(a) * 5 };
    });
    return (
      <Svg width={28} height={28} viewBox="0 0 28 28">
        <Circle cx={14} cy={14} r={5} stroke={color} strokeWidth={1} fill="none" />
        {petals.map((p, i) => (
          <Circle key={i} cx={p.cx} cy={p.cy} r={5} stroke={color} strokeWidth={0.85} fill="none" opacity={0.6} />
        ))}
      </Svg>
    );
  }
  if (id === "metatron" || id === "metatron-expandido") {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (i * Math.PI) / 3;
      return { cx: 14 + Math.cos(a) * 8, cy: 14 + Math.sin(a) * 8 };
    });
    return (
      <Svg width={28} height={28} viewBox="0 0 28 28">
        {pts.map((p, i) => <Circle key={i} cx={p.cx} cy={p.cy} r={4} stroke={color} strokeWidth={0.8} fill="none" opacity={0.5} />)}
        <Circle cx={14} cy={14} r={4} stroke={color} strokeWidth={0.9} fill="none" />
        <Circle cx={14} cy={14} r={11} stroke={color} strokeWidth={0.6} fill="none" opacity={0.3} />
      </Svg>
    );
  }
  if (["tetraedro","hexaedro","octaedro","icosaedro","dodecaedro","cuboctaedro","vector-equilibrium","ivm","estrella-tetraedrica"].includes(id)) {
    return (
      <Svg width={28} height={28} viewBox="0 0 28 28">
        <Polygon points="14,3 24,9 24,20 14,25 4,20 4,9" stroke={color} strokeWidth={1} fill="none" opacity={0.65} />
        <Line x1={14} y1={3} x2={14} y2={14} stroke={color} strokeWidth={0.9} />
        <Line x1={4} y1={9} x2={14} y2={14} stroke={color} strokeWidth={0.9} />
        <Line x1={24} y1={9} x2={14} y2={14} stroke={color} strokeWidth={0.9} />
      </Svg>
    );
  }
  // Generic star / circle fallback
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28">
      <Circle cx={14} cy={14} r={9} stroke={color} strokeWidth={1} fill="none" opacity={0.6} />
      <Circle cx={14} cy={14} r={5} stroke={color} strokeWidth={0.8} fill="none" opacity={0.4} />
      <Circle cx={14} cy={14} r={2} fill={color} opacity={0.5} />
    </Svg>
  );
}

export default function GeometrixAprendeCategoriaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { categoria } = useLocalSearchParams<{ categoria: string }>();

  const catId = categoria as GeometryCategory;
  const catInfo = GEOMETRY_CATEGORIES.find((c) => c.id === catId);
  const meta = CATEGORY_META[catId];
  const geometrias = GEOMETRIES.filter((g) => g.category === catId);

  if (!catInfo) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <LinearGradient colors={GEO_BG} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
        <Text style={{ color: colors.mutedForeground }}>Categoría no encontrada</Text>
      </View>
    );
  }

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
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{catInfo.label}</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.countText, { color: colors.primary }]}>{geometrias.length}</Text>
        </View>
      </View>

      {/* Category hero */}
      <View style={[styles.hero, { backgroundColor: colors.primary + "0A" }]}>
        <MiniGlyph id={catId === "circulares" ? "flor-vida" : catId === "rectilineas" ? "hexaedro" : "espiral"} color={colors.primary} />
        <Text style={[styles.heroDesc, { color: "#b9b1ca" }]}>{meta?.desc}</Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.primary + "22" }]} />

      {/* List */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {geometrias.map((geo) => {
          const learn = getGeometryLearn(geo.id);
          return (
            <Pressable
              key={geo.id}
              style={({ pressed }) => [
                styles.item,
                {
                  backgroundColor: "rgba(123,100,255,0.05)",
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              onPress={() => router.push(`/geometrix-aprende/geometria/${geo.id}`)}
            >
              {/* Mini glyph */}
              <View style={[styles.glyphWrap, { backgroundColor: colors.primary + "0C" }]}>
                <MiniGlyph id={geo.id} color={colors.primary} />
              </View>

              {/* Text */}
              <View style={styles.itemText}>
                <View style={styles.itemRow}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{geo.name}</Text>
                  <View style={[styles.tag, { backgroundColor: colors.primary + "12" }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>{learn.tag}</Text>
                  </View>
                </View>
                <Text style={[styles.itemSummary, { color: "#b9b1ca" }]} numberOfLines={2}>{learn.summary}</Text>
              </View>

              <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 18, fontWeight: "700" },
  countBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { fontSize: 12, fontWeight: "600" },
  hero: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 20, marginBottom: 14,
    padding: 14, borderRadius: 12,
  },
  heroDesc: { flex: 1, fontSize: 12, lineHeight: 18 },
  divider: { height: 1, marginHorizontal: 20, marginBottom: 12 },
  list: { paddingHorizontal: 20, paddingTop: 4, gap: 10 },
  item: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 13, borderRadius: 13,
  },
  glyphWrap: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  itemText: { flex: 1 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  itemName: { fontSize: 14, fontWeight: "600", flexShrink: 1 },
  tag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontSize: 10, fontWeight: "500" },
  itemSummary: { fontSize: 11, lineHeight: 16 },
});
