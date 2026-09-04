import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { TAG_CARDS, THEME_CARD_OVERLAY_BY_SLUG } from "@/data/tags";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 12;
const TAG_W = (width - H_PAD * 2 - GAP) / 2;
const TAG_H = 116;

export default function TodasLasTemáticasScreen() {
  const overlayBack = useBackOverride();
  const goBack = () => (overlayBack ? overlayBack() : router.back());
  const overlay = useCategoryOverlayOptional();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <BackPill onPress={goBack} size={28} bgColor="rgba(45,28,82,0.6)" iconOffsetX={-1} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>Todas las Temáticas</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {TAG_CARDS.length} temáticas disponibles
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {TAG_CARDS.map((tag) => (
            <Pressable
              key={tag.id}
              onPress={() => (overlay ? overlay.openCategory(`/tag/${tag.id}`) : router.push(`/tag/${tag.id}` as never))}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Image
                source={tag.image}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
                cachePolicy="memory-disk"
              />
              <LinearGradient
                colors={
                  THEME_CARD_OVERLAY_BY_SLUG[tag.id]
                  ?? ["rgba(24,24,36,0.18)", "rgba(6,6,12,0.34)"]
                }
                locations={[0, 1]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.label} numberOfLines={2}>{tag.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 18,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: { flex: 1 },
  title: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: H_PAD,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  card: {
    width: TAG_W,
    height: TAG_H,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  label: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
