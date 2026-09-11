import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";

import { SessionCarousel } from "@/components/SessionCarousel";
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
import { isIndigoThemeId } from "@/config/scene-themes";
import { PLAYLISTS, type EditorialPlaylist } from "@/data/playlists";
import { useCatalog } from "@/context/CatalogContext";
import {
  buildVisibleFavoriteTabs,
  FAVORITE_COLLECTION_TABS,
  resolveSavedEditorialFavorites,
  type FavoriteCollectionTabId,
} from "@/lib/favorites-home-helpers";

const H_PAD = 14;
const { width: W } = Dimensions.get("window");
const CARD_W = (W - H_PAD * 2 - 14) / 2;
function FavPill({
  sel, label, indigo2BackgroundColor, onPress,
}: {
  sel: boolean;
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
            !sel && theme.id === "indigo2" && styles.pillIndigo2Inactive,
            !sel && theme.id === "indigo2" && indigo2BackgroundColor && {
              backgroundColor: indigo2BackgroundColor,
            },
            sel && styles.pillSel,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
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
        cardBorderRadius={16}
        titleSize={19}
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
      ambientalTitleOnly
      ambientalImageLift={9}
      ambientalImageFillTop
      ambientalCardBackground="rgba(0,0,0,0.28)"
      ambientalCardBorderColor="rgba(249,249,249,0.2)"
      ambientalCardBorderWidth={1}
      ambientalCardBorderRadius={28}
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
            width={CARD_W}
            onOptionsPress={() => onOptionsPress(video)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function FavoritosTodosScreen() {
  const goBack = useBackOverride();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, playSession } = usePlayer();
  const { isPremium } = usePremium();
  const { favFolders, savedEditorialPlaylistIds } = useFoldersPlaylists();
  const { version: catalogVersion } = useCatalog();
  const { favoriteVideoIds } = useVideosState();
  const { theme: sceneTheme, activeSceneId } = useSceneTheme();
  const { videos: allVideos } = useVideos();
  const [actionsVideo, setActionsVideo] = useState<VideoItem | null>(null);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const libraryHeaderButtonBackground = "rgba(0,0,0,0.28)";

  const [activeTab, setActiveTab] = useState<FavoriteCollectionTabId>("all");
  const titleProgress = useRef(new Animated.Value(0)).current;
  const indigo2TabsSurfaceAnim = useRef(new Animated.Value(0)).current;
  const compactRef = useRef(false);
  const indigo2TabsBackgroundColor = indigo2TabsSurfaceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0.28)", "rgba(0,0,0,0.28)"],
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

  const visibleTabs = useMemo(
    () => buildVisibleFavoriteTabs(
      favSessions.map((session) => session.categoryId),
      favVideos.length > 0,
      favoritePlaylists.length > 0,
    ),
    [favSessions, favVideos.length, favoritePlaylists.length],
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

  return (
    <LinearGradient
      style={styles.root}
      colors={sceneTheme.gradient as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar hidden />

      <View style={styles.contentShift}>
        <View
          style={[
            styles.stickyHeader,
            (isIndigoThemeId(activeSceneId) || activeSceneId === "indigo2") && styles.stickyHeaderFade,
            { paddingTop: topPad + 8 },
          ]}
          onLayout={(event) => setStickyHeaderHeight(event.nativeEvent.layout.height)}
        >
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { opacity: titleProgress }]}
          >
            <LinearGradient
              colors={sceneTheme.gradient as unknown as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
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
                    { backgroundColor: libraryHeaderButtonBackground, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="chevron-left" size={26} color="#FBFBFB" />
                </View>
              )}
            </Pressable>
            <Animated.Text style={[styles.largeTitle, { color: colors.foreground, opacity: titleProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>Mis favoritos</Animated.Text>
            <Animated.View pointerEvents="none" style={[styles.compactTitleOverlay, { opacity: titleProgress }]}>
              <Text style={[styles.compactTitle, { color: colors.foreground }]}>Mis favoritos</Text>
            </Animated.View>
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
                  label={tab.label}
                   indigo2BackgroundColor={indigo2TabsBackgroundColor}
                  onPress={() => setActiveTab(tab.id)}
                />
              ))}
            </ScrollView>
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
                {visibleContentTabs.map((tab) => {
                  if (tab.id === "videos") {
                    return (
                      <FavoriteVideosCarousel
                        key={tab.id}
                        title={tab.label}
                        videos={favVideos}
                        onOptionsPress={setActionsVideo}
                      />
                    );
                  }
                  if (tab.id === "playlists") {
                    return (
                      <EditorialPlaylistCarousel
                        key={tab.id}
                        title={tab.label}
                        playlists={favoritePlaylists}
                        onPress={openEditorialPlaylist}
                      />
                    );
                  }
                  const sessions = favSessions.filter(
                    (session) => session.categoryId === tab.categoryId,
                  );
                  return (
                    <FavoriteSessionsCarousel
                      key={tab.id}
                      title={tab.label}
                      tabId={tab.id}
                      sessions={sessions}
                      isPremium={isPremium}
                      onPress={openSession}
                    />
                  );
                })}
              </View>
            )
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
              ambientalImageLift={9}
              ambientalImageFillTop
              ambientalCardBackground="rgba(0,0,0,0.28)"
              ambientalCardBorderColor="rgba(249,249,249,0.2)"
              ambientalCardBorderWidth={1}
              ambientalCardBorderRadius={28}
              ambientalTitleOnlyMetadataStyle={{
                transform: [{ translateY: -2 }],
              }}
              ambientalTitleOnlyTitleStyle={{
                height: 36,
                textAlign: "center",
                textAlignVertical: "top",
              }}
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
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  stickyHeaderFade: {
    overflow: "visible",
  },
  stickyHeaderRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 19,
    paddingBottom: 12,
  },
  libraryTabHeaderRow: {
    minHeight: 48,
    paddingBottom: 12,
  },
  libraryTabBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  libraryTabBackHitArea: {
    position: "absolute",
    left: 13,
    top: -6,
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
  largeTitle: { fontFamily: "Manrope", fontSize: 20, lineHeight: 26, fontWeight: "700", letterSpacing: 0.2, textAlign: "center", flex: 1 },
  compactTitleOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  compactTitle: { fontFamily: "Manrope", fontSize: 20, lineHeight: 23, fontWeight: "700", letterSpacing: 0.2, textAlign: "center", transform: [{ translateY: -5 }] },
  embeddedTabsHeader: {
    marginTop: 6,
    paddingTop: 10,
    paddingBottom: 5,
  },
  tabRowContent: {
    paddingHorizontal: H_PAD,
    gap: 8,
    flexDirection: "row",
  },
  pill: {
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: "rgba(181,211,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pillTibet: { backgroundColor: "rgba(0,0,0,0.1)" },
  pillSel: { backgroundColor: "#FFFFFF", borderWidth: 0 },
  pillIndigo: { backgroundColor: "rgba(181,211,255,0.1)" },
  pillIndigo2Inactive: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderColor: "rgba(255,255,255,0.2)",
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
  videoCarouselSection: {
    marginBottom: 53,
  },
  carouselTitle: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 19,
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
