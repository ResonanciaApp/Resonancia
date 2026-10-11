import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CardCaptionText as Text } from "@/components/CardCaptionText";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

import { SessionCarousel } from "@/components/SessionCarousel";
import { FavoriteTabIcon } from "@/components/FavoriteTabIcon";
import { EditorialPlaylistCarousel } from "@/components/EditorialPlaylistCarousel";
import { VideoCard } from "@/components/VideoCard";
import { VideoActionsSheet } from "@/components/VideoActionsSheet";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useVideosState } from "@/context/VideosContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSessionById, type Session } from "@/data/sessions";
import { type VideoItem } from "@/data/videos";
import { useColors } from "@/hooks/useColors";
import { useVideos } from "@/hooks/useVideos";
import { isIndigo2ThemeId, isIndigoThemeId } from "@/config/scene-themes";
import { PLAYLISTS, type EditorialPlaylist } from "@/data/playlists";
import { useCatalog } from "@/context/CatalogContext";
import { buildVisibleFavoriteTabs, FAVORITE_COLLECTION_TABS, resolveSavedEditorialFavorites, type FavoriteCollectionTabId } from "@/lib/favorites-home-helpers";
import { useInspiration } from "@/hooks/inspiration";
import type { InspirationFavorite } from "@/types/inspiration";
import { confirmInspirationAction } from "@/components/InspirationNotes";
import { TAG_CARDS, THEME_CARD_BACKGROUND_BY_SLUG, THEME_CARD_OVERLAY_BY_SLUG } from "@/data/tags";
import { useFavoriteThemeCollections } from "@/hooks/useFavoriteThemeCollections";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { CARD_TEXT_BELOW } from "@/constants/colors";

