import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
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

import { ContextSearchModal } from "@/components/ContextSearchModal";
import { GeoUniverseBackground } from "@/components/GeoUniverseBackground";
import { SessionCarousel } from "@/components/SessionCarousel";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import {
  getSessionById,
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

const H_PAD = 14;
const { width: W } = Dimensions.get("window");
const CARD_W = getContentCarouselCardWidth(W, H_PAD);
const RECENT_CARD_W = getTwoCardCarouselCardWidth(W, H_PAD);

function CollectionPill({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  const { theme } = useSceneTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        theme.id === "tibet" && styles.pillTibet,
        theme.id === "indigo" && styles.pillIndigo,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon as never} size={22} color="#F4F4F4" />
      <Text style={styles.pillText} numberOfLines={1}>{label}</Text>
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
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const indigoSurface = theme.id === "indigo" ? "rgba(42,40,64,0.65)" : undefined;
  const titleProgress = useRef(new Animated.Value(0)).current;
  const compactRef = useRef(false);
  const headerBorderActiveRef = useRef(false);
  const headerBorderAnim = useRef(new Animated.Value(0)).current;
  const scrollContentHeightRef = useRef(0);
  const scrollLayoutHeightRef = useRef(0);

  const handleScroll = useCallback((event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const y = event.nativeEvent.contentOffset.y;
    const compact = y > 8;
    if (compact !== compactRef.current) {
      compactRef.current = compact;
      Animated.timing(titleProgress, {
        toValue: compact ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    const scrollable = scrollContentHeightRef.current - scrollLayoutHeightRef.current;
    const showBorder = scrollable > 0 && y / scrollable >= 0.01;
    if (showBorder !== headerBorderActiveRef.current) {
      headerBorderActiveRef.current = showBorder;
      Animated.timing(headerBorderAnim, {
        toValue: showBorder ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [headerBorderAnim, titleProgress]);

  const collections = useMemo(
    () =>
      SONIDOS_TAG_CARDS.map((tag) => ({
        ...tag,
        sessions: getSessionsBySonidosTag(tag.label),
      })).filter((tag) => tag.sessions.length > 0),
    [version],
  );
  const allSessions = useMemo(() => getSonidosVisibleSessions(), [version]);
  const allIds = useMemo(() => allSessions.map((session) => session.id), [allSessions]);
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
        <View style={[styles.fixedHeader, { paddingTop: topPad + 2 }]}>
          <View style={styles.titleRow}>
            <Animated.Text
              style={[
                styles.heroTitle,
                {
                  color: colors.foreground,
                  opacity: titleProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                },
              ]}
            >
              Sonidos
            </Animated.Text>
            <Animated.View pointerEvents="none" style={[styles.compactTitleOverlay, { opacity: titleProgress }]}>
              <Text style={[styles.compactPageTitle, { color: colors.foreground }]}>Sonidos</Text>
            </Animated.View>
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
          <Animated.View style={[styles.stickyTabsBorder, { opacity: headerBorderAnim }]} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 140 + bottomPad }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onLayout={(event) => {
            scrollLayoutHeightRef.current = event.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_width, height) => {
            scrollContentHeightRef.current = height;
          }}
          onScroll={handleScroll}
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
            {recent.length > 0 && (
              <SessionCarousel
                title="Escuchadas recientemente"
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
                showImageCategoryPill
              />
            )}
            {collections.map((collection) => (
              <SessionCarousel
                key={collection.id}
                title={collection.label}
                sessions={collection.sessions.slice(0, 5)}
                isPremium={isPremium}
                onPress={openSession}
                style={styles.carousel}
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentShift: { flex: 1, transform: [{ translateY: -5 }] },
  fixedHeader: {
    zIndex: 20,
    backgroundColor: "transparent",
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
  compactTitleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  compactPageTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
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
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 27,
    gap: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0,
  },
  pillTibet: { backgroundColor: "rgba(0,0,0,0.15)" },
  pillIndigo: { backgroundColor: "rgba(42,40,64,0.65)" },
  stickyTabsBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  pillText: {
    fontFamily: "Manrope",
    fontSize: 15,
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
});