import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
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

const H_PAD = 19;
const { width: W } = Dimensions.get("window");
const CARD_W = (W - H_PAD * 2 - 14) / 2;

const FAV_TABS = [
  { id: "sesiones",     label: "Sonoterapia",  categoryId: "sonidos-ancestrales" },
  { id: "meditaciones", label: "Meditaciones", categoryId: "meditaciones-guiadas" },
  { id: "musica",       label: "Música",       categoryId: "musica-sonidos" },
  { id: "dormir",       label: "Dormir",       categoryId: "descanso" },
  { id: "videos",       label: "Videos",       categoryId: null },
] as const;

type FavTabId = typeof FAV_TABS[number]["id"];

function FavPill({
  sel, label, onPress,
}: { sel: boolean; label: string; onPress: () => void }) {
  const { theme } = useSceneTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, theme.id === "indigo" && styles.pillIndigo, sel && styles.pillSel, { opacity: pressed ? 0.7 : 1 }]}
    >
      {sel && <LinearGradient colors={theme.id === "indigo" ? ["#774544", "#50316f"] : ["#F9F9F9", "#F9F9F9"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />}
      <Text style={[styles.pillText, sel && styles.pillTextSel, sel && theme.id === "indigo" && styles.pillTextIndigoSel]} numberOfLines={1}>
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
      <StatusBar hidden />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: 14 }}>
          <BackPill onPress={goBack ?? (() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
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
                  cardBg="rgba(255,255,255,0.045)"
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
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 5,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pillSel: { borderWidth: 0 },
  pillIndigo: { backgroundColor: "rgba(42,40,64,0.65)" },
  pillText: {
    fontFamily: "Manrope",
    fontSize: 16,
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
