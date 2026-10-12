import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { openPremiumPlans } from "@/lib/premiumGate";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";

import { ContextSearchModal } from "@/components/ContextSearchModal";
import { PremiumPlansSurface, usePremiumPlansModalHost } from "@/components/PremiumPlansOverlay";
import { GeoUniverseBackground } from "@/components/GeoUniverseBackground";
import { SessionCarousel } from "@/components/SessionCarousel";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { SoundPremiumBanner } from "@/components/SoundPremiumBanner";
import { SESSION_CARD_METADATA_HEIGHT_SCALE } from "@/components/SessionCardMetadataOverlay";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import {
  getSessionById,
  getSessionsByCategory,
  getSessionsBySonidosTag,
  getSonidosCollectionCards,
  getSonidosVisibleSessions,
  type Session,
} from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { useSoundPreview } from "@/hooks/useSoundPreview";
import { isIndigo2ThemeId } from "@/config/scene-themes";
import {
  CONTENT_CAROUSEL_GAP,
  CONTENT_CAROUSEL_HORIZONTAL_PADDING,
  CONTENT_CAROUSEL_HEIGHT_SCALE,
  getTwoCardCarouselCardWidth,
  getExactTwoCardCarouselCardWidth,
} from "@/constants/carousel";
import { MEMBERSHIP_AURORA, WIDGET_GREEN_SOLID } from "@/constants/colors";
import { SOUND_CAROUSEL_ORDER } from "@/data/sound-carousel-order";
import { resolveSoundCarouselOrder } from "@/lib/editorial-playlist-helpers";

const H_PAD = 16;
const SECTION_EXTRA_GAP = 5;
const { width: W, height: SCREEN_HEIGHT } = Dimensions.get("window");
const RECENT_CARD_W = getTwoCardCarouselCardWidth(W, H_PAD);
const COMPACT_CARD_W = getTwoCardCarouselCardWidth(W, 14, 45);
const COMPACT_CARD_H =
  Math.round(
    (COMPACT_CARD_W + 50) *
      SESSION_CARD_METADATA_HEIGHT_SCALE *
      CONTENT_CAROUSEL_HEIGHT_SCALE,
  ) - 25;
const AMBIENTAL_CARD_W = (W - 20 * 2 - 12) / 2;
const AMBIENTAL_CARD_H = Math.round(
  (AMBIENTAL_CARD_W + 50) * SESSION_CARD_METADATA_HEIGHT_SCALE,
);
const ALL_CARD_W = (W - H_PAD * 2 - 14) / 2;
const RESONANCIA_CARD_SURFACE = "rgba(255,255,255,0.1)";

