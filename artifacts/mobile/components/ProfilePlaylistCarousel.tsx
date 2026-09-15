import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { PressScale } from "@/components/PressScale";
import { isIndigoThemeId } from "@/config/scene-themes";
import { getTwoCardCarouselCardWidth } from "@/constants/carousel";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";
import { useDrawer } from "@/context/DrawerContext";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getDefaultPlaylistCover } from "@/data/default-playlist-covers";
import { useColors } from "@/hooks/useColors";

const GRID_PAD = 14;
const CARD_GAP = 14;

export const ProfilePlaylistCarousel = React.memo(function ProfilePlaylistCarousel({
  marginBottom = 32,
}: {
  marginBottom?: number;
}) {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { openLib } = useDrawer();
  const { playlists } = useFoldersPlaylists();
  const cardWidth = getTwoCardCarouselCardWidth(width, GRID_PAD);
  const accent = theme.accent ?? colors.accent;
  const cardBackground = theme.id === "tibet"
    ? "rgba(0,0,0,0.15)"
    : isIndigoThemeId(theme.id)
      ? "rgba(181,211,255,0.057)"
      : theme.id === "indigo2"
        ? "rgba(191,207,255,0.096)"
        : "rgba(181,211,255,0.057)";

  const userPlaylists = useMemo(
    () =>
      playlists
        .filter((playlist) => !getDefaultPlaylistCover(playlist.id))
        .map((playlist, index) => ({
          playlist,
          index,
          createdAt: Date.parse(playlist.createdAt),
        }))
        .sort((a, b) => {
          const aTime = Number.isFinite(a.createdAt) ? a.createdAt : 0;
          const bTime = Number.isFinite(b.createdAt) ? b.createdAt : 0;
          return bTime - aTime || a.index - b.index;
        })
        .map(({ playlist }) => playlist),
    [playlists],
  );

  return (
    <View style={[styles.section, { marginBottom }]}>
        <Text style={styles.sectionTitle}>Mis playlist</Text>
        <FlatList
          horizontal
          data={userPlaylists}
          keyExtractor={(playlist) => playlist.id}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={3}
          removeClippedSubviews={Platform.OS === "android"}
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <PressScale
              onPress={() => openLib("playlists")}
              style={{ width: cardWidth }}
            >
              <View
                style={[
                  styles.addCard,
                  {
                    width: cardWidth,
                    height: cardWidth,
                    borderColor: "#F9F9F9",
                  },
                ]}
              >
                <Feather name="plus" size={23} color="#F9F9F9" />
                <Text style={styles.addLabel}>Crear una playlist</Text>
              </View>
            </PressScale>
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyCards}>
              {["empty-left", "empty-right"].map((placeholderId) => (
                <View
                  key={placeholderId}
                  style={[
                    styles.placeholderCard,
                    {
                      width: cardWidth,
                      height: cardWidth,
                      backgroundColor: cardBackground,
                    },
                  ]}
                >
                  <Feather
                    name="list"
                    size={44}
                    color="#BE9650"
                    style={styles.emptyPlaceholderIcon}
                  />
                </View>
              ))}
            </View>
          )}
          renderItem={({ item: playlist }) => {
            const contentCount = playlist.sessionIds.length + (playlist.videoIds?.length ?? 0);
            return (
              <PressScale
                onPress={() => router.push(`/playlist/${encodeURIComponent(playlist.id)}` as never)}
                style={{ width: cardWidth }}
              >
                {playlist.coverUri ? (
                  <Image
                    source={{ uri: playlist.coverUri }}
                    style={{
                      width: cardWidth,
                      height: cardWidth,
                      borderRadius: 13,
                    }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.placeholderCard,
                      {
                        width: cardWidth,
                        height: cardWidth,
                        backgroundColor: cardBackground,
                      },
                    ]}
                  >
                    <Feather
                      name="list"
                      size={44}
                      color={WIDGET_GREEN_SOLID}
                      style={styles.placeholderIcon}
                    />
                  </View>
                )}
                <Text style={styles.playlistName} numberOfLines={2}>
                  {playlist.name}
                </Text>
                <Text style={[styles.contentCount, { color: accent }]} numberOfLines={1}>
                  {contentCount} contenido{contentCount === 1 ? "" : "s"}
                </Text>
              </PressScale>
            );
          }}
        />
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 0,
  },
  sectionTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 17,
  },
  scroll: {
    marginHorizontal: 0,
  },
  content: {
    paddingHorizontal: 0,
    gap: CARD_GAP,
  },
  emptyCards: {
    flexDirection: "row",
    gap: CARD_GAP,
  },
  addCard: {
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  addLabel: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  placeholderCard: {
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholderIcon: {
    opacity: 0.5,
  },
  emptyPlaceholderIcon: {
    opacity: 0.5,
  },
  playlistName: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  contentCount: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    marginTop: 2,
  },
});