import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ContextSearchModal } from "@/components/ContextSearchModal";
import { GeoUniverseBackground } from "@/components/GeoUniverseBackground";
import { SessionCarousel } from "@/components/SessionCarousel";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { usePremium } from "@/context/PremiumContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import {
  getSessionById,
  getSessionsByCategory,
  getSessionsBySonidosTag,
  getSonidosVisibleSessions,
  type Session,
} from "@/data/sessions";
import { SONIDOS_TAG_CARDS } from "@/data/tags";
import { useColors } from "@/hooks/useColors";
import {
  getContentCarouselCardWidth,
  getTwoCardCarouselCardWidth,
} from "@/constants/carousel";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";

const H_PAD = 14;
const { width: W } = Dimensions.get("window");
const CARD_W = getContentCarouselCardWidth(W, H_PAD);
const RECENT_CARD_W = getTwoCardCarouselCardWidth(W, H_PAD);
const ALL_CARD_W = (W - H_PAD * 2 - 14) / 2;

function CollectionPill({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
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
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { isPremium } = usePremium();
  const { version } = useCatalog();
  const { openCategory } = useCategoryOverlay();
  const { openForSession } = useAmbientalDuration();
  const {
    currentSession,
    history,
    playSessionInPlaylist,
  } = usePlayer();
  const [searchVisible, setSearchVisible] = useState(false);
  const [allVisible, setAllVisible] = useState(false);
  const [allVisibleCount, setAllVisibleCount] = useState(20);
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const indigoSurface = isIndigoThemeId(theme.id) ? "rgba(181,211,255,0.045)" : undefined;
  const slideX = useRef(new Animated.Value(W)).current;
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const stickyHeaderActiveRef = useRef(false);
  const [stickyHeaderActive, setStickyHeaderActive] = useState(false);

  const handleMainScroll = useCallback((event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const active = event.nativeEvent.contentOffset.y > 8;
    if (active === stickyHeaderActiveRef.current) return;
    stickyHeaderActiveRef.current = active;
    setStickyHeaderActive(active);
    stickyHeaderOpacity.stopAnimation();
    Animated.timing(stickyHeaderOpacity, {
      toValue: active ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [stickyHeaderOpacity]);

  const collections = useMemo(
    () =>
      SONIDOS_TAG_CARDS.map((tag) => ({
        ...tag,
        sessions: tag.label === "Todos los sonidos"
          ? getSessionsByCategory("ambientales")
          : getSessionsBySonidosTag(tag.label),
      })).filter((tag) => tag.sessions.length > 0),
    [version],
  );
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
      router.push("/membresia" as never);
      return;
    }
    if (openForSession(session)) return;
    const playWithQueue = () => {
      if (currentSession?.id !== session.id) playSessionInPlaylist(session, allIds);
    };
    if (session.skipMiniPlayer) {
      playWithQueue();
      return;
    }
    const directPlayer =
      session.skipDetail !== false &&
      (session.skipDetail === true ||
        ["sonidos-ancestrales", "musica-sonidos"].includes(session.categoryId));
    if (directPlayer) {
      playWithQueue();
      router.push("/player" as never);
      return;
    }
    openCategory(`/session/${session.id}`);
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
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <StatusBar hidden />
      <GeoUniverseBackground />
      <View style={styles.contentShift}>
        <Animated.View
          pointerEvents={stickyHeaderActive ? "auto" : "none"}
          style={[
            styles.stickyHeader,
            {
              paddingTop: topPad + 2,
              backgroundColor: theme.gradient[0] as string,
              opacity: stickyHeaderOpacity,
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.stickyTitle, { color: colors.foreground }]}>
              Sonidos
            </Text>
            <Pressable
              onPress={() => setSearchVisible(true)}
              hitSlop={10}
              style={[styles.headerSearchButton, indigoSurface && { backgroundColor: indigoSurface }]}
              accessibilityRole="button"
              accessibilityLabel="Buscar en Sonidos"
            >
              <Feather name="search" size={24} color={colors.foreground} />
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 140 + bottomPad }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleMainScroll}
        >
          <View style={{ paddingTop: topPad + 2 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              Sonidos
            </Text>
            <Pressable
              onPress={() => setSearchVisible(true)}
              hitSlop={10}
              style={[styles.headerSearchButton, indigoSurface && { backgroundColor: indigoSurface }]}
              accessibilityRole="button"
              accessibilityLabel="Buscar en Sonidos"
            >
              <Feather name="search" size={24} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.sonidosTabsHeader}>
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
                />
              ))}
            </ScrollView>
          </View>
          </View>
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
                cardAuthorColor="#acaac2"
                showMetaBelow
              />
            )}
            {collections.map((collection, index) => (
              <SessionCarousel
                key={collection.id}
                title={collection.label}
                sessions={collection.sessions.slice(0, 5)}
                isPremium={isPremium}
                onPress={openSession}
                style={[styles.carousel, index === 0 && styles.firstCarousel]}
                cardWidth={CARD_W}
                titleSize={19}
                showCardMetadata
                showAuthor={false}
                onViewAll={() => openCategory(`/sound-tag/${collection.id}`)}
              />
            ))}
          </>
        )}
        </View>
        </ScrollView>
      </View>

      <ContextSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        items={searchItems}
        placeholder="Buscar en Sonidos..."
        emptyTitle="Encuentra tu paisaje sonoro"
        emptySubtitle="Busca naturaleza, lluvia, frecuencias o música"
        onSelect={(item) => {
          const session = allSessions.find((candidate) => candidate.id === item.id);
          if (session) openSession(session);
        }}
      />

      <Modal visible={allVisible} transparent animationType="none" onRequestClose={closeAll} statusBarTranslucent>
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
                      router.push("/membresia" as never);
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
                  <Text style={styles.allSessionName} numberOfLines={2}>
                    {session.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
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
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "left",
    transform: [{ translateY: 1 }],
  },
  headerSearchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sonidosTabsHeader: {
    marginTop: 9,
    paddingBottom: 15,
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
    gap: 12,
    overflow: "hidden",
    backgroundColor: "rgba(181,211,255,0.045)",
    borderWidth: 0,
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
  allSessionsBack: { padding: 4 },
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