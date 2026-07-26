import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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

const H_PAD = 19;
const { width: W } = Dimensions.get("window");
const CARD_W = (W - H_PAD * 2 - 14) / 2;

const FAV_TABS = [
  { id: "sesiones",     label: "Sesiones",     categoryId: "sonidos-ancestrales" },
  { id: "meditaciones", label: "Meditaciones", categoryId: "meditaciones-guiadas" },
  { id: "musica",       label: "Música",       categoryId: "musica-sonidos" },
  { id: "dormir",       label: "Dormir",       categoryId: "descanso" },
  { id: "videos",       label: "Videos",       categoryId: null },
] as const;

type FavTabId = typeof FAV_TABS[number]["id"];

function FavPill({
  sel, label, onPress,
}: { sel: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, sel && styles.pillSel, { opacity: pressed ? 0.7 : 1 }]}
    >
      {sel && <View style={[StyleSheet.absoluteFill, { backgroundColor: "#F9F9F9" }]} />}
      <Text style={[styles.pillText, sel && styles.pillTextSel]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function FavoritosTodosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, playSession, currentSession } = usePlayer();
  const { favFolders } = useFoldersPlaylists();
  const { favoriteVideoIds } = useVideosState();
  const { theme: sceneTheme } = useSceneTheme();
  const { videos: allVideos } = useVideos();
  const [actionsVideo, setActionsVideo] = useState<VideoItem | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: 14 }}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: "rgba(255,255,255,0.06)" }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Título */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: 18 }}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Mis favoritos</Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRowContent}
          style={{ marginBottom: 24 }}
        >
          {FAV_TABS.map((tab) => (
            <FavPill
              key={tab.id}
              sel={activeTab === tab.id}
              label={tab.label}
              onPress={() => setActiveTab(tab.id)}
            />
          ))}
        </ScrollView>

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
                  onOptionsPress={() => setActionsVideo(v)}
                />
              ))}
            </View>
          )
        ) : tabSessions.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: "rgba(255,255,255,0.075)" }]}>
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
                showDuration={false}
                showAuthorAvatar={false}
                overridePress={() => openSession(session)}
                playing={currentSession?.id === session.id}
              />
            ))}
          </View>
        )}
      </ScrollView>

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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontFamily: "Manrope",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tabRowContent: {
    paddingHorizontal: H_PAD,
    gap: 8,
    flexDirection: "row",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 999,
    gap: 5,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.053)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pillSel: { borderWidth: 0 },
  pillText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.3,
    color: "#F4F4F4",
  },
  pillTextSel: { fontFamily: "Manrope", color: "#2D0D3A", fontWeight: "500" },
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
