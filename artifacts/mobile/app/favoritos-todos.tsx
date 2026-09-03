import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
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
import { LinearGradient } from "expo-linear-gradient";

import { SessionCard } from "@/components/SessionCard";
import { VideoCard } from "@/components/VideoCard";
import { VideoActionsSheet } from "@/components/VideoActionsSheet";
import { usePlayer } from "@/context/PlayerContext";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useVideosState } from "@/context/VideosContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSessionById, type Session } from "@/data/sessions";
import { type VideoItem } from "@/data/videos";
import { useColors } from "@/hooks/useColors";
import { useVideos } from "@/hooks/useVideos";
import { StickyHeaderSurface } from "@/components/StickyHeaderSurface";
import { getListenNowButtonColors } from "@/components/GoldGradient";

const H_PAD = 19;
const { width: W } = Dimensions.get("window");
const CARD_W = (W - H_PAD * 2 - 14) / 2;
const LISTEN_PURPLE_GRADIENT = getListenNowButtonColors(true);

const FAV_TABS = [
  { id: "meditaciones", label: "Meditaciones", icon: "compass",     categoryId: "meditaciones-guiadas" },
  { id: "sesiones",     label: "Sonoterapia",  icon: "radio",       categoryId: "sonidos-ancestrales" },
  { id: "musica",       label: "Música",       icon: "music",       categoryId: "musica-sonidos" },
  { id: "ambientales",  label: "Ambientales",  icon: "leaf",        categoryId: "ambientales" },
  { id: "historias",    label: "Historias",    icon: "book-open",   categoryId: "historias" },
  { id: "charlas",      label: "Charlas",      icon: "message-circle", categoryId: "charlas" },
  { id: "videos",       label: "Videos",       icon: "play-circle", categoryId: null },
] as const;

type FavTabId = typeof FAV_TABS[number]["id"];

function FavPill({
  tabId, sel, label, icon, indigo2BackgroundColor, onPress,
}: {
  tabId: FavTabId;
  sel: boolean;
  label: string;
  icon: string;
  indigo2BackgroundColor?: Animated.AnimatedInterpolation<string | number>;
  onPress: () => void;
}) {
  const { theme } = useSceneTheme();
  const selectedColors: [string, string] =
    tabId === "meditaciones" || tabId === "videos" ? LISTEN_PURPLE_GRADIENT
      : tabId === "sesiones" ? ["#8C4912", "#7A3C0A"]
      : tabId === "musica" ? ["#307E91", "#1A5863"]
        : tabId === "ambientales" ? ["#357849", "#23522F"]
          : tabId === "historias" ? ["#8F227F", "#691E5E"]
            : tabId === "charlas" ? ["#953732", "#78221E"]
              : theme.id === "indigo" ? ["#784576", "#50326E"]
                : ["#FFFFFF", "#F5F5F5"];
  const contentColor = sel ? "#F9F9F9" : "#F4F4F4";
  const selectedTextColor = sel ? "#F9F9F9" : "#F4F4F4";

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.pill,
            theme.id === "tibet" && styles.pillTibet,
            theme.id === "indigo" && styles.pillIndigo,
            !sel && theme.id === "indigo2" && styles.pillIndigo2Inactive,
            !sel && theme.id === "indigo2" && indigo2BackgroundColor && {
              backgroundColor: indigo2BackgroundColor,
            },
            sel && styles.pillSel,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {sel && (
            <LinearGradient
              colors={selectedColors}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {tabId === "ambientales" ? (
            <MaterialCommunityIcons name="leaf" size={22} color={contentColor} />
          ) : (
            <Feather name={icon as never} size={22} color={contentColor} />
          )}
          <Text style={[styles.pillText, { color: selectedTextColor }]} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

export default function FavoritosTodosScreen() {
  const goBack = useBackOverride();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, playSession, currentSession } = usePlayer();
  const { favFolders } = useFoldersPlaylists();
  const { favoriteVideoIds } = useVideosState();
  const { theme: sceneTheme, activeSceneId } = useSceneTheme();
  const { videos: allVideos } = useVideos();
  const [actionsVideo, setActionsVideo] = useState<VideoItem | null>(null);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const libraryHeaderButtonBackground = activeSceneId === "indigo"
    ? "rgba(42,40,64,0.65)"
    : "rgba(255,255,255,0.12)";

  const [activeTab, setActiveTab] = useState<FavTabId>("sesiones");
  const titleProgress = useRef(new Animated.Value(0)).current;
  const indigo2TabsSurfaceAnim = useRef(new Animated.Value(0)).current;
  const compactRef = useRef(false);
  const stickySurfaceOpacity = titleProgress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.96] });
  const indigo2TabsBackgroundColor = indigo2TabsSurfaceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.025)", "rgba(255,255,255,0.075)"],
  });
  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const compact = event.nativeEvent.contentOffset.y > 8;
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
  }, [favorites, favFolders]);

  const activeCategory = FAV_TABS.find((t) => t.id === activeTab)!.categoryId;
  const tabSessions = useMemo(
    () => favSessions.filter((s) => s.categoryId === activeCategory),
    [favSessions, activeCategory],
  );

  const favVideos = useMemo(
    () => allVideos.filter((v) => favoriteVideoIds.includes(v.id)),
    [allVideos, favoriteVideoIds],
  );

  const openSession = (s: Session) => {
    if (s.skipMiniPlayer) { playSession(s); return; }
    if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
    router.push(`/session/${s.id}` as never);
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
            (activeSceneId === "indigo" || activeSceneId === "indigo2") && styles.stickyHeaderFade,
            { paddingTop: topPad + 8 },
          ]}
          onLayout={(event) => setStickyHeaderHeight(event.nativeEvent.layout.height)}
        >
          <StickyHeaderSurface
            opacity={stickySurfaceOpacity}
            tint={sceneTheme.gradient[0] as string}
            showTint={activeSceneId !== "indigo" && activeSceneId !== "indigo2"}
            showDivider={activeSceneId !== "indigo" && activeSceneId !== "indigo2"}
            blurIntensity={activeSceneId === "indigo" || activeSceneId === "indigo2" ? 85 : undefined}
            showBlackTint={activeSceneId !== "indigo" && activeSceneId !== "indigo2"}
            strongBlur={activeSceneId === "indigo" || activeSceneId === "indigo2"}
            fadeBottom={activeSceneId === "indigo" || activeSceneId === "indigo2"}
          />
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
              {FAV_TABS.map((tab) => (
                <FavPill
                  key={tab.id}
                  tabId={tab.id}
                  sel={activeTab === tab.id}
                  label={tab.label}
                  icon={tab.icon}
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
          {/* Grilla */}
          {activeTab === "videos" ? (
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
          ) : tabSessions.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="heart" size={20} color="#f9f9f9" />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Aún no tienes favoritos en esta colección.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {tabSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  width={CARD_W}
                  style={{ marginRight: 0 }}
                  showCardMetadata
                  showAuthorAvatar={false}
                  overridePress={() => openSession(session)}
                  playing={currentSession?.id === session.id}
                />
              ))}
            </View>
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
    flexDirection: "row",
    alignItems: "center",
    height: 51,
    paddingHorizontal: 16,
    borderRadius: 27,
    gap: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pillTibet: { backgroundColor: "rgba(0,0,0,0.15)" },
  pillSel: { borderWidth: 0 },
  pillIndigo: { backgroundColor: "rgba(42,40,64,0.65)" },
  pillIndigo2Inactive: {
    backgroundColor: "rgba(255,255,255,0.025)",
    borderColor: "rgba(255,255,255,0.04)",
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