const H_PAD = 14;
const { width: W, height: H } = Dimensions.get("window");
const CAROUSEL_CARD_W = Math.round((W - H_PAD - 14) / 1.9);
function FavPill({
  sel, id, label, indigo2BackgroundColor, onPress,
}: {
  sel: boolean;
  id: FavoriteCollectionTabId;
  label: string;
  indigo2BackgroundColor?: Animated.AnimatedInterpolation<string | number>;
  onPress: () => void;
}) {
  const { theme } = useSceneTheme();
  const selectedTextColor = sel ? "#060A0F" : "#F4F4F4";

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.pill,
            theme.id === "tibet" && styles.pillTibet,
            isIndigoThemeId(theme.id) && styles.pillIndigo,
            !sel && isIndigo2ThemeId(theme.id) && styles.pillIndigo2Inactive,
            !sel && isIndigo2ThemeId(theme.id) && indigo2BackgroundColor && {
              backgroundColor: indigo2BackgroundColor,
            },
            sel && styles.pillSel,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <FavoriteTabIcon id={id} color={selectedTextColor} />
          <Text style={[styles.pillText, { color: selectedTextColor }]} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

function FavoriteSessionsCarousel({
  title,
  tabId,
  sessions,
  isPremium,
  onPress,
}: {
  title: string;
  tabId: FavoriteCollectionTabId;
  sessions: Session[];
  isPremium: boolean;
  onPress: (session: Session) => void;
}) {
  const ambiental = tabId === "ambientales";
  if (!ambiental) {
    return (
      <SessionCarousel
        title={title}
        sessions={sessions}
        isPremium={isPremium}
        onPress={onPress}
        style={styles.favoriteSessionCarousel}
        presentation="editorial"
        disableAmbientalVariant
        sleepMetadataBelow
        categoryGridPresentation
        whiteMetadataGlass
        showDurationClock
        sleepBelowMetadataStyle={{ marginTop: 3, transform: [{ translateX: 3 }] }}
        trailingPeek={20}
        cardWidth={CAROUSEL_CARD_W}
        allowOversizedCardWidth
        cardBorderRadius={16}
        titleSize={17}
        hideCategoryAboveTitle
        showSleepCategoryPillWithInlineDuration
        ambientalTitleOnly
        sleepOverlayMetadataStyle={{ transform: [{ translateX: 3 }, { translateY: -1 }] }}
        overlayGradientLocations={[0.18, 0.48, 1]}
      />
    );
  }
  return (
    <SessionCarousel
      title={title}
      sessions={sessions}
      isPremium={isPremium}
      onPress={onPress}
      presentation="editorial"
      trailingPeek={16}
      cardWidth={CAROUSEL_CARD_W}
      allowOversizedCardWidth
      titleSize={17}
      ambientalTitleOnly
    />
  );
}

function FavoriteVideosCarousel({
  title,
  videos,
  onOptionsPress,
}: {
  title: string;
  videos: VideoItem[];
  onOptionsPress: (video: VideoItem) => void;
}) {
  return (
    <View style={styles.videoCarouselSection}>
      <Text style={styles.carouselTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.videoCarouselScroll}
        contentContainerStyle={styles.videoCarouselContent}
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            width={CAROUSEL_CARD_W}
            onOptionsPress={() => onOptionsPress(video)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function FavoriteInspirationsCarousel({
  title,
  inspirations,
}: {
  title: string;
  inspirations: InspirationFavorite[];
}) {
  const colors = useColors();
  const { setFavorite } = useInspiration();
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  if (!inspirations || inspirations.length === 0) return null;
  return (
    <View style={[styles.videoCarouselSection, { marginBottom: 30 }]}>
      <Text style={styles.carouselTitle}>{title}</Text>
      {error && <Text accessibilityRole="alert" style={{ color: "#d87272", padding: 14 }}>{error}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.videoCarouselScroll}
        contentContainerStyle={styles.videoCarouselContent}
      >
        {inspirations.map((fav) => (
          <Pressable
            key={fav.inspirationId}
            onPress={() => {
              const date = fav.date || fav.day?.date;
              if (date) {
                router.push({ pathname: "/inspiracion-diaria/[date]", params: { date, id: fav.inspirationId } });
              } else {
                router.push("/inspiracion-diaria/notas");
              }
            }}
            style={{ width: CAROUSEL_CARD_W, marginRight: 16 }}
          >
            <View style={{ width: '100%', aspectRatio: 0.72, borderRadius: 16, backgroundColor: colors.card, overflow: 'hidden', marginBottom: 8 }}>
              {fav.day?.content?.imageUrl ? (
                <Image
                  source={{ uri: fav.day.content.imageUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  contentPosition={{ left: `${fav.day.content.imagePositionX}%`, top: `${fav.day.content.imagePositionY}%` }}
                />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Feather name="calendar" size={24} color={colors.mutedForeground} />
                </View>
              )}
            </View>
            <Text style={{ fontFamily: 'Manrope', fontSize: 15, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>
              {fav.date || fav.day?.date || "Inspiración"}
            </Text>
            {fav.day?.status !== "available" && <Text style={{ color: colors.mutedForeground, marginTop: 4 }}>No disponible · Tus notas se conservan</Text>}
            {fav.day?.content?.quote && (
              <Text style={{ fontFamily: 'Manrope', fontSize: 13, color: CARD_TEXT_BELOW }} numberOfLines={1}>
                "{fav.day.content.quote}"
              </Text>
            )}
            <Pressable disabled={removing === fav.inspirationId} onPress={event => {
              event.stopPropagation();
              confirmInspirationAction("Quitar favorito", "¿Quitar esta inspiración? Tus notas no se borrarán.", () => {
                setRemoving(fav.inspirationId); setError(null);
                void setFavorite(fav.inspirationId, false).catch(cause => setError(cause instanceof Error ? cause.message : "No se pudo quitar el favorito.")).finally(() => setRemoving(null));
              });
            }} style={{ paddingVertical: 12 }} accessibilityLabel="Quitar inspiración de favoritos">
              <Text style={{ color: colors.primary }}>{removing === fav.inspirationId ? "Guardando…" : "Quitar de favoritos"}</Text>
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function FavoriteThemeCollections({
  collections,
  onPress,
  title,
  gridLayout = false,
}: {
  collections: typeof TAG_CARDS;
  onPress: (id: string) => void;
  title?: string;
  gridLayout?: boolean;
}) {
  if (collections.length === 0) return null;
  const cards = collections.map((collection) => (
    <Pressable
      key={collection.id}
      onPress={() => onPress(collection.id)}
      accessibilityRole="button"
      accessibilityLabel={collection.label}
      style={({ pressed }) => [
        styles.themeCollectionItem,
        gridLayout ? styles.themeCollectionGridItem : styles.themeCollectionCarouselItem,
        { opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <View
        style={[
          styles.themeCollectionCard,
          {
            backgroundColor: THEME_CARD_BACKGROUND_BY_SLUG[collection.id] ?? "rgba(0,0,0,0.16)",
          },
        ]}
      >
        <Image
          source={collection.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={THEME_CARD_OVERLAY_BY_SLUG[collection.id] ?? ["rgba(0,0,0,0.18)", "rgba(0,0,0,0.62)"]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <Text style={styles.themeCollectionLabel} numberOfLines={2}>
        {collection.label}
      </Text>
    </Pressable>
  ));

  return (
    <View style={styles.themeCollectionsSection}>
      {title ? <Text style={styles.carouselTitle}>{title}</Text> : null}
      {gridLayout ? (
        <View style={styles.themeCollectionsGrid}>{cards}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.themeCollectionsCarousel}
          contentContainerStyle={styles.themeCollectionsCarouselContent}
        >
          {cards}
        </ScrollView>
      )}
    </View>
  );
}

export default function FavoritosTodosScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const goBack = useBackOverride();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, playSession } = usePlayer();
  const { isPremium } = usePremium();
  const { favFolders, savedEditorialPlaylistIds } = useFoldersPlaylists();
  const { version: catalogVersion } = useCatalog();
  const { favoriteVideoIds } = useVideosState();
  const { theme: sceneTheme } = useSceneTheme();
  const { videos: allVideos } = useVideos();
  const { favorites: inspirationFavorites } = useInspiration();
  const { favoriteThemeIds } = useFavoriteThemeCollections();
  const categoryOverlay = useCategoryOverlayOptional();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const stickyHeaderHeight = topPad + 126;
  const [actionsVideo, setActionsVideo] = useState<VideoItem | null>(null);
  const libraryHeaderButtonBackground = "rgba(0,0,0,0.16)";

  const [activeTab, setActiveTab] = useState<FavoriteCollectionTabId>(params.tab === "inspiraciones" ? "inspiraciones" : "all");
  const titleProgress = useRef(new Animated.Value(0)).current;
  const indigo2TabsSurfaceAnim = useRef(new Animated.Value(0)).current;
  const compactRef = useRef(false);
  const indigo2TabsBackgroundColor = indigo2TabsSurfaceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0.16)", "rgba(0,0,0,0.16)"],
  });
  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const compact = event.nativeEvent.contentOffset.y > 0.5;
    if (compact !== compactRef.current) {
      compactRef.current = compact;
      Animated.timing(titleProgress, { toValue: compact ? 1 : 0, duration: 300, useNativeDriver: true }).start();
      Animated.timing(indigo2TabsSurfaceAnim, {
        toValue: compact ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [indigo2TabsSurfaceAnim, titleProgress]);

  // Misma regla que la lista plana de Biblioteca: sesiones dentro de una
  // carpeta de Favoritos no aparecen en la lista plana.
  const favSessions = useMemo<Session[]>(() => {
    const inAnyFolder = new Set(favFolders.flatMap((f) => f.sessionIds));
    return favorites
      .filter((id) => !inAnyFolder.has(id))
      .map((id) => getSessionById(id))
      .filter((s): s is Session => s !== undefined);
  }, [favorites, favFolders, catalogVersion]);

  const favVideos = useMemo(
    () => allVideos.filter((v) => favoriteVideoIds.includes(v.id)),
    [allVideos, favoriteVideoIds],
  );

  const favoritePlaylists = useMemo(
    () => resolveSavedEditorialFavorites(savedEditorialPlaylistIds, PLAYLISTS),
    [savedEditorialPlaylistIds, catalogVersion],
  );
  const favoriteThemeCollections = useMemo(
    () => favoriteThemeIds
      .map((id) => TAG_CARDS.find((collection) => collection.id === id))
      .filter((collection): collection is (typeof TAG_CARDS)[number] => Boolean(collection)),
    [favoriteThemeIds],
  );

  const visibleTabs = useMemo(
    () => buildVisibleFavoriteTabs(
      favSessions.map((session) => session.categoryId),
      favVideos.length > 0,
      favoritePlaylists.length > 0,
      inspirationFavorites.length > 0 || params.tab === "inspiraciones",
      favoriteThemeCollections.length > 0,
    ),
    [favSessions, favVideos.length, favoritePlaylists.length, inspirationFavorites.length, favoriteThemeCollections.length, params.tab],
  );
  const visibleContentTabs = useMemo(
    () => {
      const contentTabs = visibleTabs.filter((tab) => tab.id !== "all");
      return [
        ...contentTabs.filter((tab) => tab.id !== "ambientales"),
        ...contentTabs.filter((tab) => tab.id === "ambientales"),
      ];
    },
    [visibleTabs],
  );

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) setActiveTab("all");
  }, [activeTab, visibleTabs]);

  const activeCategory = FAVORITE_COLLECTION_TABS.find((tab) => tab.id === activeTab)?.categoryId;
  const tabSessions = useMemo(
    () => favSessions.filter((s) => s.categoryId === activeCategory),
    [favSessions, activeCategory],
  );

  const openSession = (s: Session) => {
    if (s.skipMiniPlayer) { playSession(s); return; }
    if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
    router.push(`/session/${s.id}` as never);
  };
  const openEditorialPlaylist = (playlist: EditorialPlaylist) => {
    router.push(`/editorial-playlist/${encodeURIComponent(playlist.id)}` as never);
  };
  const openThemeCollection = (id: string) => {
    const path = `/tag/${encodeURIComponent(id)}`;
    if (categoryOverlay) {
      categoryOverlay.openCategory(path);
    } else {
      router.push(path as never);
    }
  };

  return (
    <LinearGradient
      style={styles.root}
      colors={sceneTheme.gradient as unknown as [string, string, ...string[]]}
      locations={sceneTheme.gradientLocations}
      start={sceneTheme.gradientStart}
      end={sceneTheme.gradientEnd}
    >
      <StatusBar hidden />

      <View style={styles.contentShift}>
        <View
          style={[
            styles.stickyHeader,
            { paddingTop: topPad + 4 },
          ]}
        >
          <View pointerEvents="none" style={styles.stickyGradientClip}>
            <LinearGradient
              colors={sceneTheme.gradient as unknown as [string, string, ...string[]]}
              locations={sceneTheme.gradientLocations}
              start={sceneTheme.gradientStart}
              end={sceneTheme.gradientEnd}
              style={styles.stickyScreenGradient}
            />
          </View>
          <View style={[styles.stickyHeaderRow, styles.libraryTabHeaderRow]}>
            <Pressable
              onPress={goBack ?? (() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))}
              hitSlop={6}
              style={styles.libraryTabBackHitArea}
              accessibilityRole="button"
              accessibilityLabel="Volver a Inicio"
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.libraryTabBackBtn,
                    { backgroundColor: "rgba(0,0,0,0.16)", opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="chevron-left" size={28} color="#FBFBFB" style={{ transform: [{ translateX: -1 }] }} />
                </View>
              )}
            </Pressable>
            <Text style={[styles.largeTitle, { color: colors.foreground }]}>Mis favoritos</Text>
          </View>

          <View style={styles.embeddedTabsHeader}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRowContent}
            >
              {visibleTabs.map((tab) => (
                <FavPill
                  key={tab.id}
                  sel={activeTab === tab.id}
                  id={tab.id}
                  label={tab.label}
                   indigo2BackgroundColor={indigo2TabsBackgroundColor}
                  onPress={() => setActiveTab(tab.id)}
                />
              ))}
            </ScrollView>
            <Animated.View
              pointerEvents="none"
              style={[styles.tabsDivider, { opacity: titleProgress }]}
            />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: stickyHeaderHeight + 25 }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
        >
          {activeTab === "all" ? (
            visibleContentTabs.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="heart" size={20} color="#f9f9f9" />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Aún no tienes favoritos.
                </Text>
              </View>
            ) : (
              <View style={styles.allCollections}>
                {visibleContentTabs.map((tab, index) => {
                  if (tab.id === "inspiraciones") {
                    return (
                      <React.Fragment key={tab.id}>
                        {index > 0 ? <View style={styles.sectionDivider} /> : null}
                        <FavoriteInspirationsCarousel
                          title={tab.label}
                          inspirations={inspirationFavorites}
                        />
                      </React.Fragment>
                    );
                  }
                  if (tab.id === "videos") {
                    return (
                      <React.Fragment key={tab.id}>
                        {index > 0 ? <View style={styles.sectionDivider} /> : null}
                        <FavoriteVideosCarousel
                          title={tab.label}
                          videos={favVideos}
                          onOptionsPress={setActionsVideo}
                        />
                      </React.Fragment>
                    );
                  }
                  if (tab.id === "playlists") {
                    return (
                      <React.Fragment key={tab.id}>
                        {index > 0 ? <View style={styles.sectionDivider} /> : null}
                        <EditorialPlaylistCarousel
                          title={tab.label}
                          playlists={favoritePlaylists}
                          onPress={openEditorialPlaylist}
                          titleLift={14}
                        />
                      </React.Fragment>
                    );
                  }
                  if (tab.id === "collections") {
                    return (
                      <React.Fragment key={tab.id}>
                        {index > 0 ? <View style={styles.sectionDivider} /> : null}
                        <FavoriteThemeCollections
                          title={tab.label}
                          collections={favoriteThemeCollections}
                          onPress={openThemeCollection}
                        />
                      </React.Fragment>
                    );
                  }
                  const sessions = favSessions.filter(
                    (session) => session.categoryId === tab.categoryId,
                  );
                  return (
                    <React.Fragment key={tab.id}>
                      {index > 0 ? <View style={styles.sectionDivider} /> : null}
                      <FavoriteSessionsCarousel
                        title={tab.label}
                        tabId={tab.id}
                        sessions={sessions}
                        isPremium={isPremium}
                        onPress={openSession}
                      />
                    </React.Fragment>
                  );
                })}
              </View>
            )
          ) : activeTab === "inspiraciones" ? (
            inspirationFavorites.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: "rgba(255,255,255,0.075)" }]}>
                <Feather name="heart" size={20} color="#f9f9f9" />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Aún no tienes inspiraciones favoritas.
                </Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: H_PAD }}>
                <FavoriteInspirationsCarousel title="Inspiraciones" inspirations={inspirationFavorites} />
              </View>
            )
          ) : activeTab === "collections" ? (
            <FavoriteThemeCollections
              collections={favoriteThemeCollections}
              onPress={openThemeCollection}
              gridLayout
            />
          ) : activeTab === "videos" ? (
            favVideos.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: "rgba(255,255,255,0.075)" }]}>
                <Feather name="heart" size={20} color="#f9f9f9" />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Aún no tienes videos favoritos.
                </Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: H_PAD, gap: 9 }}>
                {favVideos.map((v) => (
                  <VideoCard
                    key={v.id}
                    video={v}
                    horizontal
                    cardBg="rgba(255,255,255,0.045)"
                    onOptionsPress={() => setActionsVideo(v)}
                  />
                ))}
              </View>
            )
          ) : activeTab === "playlists" ? (
            <EditorialPlaylistCarousel
              title=""
              playlists={favoritePlaylists}
              onPress={openEditorialPlaylist}
              style={styles.playlistsTab}
              gridLayout
            />
          ) : tabSessions.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="heart" size={20} color="#f9f9f9" />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Aún no tienes favoritos en esta colección.
              </Text>
            </View>
          ) : activeTab === "ambientales" ? (
            <SessionCarousel
              title=""
              sessions={tabSessions}
              isPremium={isPremium}
              onPress={openSession}
              style={styles.ambientalGrid}
              showHeader={false}
              gridLayout
              fillGridWidth
              gridScrollEnabled={false}
              eagerRender
              presentation="editorial"
              ambientalTitleOnly
            />
          ) : (
            <SessionCarousel
              title=""
              sessions={tabSessions}
              isPremium={isPremium}
              onPress={openSession}
              style={styles.favoriteSessionGrid}
              showHeader={false}
              gridLayout
              fillGridWidth
              gridScrollEnabled={false}
              eagerRender
              presentation="editorial"
              disableAmbientalVariant
              sleepMetadataBelow
              categoryGridPresentation
              whiteMetadataGlass
              showDurationClock
              sleepBelowMetadataStyle={{ marginTop: 3, transform: [{ translateX: 3 }] }}
              cardBorderRadius={16}
              hideCategoryAboveTitle
              showSleepCategoryPillWithInlineDuration
              ambientalTitleOnly
              sleepOverlayMetadataStyle={{ transform: [{ translateX: 3 }, { translateY: -1 }] }}
              overlayGradientLocations={[0.18, 0.48, 1]}
            />
          )}
        </ScrollView>
      </View>

      <VideoActionsSheet
        video={actionsVideo}
        visible={actionsVideo !== null}
        onClose={() => setActionsVideo(null)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentShift: {
    flex: 1,
    transform: [{ translateY: -5 }],
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingBottom: 10,
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
    height: H,
  },
  stickyHeaderRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  libraryTabHeaderRow: {
    minHeight: 48,
    paddingBottom: 6,
    transform: [{ translateY: 9 }],
  },
  libraryTabBackBtn: {
    width: 43,
    height: 43,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  libraryTabBackHitArea: {
    position: "absolute",
    left: 16,
    top: -4,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  stickyTitleLibraryTab: {
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
    flex: 1,
    marginLeft: 0,
  },
  largeTitle: { fontFamily: "Manrope", fontSize: 18, lineHeight: 21, fontWeight: "700", letterSpacing: 0.2, textAlign: "center", flex: 1 },
  embeddedTabsHeader: {
    position: "relative",
    marginTop: 12,
    paddingTop: 0,
    paddingBottom: 6,
    transform: [{ translateY: 10 }],
  },
  tabsDivider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  tabRowContent: {
    paddingHorizontal: H_PAD,
    gap: 8,
    flexDirection: "row",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 1.2,
    borderColor: "rgba(241,224,255,0.25)",
  },
  pillTibet: { backgroundColor: "rgba(0,0,0,0.16)" },
  pillSel: { backgroundColor: "#FFFFFF", borderWidth: 0 },
  pillIndigo: { backgroundColor: "rgba(0,0,0,0.16)" },
  pillIndigo2Inactive: {
    backgroundColor: "rgba(0,0,0,0.16)",
    borderColor: "rgba(241,224,255,0.25)",
  },
  pillText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: "#F4F4F4",
  },
  pillTextSel: { fontFamily: "Manrope", color: "#2D0D3A", fontWeight: "600" },
  pillTextIndigoSel: { color: "#F9F9F9" },
  themeCollectionsSection: {
    paddingHorizontal: H_PAD,
    marginBottom: 53,
  },
  themeCollectionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 14,
    rowGap: 18,
  },
  themeCollectionsCarousel: {
    marginHorizontal: -H_PAD,
  },
  themeCollectionsCarouselContent: {
    paddingHorizontal: H_PAD,
    gap: 14,
  },
  themeCollectionItem: {
    gap: 3,
  },
  themeCollectionGridItem: {
    width: (W - H_PAD * 2 - 14) / 2,
  },
  themeCollectionCarouselItem: {
    width: CAROUSEL_CARD_W,
  },
  themeCollectionCard: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  themeCollectionLabel: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    rowGap: 35,
  },
  favoriteSessionCarousel: {
    marginBottom: 53,
    paddingHorizontal: H_PAD,
  },
  favoriteSessionGrid: {
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  allCollections: {
    paddingTop: 23,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: H_PAD,
    marginTop: -27,
    marginBottom: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  videoCarouselSection: {
    marginBottom: 53,
  },
  carouselTitle: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginHorizontal: H_PAD,
    marginBottom: 17,
  },
  videoCarouselScroll: {
    width: "100%",
  },
  videoCarouselContent: {
    paddingHorizontal: H_PAD,
    gap: 14,
  },
  playlistsTab: {
    paddingTop: 2,
  },
  ambientalGrid: {
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: H_PAD,
  },
  emptyText: { fontFamily: "Manrope", fontSize: 13, flex: 1 },
});
