import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import type { EditorialPlaylist } from "@/data/playlists";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";

const H_PAD = 16;
const CARD_GAP = 14;
const CARD_WIDTH = Math.round((Dimensions.get("window").width - H_PAD * 2) * 0.7);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.76);

export function EditorialPlaylistCarousel({
  title,
  playlists,
  onPress,
}: {
  title: string;
  playlists: EditorialPlaylist[];
  onPress?: (playlist: EditorialPlaylist) => void;
}) {
  if (playlists.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <Feather name="chevron-right" size={18} color="#C2C2C2" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
        contentContainerStyle={styles.content}
      >
        {playlists.map((playlist) => (
          <Pressable
            key={playlist.id}
            onPress={() => onPress?.(playlist)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${playlist.title}`}
            testID={`editorial-playlist-${playlist.id}`}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.82 : 1 }]}
          >
            <View style={styles.cover}>
              {playlist.coverUrl ? (
                <Image
                  source={{ uri: playlist.coverUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  placeholder={BLUR_PLACEHOLDER}
                  transition={IMAGE_TRANSITION}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.missingCover}>
                  <Feather name="image" size={28} color="rgba(251,251,251,0.55)" />
                  <Text style={styles.missingCoverText}>Sin portada</Text>
                </View>
              )}
              <View style={styles.coverShade} pointerEvents="none" />
              <SessionDurationBadge
                label={playlist.durationLabel || "Selección"}
                style={styles.duration}
              />
              <Text style={styles.cardTitle} numberOfLines={2}>
                {playlist.title}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 33,
  },
  titleRow: {
    paddingHorizontal: H_PAD,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  carousel: {
    marginHorizontal: -H_PAD,
  },
  content: {
    paddingHorizontal: H_PAD,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
  },
  cover: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: "rgba(190,150,80,0.06)",
    justifyContent: "flex-end",
  },
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  missingCover: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  missingCoverText: {
    color: "rgba(251,251,251,0.55)",
    fontFamily: "Manrope",
    fontSize: 11,
  },
  duration: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});
