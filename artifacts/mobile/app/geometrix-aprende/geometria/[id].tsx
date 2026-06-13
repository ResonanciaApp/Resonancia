/**
 * Geometrix — Aprende: detalle de una geometría específica
 * Ruta: /geometrix-aprende/geometria/[id]
 */
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { GEOMETRIES, type GeometryId } from "@/data/geometries";
import { getGeometryLearn } from "@/data/geometry-learn";
import { useColors } from "@/hooks/useColors";

// ── Glifo animado genérico (Flor de la Vida) ─────────────────────────────────
function HeroGlyph({ id, color, pulseAnim }: { id: string; color: string; pulseAnim: Animated.Value }) {
  // Para cada geometría, mostrar el glifo correspondiente de SacredGlyph en el futuro.
  // Por ahora renderizamos un SVG sencillo acorde a la categoría.
  const petals = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3;
    return { cx: 110 + Math.cos(a) * 38, cy: 110 + Math.sin(a) * 38 };
  });
  const outer = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return { cx: 110 + Math.cos(a) * 76, cy: 110 + Math.sin(a) * 76 };
  });
  return (
    <Animated.View style={{ opacity: pulseAnim }}>
      <Svg width={220} height={220} viewBox="0 0 220 220">
        <Defs>
          <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={110} cy={110} r={100} fill="url(#heroGlow)" />
        {outer.map((p, i) => <Circle key={i} cx={p.cx} cy={p.cy} r={38} stroke={color} strokeWidth={0.7} fill="none" opacity={0.15} />)}
        {petals.map((p, i) => <Circle key={i} cx={p.cx} cy={p.cy} r={38} stroke={color} strokeWidth={1.2} fill="none" opacity={0.6} />)}
        <Circle cx={110} cy={110} r={38} stroke={color} strokeWidth={1.5} fill="none" opacity={0.85} />
        <Circle cx={110} cy={110} r={76} stroke={color} strokeWidth={0.9} fill="none" opacity={0.25} />
        <Circle cx={110} cy={110} r={4} fill={color} opacity={0.7} />
        {petals.map((p, i) => <Circle key={i} cx={p.cx} cy={p.cy} r={3} fill={color} opacity={0.4} />)}
      </Svg>
    </Animated.View>
  );
}

export default function GeometrixAprendeDetalleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const geoId = id as GeometryId;
  const geo = GEOMETRIES.find((g) => g.id === geoId);
  const learn = getGeometryLearn(geoId);

  // Pulso continuo
  const pulseAnim = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 2200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  if (!geo) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <LinearGradient colors={["#0B0714", "#030306"]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
        <Text style={{ color: colors.mutedForeground }}>Geometría no encontrada</Text>
      </View>
    );
  }

  const paragraphs = learn.description.split("\n\n").filter(Boolean);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#0B0714", "#030306"]} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
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
        <Text style={[styles.headerTitle, { color: "#c0bae0" }]} numberOfLines={1}>
          {geo.category === "circulares" ? "Circulares" : geo.category === "rectilineas" ? "Rectilíneas" : "Combinaciones"}
        </Text>
        <Pressable style={[styles.iconBtn, { borderColor: colors.primary + "30" }]} hitSlop={8}>
          <Feather name="star" size={16} color={colors.mutedForeground} />
        </Pressable>
        <Pressable style={[styles.iconBtn, { borderColor: colors.primary + "30" }]} hitSlop={8}>
          <Feather name="share-2" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[colors.primary + "14", "transparent"]}
          style={styles.heroGradient}
        >
          <View style={styles.glyphContainer}>
            <HeroGlyph id={geoId} color={colors.primary} pulseAnim={pulseAnim} />
          </View>

          <Text style={[styles.geoName, { color: colors.foreground }]}>{geo.name}</Text>

          <View style={styles.tagsRow}>
            {learn.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + "15" }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.primary + "22" }]} />

        {/* Attributes grid */}
        <View style={styles.attrGrid}>
          {learn.attributes.map((attr) => (
            <View key={attr.label} style={[styles.attrCard, { backgroundColor: "rgba(255,255,255,0.03)" }]}>
              <Text style={[styles.attrLabel, { color: "#c0bae0" }]}>{attr.label}</Text>
              <Text style={[styles.attrValue, { color: colors.foreground }]}>{attr.value}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>✦  Sobre esta geometría</Text>
          {paragraphs.map((para, i) => (
            <Text key={i} style={[styles.para, { color: "#c0bae0" }]}>{para}</Text>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              // Navega al editor de Geometrix con esta forma preseleccionada
              router.push({ pathname: "/(tabs)/geometrix", params: { preloadId: geoId } });
            }}
          >
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Feather name="plus-circle" size={16} color="#0B0F14" />
              <Text style={styles.ctaText}>Crear con esta forma</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={[styles.ctaSecondary, { backgroundColor: "rgba(255,255,255,0.03)" }]} hitSlop={4}>
            <Feather name="download" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 4 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 14 },
  scroll: { paddingTop: 0 },
  heroGradient: { alignItems: "center", paddingTop: 12, paddingBottom: 20, paddingHorizontal: 24 },
  glyphContainer: { marginBottom: 12 },
  geoName: { fontSize: 24, fontWeight: "700", letterSpacing: 0.4, marginBottom: 10 },
  tagsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", justifyContent: "center" },
  tag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  tagText: { fontSize: 11, fontWeight: "500" },
  divider: { height: 1, marginHorizontal: 20, marginBottom: 16 },
  attrGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  attrCard: { width: "47.5%", padding: 12, borderRadius: 12 },
  attrLabel: { fontSize: 9, fontWeight: "500", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 },
  attrValue: { fontSize: 12, fontWeight: "600", lineHeight: 16 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 },
  para: { fontSize: 13, lineHeight: 21, marginBottom: 12 },
  cta: { flexDirection: "row", gap: 10, paddingHorizontal: 20 },
  ctaBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  ctaGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50 },
  ctaText: { fontSize: 14, fontWeight: "700", color: "#0B0F14" },
  ctaSecondary: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
});
