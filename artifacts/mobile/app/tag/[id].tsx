import { Feather } from "@expo/vector-icons";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { TAG_CARDS } from "@/data/tags";
import { useColors } from "@/hooks/useColors";

export default function TagScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const tag = TAG_CARDS.find((t) => t.id === id);

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
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        {/* Hero */}
        {tag && (
          <View style={styles.heroCard}>
            <Image source={tag.image} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(10,6,4,0.18)", "rgba(10,6,4,0.72)"]}
              style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
            />
            <View style={[StyleSheet.absoluteFill, { borderRadius: 22, borderWidth: 1, borderColor: "rgba(198,155,79,0.25)" }]} />
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>{tag.label}</Text>
          </View>
        )}

        {/* Sesiones — próximamente */}
        <View style={[styles.emptyWrap, { borderColor: "rgba(198,155,79,0.15)", backgroundColor: colors.card }]}>
          <Feather name="music" size={32} color={colors.primary} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Sesiones en camino
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Estamos preparando contenido especial para "{tag?.label}".{"\n"}¡Muy pronto aquí!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroCard: {
    height: 180,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  } as object,
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    paddingHorizontal: 20,
  },
  emptyWrap: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
