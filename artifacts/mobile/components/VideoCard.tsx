import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type VideoItem } from "@/data/videos";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";

type Props = {
  video: VideoItem;
  width?: number;
  horizontal?: boolean;
  cardBg?: string;
};

function LockStar() {
  return (
    <Image
      source={require("../assets/images/estrella-premium.png")}
      style={[styles.lockBadge, { width: 22, height: 22 }]}
      contentFit="contain"
    />
  );
}

function PlayOverlay() {
  return (
    <View style={styles.playOverlay} pointerEvents="none">
      <View style={styles.playCircle}>
        <Feather name="play" size={16} color="#090F17" style={{ marginLeft: 2 }} />
      </View>
    </View>
  );
}

export function VideoCard({ video, width = 240, horizontal = false, cardBg }: Props) {
  const colors = useColors();
  const { isPremium } = usePremium();
  const locked = !!video.isPremium && !isPremium;

  const handlePress = () => {
    if (locked) router.push("/membresia" as never);
    else router.push(`/video/${video.id}` as never);
  };

  if (horizontal) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.hRow,
          { backgroundColor: cardBg ?? "rgba(255,255,255,0.05)", opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <View style={styles.hImageWrap}>
          <Image
            source={video.thumbnail}
            style={styles.hImage}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
          {locked && <LockStar />}
        </View>
        <View style={styles.hContent}>
          <Text style={[styles.hKicker, { color: colors.accent }]}>VIDEO</Text>
          <Text style={[styles.hTitle, { color: colors.foreground }]} numberOfLines={2}>
            {video.title}
          </Text>
          <View style={styles.hMeta}>
            <Text style={[styles.hDuration, { color: colors.mutedForeground }]}>
              {video.durationLabel}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, { width, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={video.thumbnail}
          style={styles.cardImage}
          contentFit="cover"
          placeholder={BLUR_PLACEHOLDER}
          transition={IMAGE_TRANSITION}
        />
        {locked && <LockStar />}
        <View style={styles.durBadge}>
          <Text style={styles.durText}>{video.durationLabel}</Text>
        </View>
      </View>
      {video.author && (
        <Text style={[styles.cardAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
          {video.author}
        </Text>
      )}
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
        {video.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: 14 },
  imageContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 14,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: "100%" },
  cardAuthor: {
    fontSize: 11,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  durBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(6,10,15,0.72)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durText: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },

  hRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    height: 96,
  },
  hImageWrap: { width: 140, height: 96 },
  hImage: { width: 140, height: 96 },
  hContent: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, justifyContent: "center" },
  hKicker: { fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 },
  hTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 5 },
  hMeta: { flexDirection: "row", alignItems: "center" },
  hDuration: { fontSize: 11 },

  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(214,168,91,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