function CollectionPill({
  label,
  icon,
  onPress,
  backgroundColor,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  backgroundColor?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    scale.stopAnimation();
    Animated.spring(scale, {
      toValue: 1,
      tension: 180,
      friction: 14,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
    >
      <Animated.View
        style={[
          styles.pill,
          backgroundColor ? { backgroundColor } : null,
          { transform: [{ scale }] },
        ]}
      >
        <Feather name={icon as never} size={22} color="#FFFFFF" />
        <Text style={styles.pillText} numberOfLines={1}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function SonidosScreen() {
  const { width: viewportWidth } = useWindowDimensions();
  const ambientalCarouselCardWidth = getExactTwoCardCarouselCardWidth(
    viewportWidth,
    H_PAD,
    10,
    H_PAD - CONTENT_CAROUSEL_HORIZONTAL_PADDING,
  );
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { isPremium } = usePremium();
  const { version } = useCatalog();
  const { openCategory } = useCategoryOverlay();
  const { openForSession } = useAmbientalDuration();
  const soundPreview = useSoundPreview();
  const {
    currentSession,
    history,
    playSessionInPlaylist,
  } = usePlayer();
  const [searchVisible, setSearchVisible] = useState(false);
  const [allVisible, setAllVisible] = useState(false);
  const premiumPlans = usePremiumPlansModalHost(allVisible);
  const [allVisibleCount, setAllVisibleCount] = useState(20);
  useFocusEffect(
    useCallback(() => () => soundPreview.stop(), [soundPreview.stop]),
  );
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const indigoSurface = theme.id === "tibet"
    ? "rgba(0,0,0,0.1)"
    : isIndigo2ThemeId(theme.id)
        ? "rgba(191,207,255,0.1)"
        : "rgba(181,211,255,0.1)";
  const inactiveTabSurface = "rgba(0,0,0,0.16)";
  const slideX = useRef(new Animated.Value(W)).current;
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const stickyBorderOpacity = useRef(new Animated.Value(0)).current;
  const stickyTitleActiveRef = useRef(false);
  const stickyBorderActiveRef = useRef(false);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);
  const stickyTitleTranslateY = stickyHeaderOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });
  const heroTitleOpacity = stickyHeaderOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const heroTitleTranslateY = stickyHeaderOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [1, -8],
  });

  const handleMainScroll = useCallback((event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const y = event.nativeEvent.contentOffset.y;
    const titleActive = y > 8;
    if (titleActive !== stickyTitleActiveRef.current) {
      stickyTitleActiveRef.current = titleActive;
      stickyHeaderOpacity.stopAnimation();
      Animated.timing(stickyHeaderOpacity, {
        toValue: titleActive ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }

    const borderActive = y > 2;
    if (borderActive !== stickyBorderActiveRef.current) {
      stickyBorderActiveRef.current = borderActive;
      stickyBorderOpacity.stopAnimation();
      Animated.timing(stickyBorderOpacity, {
        toValue: borderActive ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [stickyBorderOpacity, stickyHeaderOpacity]);

  const collections = useMemo(
    () =>
      getSonidosCollectionCards().map((tag) => ({
        ...tag,
        sessions: getSessionsBySonidosTag(tag.label),
      })).filter((tag) => tag.sessions.length > 0),
    [version],
  );
  const orderedCollections = useMemo(() => {
    const byLabel = new Map(collections.map((collection) => [collection.label, collection]));
    return resolveSoundCarouselOrder(
      SOUND_CAROUSEL_ORDER,
      collections.map((collection) => collection.label),
    ).map((label) => byLabel.get(label)).filter(
      (collection): collection is (typeof collections)[number] => collection !== undefined,
    );
  }, [collections, version]);
  const allSessions = useMemo(() => getSonidosVisibleSessions(), [version]);
  const allIds = useMemo(() => allSessions.map((session) => session.id), [allSessions]);
  const closeAll = useCallback(() => {
    Animated.timing(slideX, {
      toValue: W,
      duration: 280,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setAllVisible(false);
      setAllVisibleCount(20);
    });
  }, [slideX]);

  useEffect(() => {
    if (!allVisible) return;
    slideX.setValue(W);
    Animated.timing(slideX, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [allVisible, slideX]);

  const recent = useMemo(() => {
    const allowed = new Set(allIds);
    const seen = new Set<string>();
    const result: Session[] = [];
    for (const item of history) {
      if (seen.has(item.sessionId) || !allowed.has(item.sessionId)) continue;
      const session = getSessionById(item.sessionId);
      if (session) result.push(session);
      seen.add(item.sessionId);
      if (result.length === 10) break;
    }
    return result;
  }, [allIds, history]);

  const openSession = useCallback((session: Session) => {
    if (session.isPremium && !isPremium) {
      openPremiumPlans();
      return false;
    }
    if (openForSession(session, { forceAmbiental: true })) return true;
    const playWithQueue = () => {
      if (currentSession?.id !== session.id) playSessionInPlaylist(session, allIds);
    };
    if (session.skipMiniPlayer) {
      playWithQueue();
      return true;
    }
    const directPlayer =
      session.skipDetail !== false &&
      (session.skipDetail === true ||
        ["sonidos-ancestrales", "musica-sonidos"].includes(session.categoryId));
    if (directPlayer) {
      playWithQueue();
      router.push("/player" as never);
      return true;
    }
    openCategory(`/session/${session.id}`);
    return true;
  }, [
    allIds,
    currentSession?.id,
    isPremium,
    openCategory,
    openForSession,
    playSessionInPlaylist,
  ]);

  const searchItems = useMemo(
    () => allSessions.map((session) => ({
      id: session.id,
      title: session.title,
      meta: session.categoryLabel,
      subtitle: session.subtitle,
      searchText: `${session.title} ${session.categoryLabel} ${session.subtitle ?? ""}`,
      image: session.image as number,
    })),
    [allSessions],
  );

  return (
    <LinearGradient
      colors={theme.gradient}
      locations={theme.gradientLocations}
      start={theme.gradientStart}
      end={theme.gradientEnd}
      style={styles.root}
    >
      <StatusBar hidden />
      <GeoUniverseBackground />
      <View style={styles.contentShift}>
        <Animated.View
          pointerEvents="auto"
          onLayout={(event) => setStickyHeaderHeight(event.nativeEvent.layout.height)}
          style={[
            styles.stickyHeader,
            {
              paddingTop: topPad + 2,
            },
          ]}
        >
          <View pointerEvents="none" style={styles.stickyGradientClip}>
            <LinearGradient
              colors={theme.gradient}
              locations={theme.gradientLocations}
              start={theme.gradientStart}
              end={theme.gradientEnd}
              style={styles.stickyScreenGradient}
            />
          </View>
          <View style={[styles.titleRow, styles.stickyTitleRow]}>
            <Animated.Text
              style={[
                styles.heroTitle,
                {
                  color: colors.foreground,
                  opacity: heroTitleOpacity,
                  transform: [{ translateY: heroTitleTranslateY }],
                },
              ]}
            >
              Sonidos
            </Animated.Text>
            <Animated.Text
              style={[
                styles.stickyTitle,
                {
                  color: colors.foreground,
                  opacity: stickyHeaderOpacity,
                  transform: [{ translateY: stickyTitleTranslateY }],
                },
              ]}
              pointerEvents="none"
            >
              Sonidos
            </Animated.Text>
            <Pressable
              onPress={() => setSearchVisible(true)}
              hitSlop={10}
            style={[
              styles.headerSearchButton,
              styles.stickySearchButton,
            ]}
              accessibilityRole="button"
              accessibilityLabel="Buscar en Sonidos"
            >
              {Platform.OS === "ios" ? (
                <SymbolView name="magnifyingglass" tintColor={colors.foreground} size={24} />
              ) : (
                <Feather name="search" size={24} color={colors.foreground} />
              )}
            </Pressable>
          </View>
          <View style={styles.stickySonidosTabsHeader}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.tabGrid, { marginBottom: 0 }]}
              contentContainerStyle={styles.tabGridContent}
            >
              {collections.map((collection) => (
                <CollectionPill
                  key={collection.id}
                  label={collection.label}
                  icon={collection.icon}
                  onPress={() => openCategory(`/sound-tag/${collection.id}`)}
                  backgroundColor={inactiveTabSurface}
                />
              ))}
            </ScrollView>
          </View>
          <Animated.View
            style={[styles.stickyBorder, { opacity: stickyBorderOpacity }]}
          />
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingTop: stickyHeaderHeight,
            paddingBottom: 140 + bottomPad,
          }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleMainScroll}
        >
        <View style={[styles.contentStart, { marginTop: -3 }]}>
        {allSessions.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="headphones" size={30} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Próximamente</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Las colecciones aparecerán cuando tengan sesiones publicadas.
            </Text>
          </View>
        ) : (
          <>
            {false && recent.length > 0 && (
              <SessionCarousel
                title="Sesiones recientes"
                sessions={recent}
                isPremium={isPremium}
                onPress={openSession}
                style={[styles.carousel, styles.recentCarousel]}
                cardWidth={RECENT_CARD_W}
                allowOversizedCardWidth
                titleSize={19}
                titleOffset={10}
                titleSpacing={17}
                squareCards
                showMetaBelow
              />
            )}
            {orderedCollections.map((collection, index) => (
              <React.Fragment key={collection.id}>
                {index > 0 ? <View style={styles.sectionSpacer} /> : null}
                <SessionCarousel
                  title={collection.label}
                  sessions={collection.sessions.slice(0, 5)}
                  isPremium={isPremium}
                  onPress={openSession}
                  style={[
                    styles.carousel,
                    index === 0 ? styles.firstCarousel : styles.carouselAfterSpacer,
                  ]}
                 presentation="editorial"
                  cardVariant="ambiental"
                  ambientalCardBackground="rgba(0,0,0,0.16)"
                 ambientalTitleOnly
                 cardWidth={ambientalCarouselCardWidth}
                 trailingPeek={10}
                 allowOversizedCardWidth
                 soundPreview={{
                   activeId: soundPreview.activeId,
                   isPlaying: soundPreview.isPlaying,
                   progress: soundPreview.progress,
                   onToggle: soundPreview.toggle,
                 }}
                titleSize={19}
                  onViewAll={() => openCategory(`/sound-tag/${collection.id}`)}
                />
                {index === 1 && !isPremium ? (
                  <>
                    <View style={styles.sectionSpacer} />
                    <SoundPremiumBanner />
                  </>
                ) : null}
              </React.Fragment>
            ))}
          </>
        )}
        </View>
        </ScrollView>
      </View>

      <ContextSearchModal
        visible={searchVisible}
        matchDiscoverSearchBar
        fullThemeBackground
        onClose={() => setSearchVisible(false)}
        items={searchItems}
        placeholder="Buscar en Sonidos..."
        emptyTitle="Encuentra tu paisaje sonoro"
        emptySubtitle="Busca naturaleza, lluvia, frecuencias o música"
        onSelect={(item) => {
          const session = allSessions.find((candidate) => candidate.id === item.id);
          return session ? openSession(session) : false;
        }}
        scope="sounds"
        showDurationFilters={false}
      />

      <Modal visible={allVisible} transparent animationType="none" onRequestClose={premiumPlans.visible ? premiumPlans.close : closeAll} statusBarTranslucent>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: theme.gradient[theme.gradient.length - 1] as string,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
          <View style={[styles.allSessionsHeader, { paddingTop: topPad + 14 }]}>
            <Pressable onPress={closeAll} hitSlop={12} style={styles.allSessionsBack}>
              <Feather name="chevron-left" size={28} color="#FBFBFB" />
            </Pressable>
            <Text style={styles.allSessionsTitle}>Sesiones de Sonidos</Text>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.allSessionsGrid, { paddingBottom: 120 + bottomPad }]}
            scrollEventThrottle={16}
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
              if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 300) {
                setAllVisibleCount((count) => count + 20);
              }
            }}
          >
            {allSessions.slice(0, allVisibleCount).map((session) => {
              const locked = !!session.isPremium && !isPremium;
              return (
                <Pressable
                  key={session.id}
                  onPress={() => {
                    if (locked) {
                      openPremiumPlans();
                      return;
                    }
                    closeAll();
                    openSession(session);
                  }}
                  style={({ pressed }) => [
                    styles.allSessionCard,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={styles.allSessionImageWrap}>
                    <Image source={session.image} style={styles.allSessionImage} contentFit="cover" />
                    <SessionDurationBadge
                      label={session.durationLabel}
                      style={styles.allSessionDuration}
                    />
                    {locked && (
                      <View style={styles.allSessionLock}>
                        <Feather name="lock" size={9} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.allSessionName} numberOfLines={3}>
                    {session.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
        {premiumPlans.visible ? <PremiumPlansSurface onClose={premiumPlans.close} /> : null}
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentShift: { flex: 1, transform: [{ translateY: -5 }] },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  stickyGradientClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  stickyScreenGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
  },
  titleRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingTop: 7,
    paddingBottom: 10,
  },
  heroTitle: {
    fontFamily: "Manrope",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.3,
    textAlign: "left",
    marginTop: 0,
    transform: [{ translateY: 1 }],
  },
  stickyTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 16,
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  stickyTitleRow: {
    minHeight: 54,
    justifyContent: "flex-start",
  },
  stickySearchButton: {
    position: "absolute",
    top: 5,
    right: H_PAD - 1,
  },
  headerSearchButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 0,
    borderColor: "transparent",
    overflow: "hidden",
  },
  sonidosTabsHeader: {
    marginTop: 17,
    paddingBottom: 15,
  },
  stickySonidosTabsHeader: {
    marginTop: 8,
    paddingBottom: 6,
  },
  stickyBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  tabGrid: {
    marginBottom: 43,
  },
  tabGridContent: {
    paddingHorizontal: H_PAD,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    height: 51,
    paddingHorizontal: 16,
    borderRadius: 27,
    borderWidth: 1.2,
    borderColor: "rgba(241,224,255,0.25)",
    gap: 12,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  pillText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F4F4F4",
  },
  scroll: { flex: 1 },
  contentStart: { marginTop: -15 },
  carousel: {
    marginTop: 53,
    marginBottom: 0,
    paddingHorizontal: H_PAD,
  },
  firstCarousel: { marginTop: 33 },
  carouselAfterSpacer: { marginTop: 26 },
  sectionSpacer: {
    opacity: 0,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: H_PAD,
    marginTop: 26 + SECTION_EXTRA_GAP / 2,
    marginBottom: SECTION_EXTRA_GAP / 2,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  premiumBanner: {
    minHeight: 110,
    marginTop: 26,
    marginHorizontal: H_PAD,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.27)",
    backgroundColor: "rgba(0,0,0,0.34)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  premiumBannerIcon: {
    width: 51,
    height: 51,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumBannerCopy: {
    flex: 1,
    minWidth: 0,
  },
  premiumBannerTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 5,
  },
  premiumBannerSubtitle: {
    color: "#F4F4F4",
    fontFamily: "Manrope",
    fontSize: 12,
  },
  premiumBannerAccent: {
    color: MEMBERSHIP_AURORA.premium.accent,
  },
  recentCarousel: { marginTop: 33 },
  empty: {
    marginHorizontal: H_PAD,
    marginTop: 70,
    minHeight: 180,
    paddingHorizontal: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  emptySubtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  allSessionsButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    overflow: "hidden",
    paddingHorizontal: 28,
    paddingVertical: 9,
    gap: 6,
    marginTop: 29,
    marginBottom: 16,
  },
  allSessionsButtonText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F9F9F9",
  },
  allSessionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
    gap: 4,
  },
  allSessionsBack: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  allSessionsTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    color: "#FBFBFB",
    flex: 1,
  },
  allSessionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 14,
    paddingHorizontal: H_PAD,
    rowGap: 24,
    paddingTop: 8,
  },
  allSessionCard: { width: ALL_CARD_W },
  allSessionImageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 17,
    overflow: "hidden",
  },
  allSessionImage: { width: "100%", height: "100%" },
  allSessionDuration: {
    position: "absolute",
    bottom: 8,
    left: 8,
  },
  allSessionLock: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  allSessionName: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#FBFBFB",
    lineHeight: 18,
    marginTop: 8,
  },
});