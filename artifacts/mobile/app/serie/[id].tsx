import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PremiumBadge } from "@/components/PremiumBadge";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { usePremium } from "@/context/PremiumContext";
import { getSeriesById, getSeriesSessions } from "@/data/series";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const HERO_H = Math.round(width * 0.72);

export default function SerieScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const scrollY = useRef(new Animated.Value(0)).current;

  const series = getSeriesById(id);
  if (!series) return null;
  const sessions = getSeriesSessions(series);

  const headerOpacity = scrollY.interpolate({
    inputRange: [HERO_H - 60, HERO_H],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Sticky header */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad,
            backgroundColor: colors.background,
            borderBottomColor: "rgba(212,175,55,0.15)",
            opacity: headerOpacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.stickyInner} pointerEvents="box-none">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.stickyBack,
              { backgroundColor: colors.card, borderColor: "rgba(212,175,55,0.2)", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.stickyTitle, { color: colors.foreground }]} numberOfLines={1}>
            {series.title}
          </Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 120 }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Hero */}
        <View style={[styles.hero, { height: HERO_H }]}>
          <Image source={series.image} style={StyleSheet.absoluteFill} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
          <LinearGradient
            colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.45)", colors.background]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.heroBack,
              { top: topPad + 8, backgroundColor: "rgba(24,17,12,0.55)", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="arrow-left" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Intro */}
        <View style={styles.intro}>
          <Text style={[styles.kicker, { color: series.accentColor }]}>{series.subtitle.toUpperCase()}</Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>{series.title}</Text>
          <Text style={[styles.pageDesc, { color: colors.mutedForeground }]}>{series.description}</Text>
        </View>

        {/* Steps list */}
        <View style={styles.list}>
          {sessions.map((session, idx) => {
            const locked = !!session.isPremium && !isPremium;
            return (
              <Pressable
                key={session.id}
                onPress={() => router.push((locked ? "/membresia" : `/session/${session.id}`) as never)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: "rgba(74,12,12,0.08)",
                    borderColor: "rgba(212,175,55,0.14)",
                    opacity: pressed ? 0.82 : 1,
                  },
                ]}
              >
                <View style={[styles.dayBadge, { backgroundColor: series.accentColor + "22", borderColor: series.accentColor + "55" }]}>
                  <Text style={[styles.dayLabel, { color: series.accentColor }]}>{idx + 1}</Text>
                </View>
                <View style={[styles.thumb, { backgroundColor: colors.card }]}>
                  <Image source={session.image as number} style={StyleSheet.absoluteFill} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{session.durationLabel}</Text>
                  </View>
                  <PremiumBadge session={session} />
                </View>
                <View style={styles.meta}>
                  <Text style={[styles.dayKicker, { color: colors.mutedForeground }]}>Día {idx + 1}</Text>
                  <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>{session.title}</Text>
                  <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>{session.categoryLabel}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            );
          })}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
  },
  stickyInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    paddingTop: 10,
    gap: 12,
  },
  stickyBack: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyTitle: { fontSize: 17, fontWeight: "700", flex: 1 },

  hero: { width: "100%", overflow: "hidden" },
  heroBack: {
    position: "absolute",
    left: H_PAD,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  intro: {
    paddingHorizontal: H_PAD,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  pageDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },

  list: { paddingHorizontal: H_PAD, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 10,
    gap: 12,
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dayLabel: { fontSize: 13, fontWeight: "700" },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
  },
  durationBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  durationText: { color: "#FFFFFF", fontSize: 9, fontWeight: "600" },
  meta: { flex: 1 },
  dayKicker: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 3 },
  title: { fontSize: 14, fontWeight: "700", lineHeight: 19, marginBottom: 3 },
  sub: { fontSize: 11, lineHeight: 15 },
});
