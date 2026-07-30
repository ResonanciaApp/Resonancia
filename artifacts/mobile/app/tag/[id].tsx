import { Feather } from "@expo/vector-icons";
import { ListenGoldFill } from "@/components/GoldGradient";
import { GhostPill } from "@/components/GhostPill";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  type TextStyle,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PremiumBadge } from "@/components/PremiumBadge";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { TAG_CARDS } from "@/data/tags";
import { SESSIONS, type Session } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { useColors } from "@/hooks/useColors";

function sessionAuthor(session: Session): string {
  const guideId = session.guideIds?.[0] ?? session.guideId;
  if (guideId) return getGuide(guideId).name;
  return getArtist(session.artistId).name;
}

const { width } = Dimensions.get("window");
const H_PAD = 20;
const HERO_H = Math.round(width * 0.72);
const CARD_W = 150;
const CARD_IMG_H = 108;

const DURATION_FILTERS = [
  { label: "5–10 min",  min: 0,  max: 10  },
  { label: "10–20 min", min: 11, max: 20  },
  { label: "20–30 min", min: 21, max: 30  },
  { label: "30+ min",   min: 31, max: 9999 },
];

export default function TagScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();
  const { theme: activeTheme } = useSceneTheme();


  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const scrollY = useRef(new Animated.Value(0)).current;
  const [durationFilter, setDurationFilter] = useState<string | null>(null);

  const tag = TAG_CARDS.find((t) => t.id === id);

  // Sessions for this tag
  const tagSessions = SESSIONS.filter(
    (s) => Array.isArray(s.themeTag) && s.themeTag.includes(tag?.label as never)
  );

  // Fallback: show featured sessions if none assigned yet
  const displaySessions =
    tagSessions.length > 0
      ? tagSessions
      : SESSIONS.filter((s) => s.isFeatured || s.isNew).slice(0, 8);

  // Duration filter
  const filteredSessions = durationFilter
    ? (() => {
        const f = DURATION_FILTERS.find((d) => d.label === durationFilter);
        return f
          ? displaySessions.filter((s) => s.duration >= f.min && s.duration <= f.max)
          : displaySessions;
      })()
    : displaySessions;

  // "Más escuchados" = featured ones (or first 4)
  const topSessions = displaySessions
    .filter((s) => s.isFeatured)
    .concat(displaySessions.filter((s) => !s.isFeatured))
    .slice(0, 5);

  // Sticky header: empieza tarde, rango amplio (sutil, como pantalla de sesión)
  const headerOpacity = scrollY.interpolate({
    inputRange: [HERO_H * 0.72, HERO_H * 1.25],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  if (!tag) return null;

  return (
        <LinearGradient
      style={styles.root}
      colors={activeTheme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" />

      {/* ── STICKY HEADER (fades in on scroll) ── */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad,
            backgroundColor: activeTheme.gradient[0],
            borderBottomColor: "rgba(212,175,55,0.15)",
            opacity: headerOpacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.stickyInner} pointerEvents="box-none">
          <GhostPill>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.pillBtn}>
              <Feather name="arrow-left" size={16} color="#FFFFFF" />
            </Pressable>
          </GhostPill>
          <Text style={[styles.stickyTitle, { color: colors.foreground }]} numberOfLines={1}>
            {tag.label}
          </Text>
          <GhostPill>
            <Pressable hitSlop={10} style={styles.pillBtn} onPress={() => Alert.alert(tag.label, tag.description)}>
              <Feather name="info" size={16} color="rgba(255,255,255,0.85)" />
            </Pressable>
          </GhostPill>
        </View>
      </Animated.View>

      {/* ── SCROLLABLE CONTENT ── */}
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
        {/* HERO IMAGE */}
        <View style={[styles.hero, { height: HERO_H }]}>
          <Image source={tag.image} style={StyleSheet.absoluteFill} resizeMode="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
          <LinearGradient
            colors={["rgba(15,10,6,0)", "rgba(15,10,6,0.35)", "rgba(15,10,6,0.9)", "#0F0A06"]}
            locations={[0, 0.5, 0.88, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Back button floating on hero */}
          <GhostPill style={{ position: "absolute", left: H_PAD, top: topPad + 8 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={({ pressed }) => [styles.pillBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="arrow-left" size={16} color="#FFFFFF" />
            </Pressable>
          </GhostPill>
        </View>

        {/* TITLE + DESCRIPTION */}
        <View style={styles.intro}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>{tag.label}</Text>
          <Text style={[styles.pageDesc, { color: "#F4F4F4" }]}>{tag.description}</Text>
        </View>

        {/* DURATION FILTERS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <Pressable
            onPress={() => setDurationFilter(null)}
            style={[
              styles.filterPill,
              !durationFilter ? styles.filterPillSel : styles.filterPillIdle,
              { overflow: "hidden" },
            ]}
          >
            {!durationFilter && <ListenGoldFill />}
            <Text style={!durationFilter ? [styles.filterLabel, { color: colors.primaryForeground }] : styles.filterLabelIdle}>
              Todos
            </Text>
          </Pressable>
          {DURATION_FILTERS.map((f) => {
            const active = durationFilter === f.label;
            return (
              <Pressable
                key={f.label}
                onPress={() => setDurationFilter(active ? null : f.label)}
                style={[
                  styles.filterPill,
                  active ? styles.filterPillSel : styles.filterPillIdle,
                  { overflow: "hidden" },
                ]}
              >
                {active && <ListenGoldFill />}
                <Text style={active ? [styles.filterLabel, { color: colors.primaryForeground }] : styles.filterLabelIdle}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filteredSessions.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: "rgba(212,175,55,0.15)" }]}>
            <Feather name="inbox" size={28} color={colors.primary} style={{ marginBottom: 10 }} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin sesiones en este filtro</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Probá otra duración</Text>
          </View>
        ) : (
          <>
            {/* LOS MÁS ESCUCHADOS */}
            {!durationFilter && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Los más escuchados</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hScroll}
                >
                  {topSessions.map((session) => {
                    const locked = !!session.isPremium && !isPremium;
                    return (
                    <Pressable
                      key={session.id}
                      onPress={() => router.push((locked ? "/membresia" : `/session/${session.id}`) as never)}
                      style={({ pressed }) => [styles.hCard, { opacity: pressed ? 0.82 : 1 }]}
                    >
                      <View style={[styles.hCardImg, { backgroundColor: colors.card }]}>
                        <Image
                          source={session.image as number}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                          placeholder={BLUR_PLACEHOLDER}
                          transition={IMAGE_TRANSITION}
                        />
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>{session.durationLabel}</Text>
                        </View>
                        <PremiumBadge session={session} />
                      </View>
                      <Text style={[styles.hCardTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {session.title}
                      </Text>
                      <Text style={[styles.hCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {session.categoryLabel} · {sessionAuthor(session)}
                      </Text>
                    </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* TODOS */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Todos</Text>
              <View style={styles.list}>
                {filteredSessions.map((session) => {
                  const locked = !!session.isPremium && !isPremium;
                  return (
                  <Pressable
                    key={session.id}
                    onPress={() => router.push((locked ? "/membresia" : `/session/${session.id}`) as never)}
                    style={({ pressed }) => [
                      styles.listRow,
                      { backgroundColor: "rgba(255,255,255,0.075)", opacity: pressed ? 0.82 : 1 },
                    ]}
                  >
                    <View style={[styles.listThumb, { backgroundColor: colors.card }]}>
                      <Image
                        source={session.image as number}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        placeholder={BLUR_PLACEHOLDER}
                        transition={IMAGE_TRANSITION}
                      />
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{session.durationLabel}</Text>
                      </View>
                      <PremiumBadge session={session} />
                    </View>
                    <View style={styles.listMeta}>
                      <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {session.title}
                      </Text>
                      <Text style={[styles.listSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {session.categoryLabel} · {sessionAuthor(session)}
                      </Text>
                    </View>
                  </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Sticky header
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
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    paddingTop: 10,
  },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  scroll: { flex: 1 },

  // Hero
  hero: {
    width: "100%",
    overflow: "hidden",
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // Intro
  intro: {
    paddingHorizontal: H_PAD,
    paddingTop: 24,
    paddingBottom: 8,
    alignItems: "center",
  },
  pageTitle: {
    fontFamily: "Manrope",
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  pageDesc: {
    fontFamily: "Manrope",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },

  // Duration filters
  filtersRow: {
    paddingHorizontal: H_PAD,
    paddingVertical: 20,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 18,
    borderRadius: 999,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillSel: {
    borderWidth: 0,
  },
  filterPillIdle: {
    paddingHorizontal: 13,
    backgroundColor: "rgba(255,255,255,0.053)",
    borderWidth: 1,
    borderColor: "rgba(247,203,107,0.1)",
  },
  filterLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  filterLabelIdle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "450" as TextStyle["fontWeight"],
    letterSpacing: 0.3,
    color: "#F4F4F4",
  },

  // Section
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },

  // Horizontal cards
  hScroll: {
    paddingHorizontal: H_PAD,
    gap: 12,
  },
  hCard: {
    width: CARD_W,
  },
  hCardImg: {
    width: CARD_W,
    height: CARD_IMG_H,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
  },
  hCardTitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 3,
  },
  hCardSub: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 15,
  },

  // Duration badge (on image)
  durationBadge: {
    position: "absolute",
    bottom: 7,
    left: 7,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },


  // Todos list
  list: {
    paddingHorizontal: H_PAD,
    gap: 10,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 0,
    padding: 10,
    gap: 12,
  },
  listThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
  },
  listMeta: {
    flex: 1,
  },
  listTitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 5,
  },
  listSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 16,
  },

  // Empty
  emptyBox: {
    marginHorizontal: H_PAD,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 44,
    alignItems: "center",
    marginTop: 8,
  },
  emptyTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptySub: { fontFamily: "Manrope", fontSize: 13 },
});
