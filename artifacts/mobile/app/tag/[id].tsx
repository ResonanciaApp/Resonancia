import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { GhostPill } from "@/components/GhostPill";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import React, { useRef, useState } from "react";
import {
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
import { SessionCard } from "@/components/SessionCard";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
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

export default function TagScreen({ id: idProp }: { id?: string } = {}) {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = idProp ?? idParam;
  const overlayBack = useBackOverride();
  const goBack = () => (overlayBack ? overlayBack() : router.back());
  const overlay = useCategoryOverlayOptional();
  const colors = useColors();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
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
      <StatusBar hidden />

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
          <BackPill onPress={goBack} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
          <Text style={[styles.stickyTitle, { color: colors.foreground }]} numberOfLines={1}>
            {tag.label}
          </Text>
          <View style={{ width: 38 }} />
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
          <BackPill onPress={goBack} size={28} bgColor="rgba(45,28,82,0.6)" iconOffsetX={-1} style={{ position: "absolute", left: H_PAD, top: topPad + 8 }} />
        </View>

        {/* TITLE + DESCRIPTION */}
        <View style={styles.intro}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>{tag.label}</Text>
          <Text style={[styles.pageDesc, { color: "#F4F4F4" }]} numberOfLines={1}>{tag.description}</Text>
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
            {!durationFilter && (
              <LinearGradient colors={["#FFFFFF", "#F5F5F5"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
            )}
            <Text style={!durationFilter ? [styles.filterLabel, { color: "#0D0A1E" }] : styles.filterLabelIdle}>
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
                {active && (
                  <LinearGradient colors={["#FFFFFF", "#F5F5F5"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
                )}
                <Text style={active ? [styles.filterLabel, { color: "#0D0A1E" }] : styles.filterLabelIdle}>
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
            {/* TODOS */}
            <View style={styles.sessionGrid}>
              {filteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  width={(width - H_PAD * 2 - 14) / 2}
                  style={{ marginRight: 0 }}
                  showDuration={false}
                  showAuthorAvatar={false}
                  overridePress={() => {
                    if (!!session.isPremium && !isPremium) { router.push("/membresia" as never); return; }
                    if (session.skipMiniPlayer) { playSession(session); return; }
                    if (session.skipDetail) { playSession(session); router.push("/player" as never); return; }
                    if (overlay) overlay.openCategory(`/session/${session.id}`);
                    else router.push(`/session/${session.id}` as never);
                  }}
                />
              ))}
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

  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    rowGap: 35,
    marginTop: 8,
    marginBottom: 40,
  },

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
    height: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillSel: {
    borderWidth: 0,
  },
  filterPillIdle: {
    paddingHorizontal: 13,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  filterLabelIdle: {
    fontFamily: "Manrope",
    fontSize: 13,
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
