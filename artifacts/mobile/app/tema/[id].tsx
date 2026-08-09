import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { GhostPill } from "@/components/GhostPill";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SessionCard } from "@/components/SessionCard";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { SESSIONS } from "@/data/sessions";
import { getTemaById } from "@/data/temas";

const { width } = Dimensions.get("window");
const H_PAD   = 20;
const HERO_H  = 260;
const CARD_W  = (width - H_PAD * 2 - 14) / 2;

const STICKY_START = HERO_H - 60;
const STICKY_END   = HERO_H;

export default function TemaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { theme: activeTheme } = useSceneTheme();
  const { isPremium } = usePremium();

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [STICKY_START, STICKY_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const tema = getTemaById(id ?? "");
  if (!tema) return null;

  const sessions = SESSIONS.filter((s) => {
    if (Array.isArray(s.temaTag) && s.temaTag.includes(tema.label)) return true;
    return (
      !!tema.themeTagMatch?.length &&
      Array.isArray(s.themeTag) &&
      s.themeTag.some((t) => tema.themeTagMatch!.includes(t))
    );
  });

  const displaySessions =
    sessions.length > 0
      ? sessions
      : SESSIONS.filter((s) => s.isFeatured || s.isNew).slice(0, 10);

  return (
    <LinearGradient style={styles.root} colors={activeTheme.gradient}>
      <StatusBar hidden />

      {/* ── STICKY HEADER ── */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad,
            backgroundColor: activeTheme.gradient[0],
            borderBottomColor: "rgba(80,42,247,0.07)",
            opacity: headerOpacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.stickyInner} pointerEvents="box-none">
          <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
          <Text style={[styles.stickyTitle, { color: colors.foreground }]} numberOfLines={1}>
            {tema.label}
          </Text>
          <View style={{ width: 38 }} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 120 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {/* ── HERO BANNER ── */}
        <View style={[styles.hero, { height: HERO_H }]}>
          {tema.image != null ? (
            <Image
              source={tema.image as number}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: tema.color + "33" }]} />
          )}
          {/* Floating back button */}
          <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} style={{ position: "absolute", left: H_PAD, top: topPad + 8 }} />
        </View>

        {/* ── TITLE + DESCRIPTION ── */}
        <View style={styles.intro}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>{tema.label}</Text>
          <Text style={[styles.pageDesc, { color: "#F4F4F4" }]} numberOfLines={1}>
            {tema.description}
          </Text>
        </View>

        {/* ── CARD GRID ── */}
        <View style={styles.sessionGrid}>
          {displaySessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              width={CARD_W}
              style={{ marginRight: 0 }}
              showDuration={false}
              showAuthorAvatar={false}
              overridePress={() => {
                if (s.isPremium && !isPremium) { router.push("/membresia" as never); return; }
                router.push(`/session/${s.id}` as never);
              }}
            />
          ))}
        </View>

        {displaySessions.length === 0 && (
          <View style={styles.empty}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Próximamente</Text>
          </View>
        )}
      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flex: 1 },

  // Sticky header
  stickyHeader: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
  },
  stickyInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    paddingTop: 10,
  },
  pillBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  // Hero
  hero: { width: "100%", overflow: "hidden" },

  // Intro
  intro: {
    paddingHorizontal: H_PAD,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  pageTitle: {
    fontFamily: "Manrope",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
    textAlign: "center",
  },
  pageDesc: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },

  // Session grid
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    rowGap: 35,
    marginBottom: 40,
  },

  empty: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontFamily: "Manrope", fontSize: 15, fontWeight: "600" },
});
