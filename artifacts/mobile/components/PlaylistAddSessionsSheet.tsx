import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
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

import { SessionCard } from "@/components/SessionCard";
import { useCatalog } from "@/context/CatalogContext";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSessionById, type Session } from "@/data/sessions";
import {
  buildVisibleFavoriteTabs,
  FAVORITE_COLLECTION_TABS,
  type FavoriteCollectionTabId,
} from "@/lib/favorites-home-helpers";
import { isIndigoThemeId } from "@/config/scene-themes";

const H_PAD = 14;
const GRID_GAP = 14;
const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - H_PAD * 2 - GRID_GAP) / 2);
const TEXT = "#F9F9F9";
const MUTED = "#C2C2C2";

function FavoriteTab({
  selected,
  label,
  onPress,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useSceneTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        theme.id === "tibet" && styles.tabTibet,
        isIndigoThemeId(theme.id) && styles.tabIndigo,
        selected && styles.tabSelected,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[styles.tabText, selected && styles.tabTextSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function SelectableFavoriteCard({
  session,
  selected,
  onToggle,
}: {
  session: Session;
  selected: boolean;
  onToggle: () => void;
}) {
  const ambiental = session.categoryId === "ambientales";
  return (
    <View style={styles.cardSlot}>
      <SessionCard
        session={session}
        width={CARD_WIDTH}
        overridePress={onToggle}
        editorialPresentation
        categoryGridPresentation={!ambiental}
        sleepEditorialContent={!ambiental}
        showSleepCategoryPill={!ambiental}
        editorialCategoryPillId={session.categoryId}
        cardVariant={ambiental ? "ambiental" : undefined}
        thumbRadius={16}
      />
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        style={[styles.selectButton, selected && styles.selectButtonSelected]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${selected ? "Quitar" : "Agregar"} ${session.title}`}
      >
        <Feather name={selected ? "check" : "plus"} size={18} color={selected ? "#060A0F" : TEXT} />
      </Pressable>
    </View>
  );
}

export function PlaylistAddSessionsSheet({
  visible,
  playlistId,
  onClose,
}: {
  visible: boolean;
  playlistId: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { favorites } = usePlayer();
  const { version: catalogVersion } = useCatalog();
  const {
    playlists,
    favFolders,
    addToPlaylist,
    removeFromPlaylist,
    isInPlaylist,
  } = useFoldersPlaylists();
  const [activeTab, setActiveTab] = useState<FavoriteCollectionTabId>("all");

  const topPad = Platform.OS === "web" ? 28 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const playlist = playlists.find((item) => item.id === playlistId);

  const favoriteSessions = useMemo(() => {
    const inAnyFavoriteFolder = new Set(favFolders.flatMap((folder) => folder.sessionIds));
    return favorites
      .filter((id) => !inAnyFavoriteFolder.has(id))
      .map((id) => getSessionById(id))
      .filter((session): session is Session => session !== undefined);
  }, [favorites, favFolders, catalogVersion]);

  const tabs = useMemo(
    () => buildVisibleFavoriteTabs(
      favoriteSessions.map((session) => session.categoryId),
      false,
      false,
    ),
    [favoriteSessions],
  );

  useEffect(() => {
    if (!visible) return;
    setActiveTab("all");
  }, [visible]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) setActiveTab("all");
  }, [activeTab, tabs]);

  const selectedCategory = FAVORITE_COLLECTION_TABS.find((tab) => tab.id === activeTab)?.categoryId;
  const visibleSessions = useMemo(
    () => activeTab === "all"
      ? favoriteSessions
      : favoriteSessions.filter((session) => session.categoryId === selectedCategory),
    [activeTab, favoriteSessions, selectedCategory],
  );

  const toggleSession = (sessionId: string) => {
    if (isInPlaylist(playlistId, sessionId)) removeFromPlaylist(playlistId, sessionId);
    else addToPlaylist(playlistId, sessionId);
  };

  const selectedCount = favoriteSessions.filter((session) => isInPlaylist(playlistId, session.id)).length;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        style={styles.root}
      >
        <StatusBar hidden />

        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <Feather name="x" size={24} color={TEXT} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Agregar a esta Playlist</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {playlist?.name ?? "Playlist"} · {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabsBorder}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {tabs.map((tab) => (
              <FavoriteTab
                key={tab.id}
                selected={activeTab === tab.id}
                label={tab.label}
                onPress={() => setActiveTab(tab.id)}
              />
            ))}
          </ScrollView>
        </View>

        {favoriteSessions.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="heart" size={24} color={TEXT} />
            <Text style={styles.emptyTitle}>Aún no tienes sesiones favoritas</Text>
            <Text style={styles.emptyText}>
              Guarda sesiones en Mis Favoritos para agregarlas desde aquí.
            </Text>
          </View>
        ) : visibleSessions.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="heart" size={24} color={TEXT} />
            <Text style={styles.emptyText}>No hay favoritos en esta colección.</Text>
          </View>
        ) : (
          <FlatList
            data={visibleSessions}
            keyExtractor={(session) => session.id}
            renderItem={({ item }) => (
              <SelectableFavoriteCard
                session={item}
                selected={isInPlaylist(playlistId, item.id)}
                onToggle={() => toggleSession(item.id)}
              />
            )}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={[styles.gridContent, { paddingBottom: bottomPad + 36 }]}
            showsVerticalScrollIndicator={false}
            extraData={`${playlist?.sessionIds.join(",") ?? ""}:${activeTab}`}
          />
        )}
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  headerCopy: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerSpacer: { width: 40 },
  title: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  tabsBorder: {
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  tabsContent: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: H_PAD,
  },
  tab: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(181,211,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  tabTibet: { backgroundColor: "rgba(0,0,0,0.1)" },
  tabIndigo: { backgroundColor: "rgba(181,211,255,0.1)" },
  tabSelected: { backgroundColor: "#FFFFFF", borderWidth: 0 },
  tabText: {
    fontFamily: "Manrope",
    color: "#F4F4F4",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  tabTextSelected: { color: "#060A0F" },
  gridContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 25,
    rowGap: 30,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  cardSlot: {
    width: CARD_WIDTH,
    position: "relative",
  },
  selectButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    zIndex: 10,
  },
  selectButtonSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 36,
    paddingBottom: 60,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
});