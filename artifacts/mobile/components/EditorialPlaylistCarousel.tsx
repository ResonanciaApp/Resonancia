import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import type { EditorialPlaylist } from "@/data/playlists";
import {
  SessionBadgeGlass,
  SessionDurationBadge,
} from "@/components/SessionDurationBadge";
import { getTwoCardCarouselCardWidth } from "@/constants/carousel";

const H_PAD = 16;
const CARD_GAP = 14;
const CARD_WIDTH = getTwoCardCarouselCardWidth(Dimensions.get("window").width, CARD_GAP) - 3.5;
const CARD_HEIGHT = CARD_WIDTH;

export function EditorialPlaylistCarousel({
  title,
  playlists,
  onPress,
  style,
}: {
  title: string;
  playlists: EditorialPlaylist[];
  onPress?: (playlist: EditorialPlaylist) => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (playlists.length === 0) return null;

  return (
    <View style={[styles.section, style]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
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
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={styles.stack}>
              <View style={styles.stackStripFront} />
              <View style={styles.stackStripBack} />
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
                <LinearGradient
                  pointerEvents="none"
                  colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.08)", "rgba(0,0,0,0.42)"]}
                  style={StyleSheet.absoluteFill}
                />
                {playlist.editorialType !== "none" ? (
                  <View style={styles.typePill}>
                    <SessionBadgeGlass showBlackTint={false} />
                    <View style={styles.whitePillTint} />
                    <Text style={styles.typeText}>
                      {playlist.editorialType === "relaxation"
                        ? "Relajación"
                        : playlist.editorialType === "ritual"
                          ? "Ritual"
                          : "Meditativa"}
                    </Text>
                  </View>
                ) : null}
                <SessionDurationBadge
                  label={playlist.durationLabel}
                  style={styles.duration}
                  whiteGlass
                />
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {playlist.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: H_PAD,
    marginTop: 0,
    marginBottom: 53,
  },
  titleRow: {
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
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
  stack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 11,
  },
  stackStripFront: {
    position: "absolute",
    top: CARD_HEIGHT,
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#717172",
  },
  stackStripBack: {
    position: "absolute",
    top: CARD_HEIGHT + 5,
    left: 17,
    right: 17,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#48474D",
  },
  cover: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(190,150,80,0.06)",
    justifyContent: "flex-end",
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
    left: 15,
    bottom: 15,
  },
  typePill: {
    position: "absolute",
    top: 15,
    left: 15,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    overflow: "hidden",
  },
  whitePillTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  typeText: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "700",
  },
  cardTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: 3,
  },
});
