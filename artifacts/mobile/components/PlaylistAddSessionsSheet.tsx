import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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

import { useCatalog } from "@/context/CatalogContext";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSessionById, type Session } from "@/data/sessions";
import { getGuideById } from "@/data/guides";
import { getArtist } from "@/data/artists";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import {
  buildVisibleFavoriteTabs,
  FAVORITE_COLLECTION_TABS,
  type FavoriteCollectionTabId,
} from "@/lib/favorites-home-helpers";

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
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
  const guide = session.guideId ? getGuideById(session.guideId) : null;
  const artist = session.artistId ? getArtist(session.artistId) : null;
  const author = guide?.name ?? artist?.name ?? "Casa del Cuenco";
  return (
    <View style={styles.cardSlot}>
      <Pressable onPress={onToggle} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
        <View style={styles.cardImageWrap}>
          <Image
            source={session.image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{session.title}</Text>
        <Text style={styles.cardAuthor} numberOfLines={1}>{author}</Text>
      </Pressable>
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        style={[styles.selectButton, selected && styles.selectButtonSelected]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={`${selected ? "Quitar" : "Agregar"} ${session.title}`}
      >
        {!selected && (
          <>
            <BlurView
              intensity={Platform.OS === "android" ? 60 : 28}
              tint="default"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, styles.selectButtonWhiteTint]} />
          </>
        )}
        <Feather
          name={selected ? "check" : "plus"}
          size={selected ? 23 : 18}
          color={selected ? "#060A0F" : TEXT}
        />
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
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const dividerVisibleRef = useRef(false);

  const topPad = Platform.OS === "web" ? 28 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const playlist = playlists.find((item) => item.id === playlistId);

  const favoriteSessions = useMemo(() => {
    const inAnyFavoriteFolder = new Set(favFolders.flatMap((folder) => folder.sessionIds));
    return favorites
      .filter((id) => !inAnyFavoriteFolder.has(id))
      .map((id) => getSessionById(id))
      .filter((session): session is Session =>
        session !== undefined && session.categoryId !== "ambientales"
      );
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
    dividerVisibleRef.current = false;
    dividerOpacity.setValue(0);
  }, [dividerOpacity, visible]);

  const handleContentScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const nextVisible = event.nativeEvent.contentOffset.y > 0.5;
    if (nextVisible === dividerVisibleRef.current) return;
    dividerVisibleRef.current = nextVisible;
    Animated.timing(dividerOpacity, {
      toValue: nextVisible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [dividerOpacity]);

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
            <Text style={styles.title}>Agregar desde Mis favoritos</Text>
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
          <Animated.View
            pointerEvents="none"
            style={[styles.tabsDivider, { opacity: dividerOpacity }]}
          />
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
            scrollEventThrottle={16}
            onScroll={handleContentScroll}
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  headerCopy: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerSpacer: { width: 40 },
  title: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 12,
    marginTop: 9,
    textAlign: "center",
  },
  tabsBorder: {
    position: "relative",
    paddingTop: 17,
    paddingBottom: 6,
  },
  tabsDivider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.07)",
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
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
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
  cardImageWrap: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  cardTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: 7,
  },
  cardAuthor: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
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
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    zIndex: 10,
    overflow: "hidden",
  },
  selectButtonWhiteTint: {
    backgroundColor: "rgba(255,255,255,0.15)",
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