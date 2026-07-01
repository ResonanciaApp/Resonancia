import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GhostPill } from "@/components/GhostPill";

const { width } = Dimensions.get("window");
const H_PAD = 15;
const GAP   = 10;
const CELL_W = (width - H_PAD * 2 - GAP) / 2;
const CELL_H = CELL_W * 0.62;

const ANCESTRAL_GRID = [
  { slug: "cuencos",    title: "Cuencos",           image: require("@/assets/images/ancestral/cuencos.png") },
  { slug: "gongs",      title: "Gongs",              image: require("@/assets/images/ancestral/gongs.png") },
  { slug: "digeridoos", title: "Digeridoos",         image: require("@/assets/images/ancestral/digeridoos.png") },
  { slug: "tambores",   title: "Tambores",           image: require("@/assets/images/ancestral/tambores.png") },
  { slug: "naturaleza", title: "Sonidos Naturaleza", image: require("@/assets/images/ancestral/naturaleza.png") },
  { slug: "flautas",    title: "Flautas",            image: require("@/assets/images/ancestral/flautas.png") },
] as const;

export default function AncestralInstrumentos() {
  const insets = useSafeAreaInsets();
  const topPad = insets.top;
  const botPad = insets.bottom;

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#230610", "#16040A"]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <GhostPill>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
        </GhostPill>
        <Text style={styles.headerTitle}>Por Instrumento</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 + botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Explora sesiones según el instrumento principal</Text>

        <View style={styles.grid}>
          {ANCESTRAL_GRID.map((item) => (
            <Pressable
              key={item.slug}
              style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.82 : 1 }]}
              onPress={() => router.push(`/ancestral/${item.slug}` as never)}
            >
              <Image
                source={item.image}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
              />
              <LinearGradient
                colors={["rgba(0,0,0,0.08)", "rgba(0,0,0,0.65)"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.cellTitle}>{item.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#230610" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
    backgroundColor: "#230610",
  },
  headerBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 21, fontWeight: "700", color: "#fff", letterSpacing: 0.2 },

  content: { paddingTop: 24, paddingHorizontal: H_PAD },
  subtitle: {
    fontSize: 14,
    color: "rgba(250,240,238,0.55)",
    lineHeight: 20,
    marginBottom: 20,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  cell: {
    width: CELL_W,
    height: CELL_H,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  cellTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    paddingHorizontal: 6,
  },
});
