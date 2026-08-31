import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import React, { useMemo, useState } from "react";
import {
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
import { getSceneTabSurface } from "@/utils/scene-tab";

const H_PAD = 19;
const { width: W } = Dimensions.get("window");
const CARD_W = (W - H_PAD * 2 - 14) / 2;

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
  tabId, sel, label, icon, onPress,
}: { tabId: FavTabId; sel: boolean; label: string; icon: string; onPress: () => void }) {
  const { theme } = useSceneTheme();
  const selectedColors: [string, string] =
    tabId === "sesiones" ? ["#8C4912", "#7A3C0A"]
      : tabId === "musica" ? ["#307E91", "#1A5863"]
        : tabId === "ambientales" ? ["#357849", "#23522F"]
          : tabId === "historias" ? ["#8F227F", "#691E5E"]
            : tabId === "charlas" ? ["#953732", "#78221E"]
              : theme.id === "indigo" ? ["#784576", "#50326E"]
                : ["#FFFFFF", "#F5F5F5"];
  const isDarkSelectedText = ["meditaciones", "sesiones", "musica", "videos"].includes(tabId) && theme.id !== "indigo";
  const contentColor = sel && isDarkSelectedText ? "#0D0A1E" : "#F4F4F4";
  const selectedTextColor = sel && isDarkSelectedText ? "#0D0A1E" : "#F4F4F4";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        theme.id === "tibet" && styles.pillTibet,
        theme.id === "indigo" && styles.pillIndigo,
        { borderColor: getSceneTabSurface(theme.id) },
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

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const libraryHeaderButtonBackground = activeSceneId === "indigo"
    ? "rgba(42,40,64,0.65)"
    : "rgba(255,255,255,0.12)";

  const [activeTab, setActiveTab] = useState<FavTabId>("sesiones");

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
        <View style={[styles.stickyHeader, { paddingTop: topPad + 8 }]}>
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
            <Text style={[styles.stickyTitleLibraryTab, { color: colors.foreground }]}>Mis favoritos</Text>
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
                  onPress={() => setActiveTab(tab.id)}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: 25 }}
          showsVerticalScrollIndicator={false}
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
    zIndex: 10,
    backgroundColor: "transparent",
  },
  stickyHeaderRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 19,
    paddingBottom: 10,
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
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 27,
    gap: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 2,
  },
  pillTibet: { backgroundColor: "rgba(0,0,0,0.15)" },
  pillSel: {},
  pillIndigo: { backgroundColor: "rgba(42,40,64,0.65)" },
  pillText: {
    fontFamily: "Manrope",
    fontSize: 15,
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
