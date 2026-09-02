import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { VIDEOS as STATIC_VIDEOS, type VideoItem } from "@/data/videos";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";

type Props = {
  video: VideoItem;
  width?: number;
  horizontal?: boolean;
  feed?: boolean;
  cardBg?: string;
  borderColor?: string;
  onOptionsPress?: () => void;
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
        <Feather name="play" size={16} color="#1B060F" style={{ marginLeft: 2 }} />
      </View>
    </View>
  );
}

export function VideoCard({
  video,
  width = 240,
  horizontal = false,
  feed = false,
  cardBg,
  borderColor,
  onOptionsPress,
}: Props) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const secondaryTextColor = theme.id === "indigo2" ? colors.accent : colors.mutedForeground;
  const { isPremium } = usePremium();
  const locked = !!video.isPremium && !isPremium;
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const localThumbnail =
    STATIC_VIDEOS.find((staticVideo) => staticVideo.id === video.id)?.thumbnail ??
    STATIC_VIDEOS[0].thumbnail;
  const thumbnailSource = thumbnailFailed ? localThumbnail : video.thumbnail;
  const thumbnailKey =
    typeof video.thumbnail === "object" &&
    video.thumbnail !== null &&
    "uri" in video.thumbnail
      ? String(video.thumbnail.uri)
      : video.id;

  useEffect(() => {
    setThumbnailFailed(false);
  }, [video.id, thumbnailKey]);

  const handleThumbnailError = () => {
    if (!thumbnailFailed) setThumbnailFailed(true);
  };

  const handlePress = () => {
    if (locked) router.push("/membresia" as never);
    else router.push(`/video/${video.id}` as never);
  };

  if (feed) {
    const rating = video.rating ?? 4.8;
    return (
      <View style={styles.feedItem}>
        <Pressable onPress={handlePress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
          <View style={styles.feedImageWrap}>
            <Image
              source={thumbnailSource}
              style={styles.feedImage}
              contentFit="cover"
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
              onError={handleThumbnailError}
            />
            {locked && <LockStar />}
            <View style={styles.feedCamBadge}>
              <Feather name="video" size={13} color="#FFFFFF" />
            </View>
          </View>
        </Pressable>

        <View style={styles.feedCaptionRow}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 }}>
            <Text style={[styles.feedCaption, { color: secondaryTextColor, flex: 0, marginRight: 0 }]} numberOfLines={1}>
              {rating.toFixed(1)}
            </Text>
            <Text style={[styles.feedCaption, { color: secondaryTextColor, flex: 0, marginLeft: 2, marginRight: 0 }]} numberOfLines={1}>
              ★
            </Text>
            <Text style={[styles.feedCaption, { color: secondaryTextColor, marginLeft: 4, marginRight: 0 }]} numberOfLines={1}>
              {video.subtitle} · {video.durationLabel}
            </Text>
          </View>
          <Pressable
            hitSlop={10}
            onPress={onOptionsPress ?? (() => {})}
            accessibilityLabel="Más opciones"
          >
            <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Pressable onPress={handlePress}>
          <Text style={[styles.feedTitle, { color: colors.foreground }]} numberOfLines={2}>
            {video.title}
          </Text>
          {video.author && (
            <Text style={[styles.feedAuthor, { color: secondaryTextColor }]} numberOfLines={1}>
              {video.author}
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  if (horizontal) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.hRow,
          {
            backgroundColor: cardBg ?? "rgba(74,12,12,0.08)",
            borderColor: borderColor ?? "transparent",
            borderWidth: borderColor ? StyleSheet.hairlineWidth : 0,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={styles.hImageWrap}>
          <Image
            source={thumbnailSource}
            style={styles.hImage}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
            onError={handleThumbnailError}
          />
          {locked && <LockStar />}
        </View>
        <View style={styles.hContent}>
          <Text style={[styles.hTitle, { color: colors.foreground }]} numberOfLines={2}>
            {video.title}
          </Text>
          <View style={styles.hMeta}>
            <Text style={[styles.hDuration, { color: secondaryTextColor }]}>
              {video.durationLabel}
            </Text>
          </View>
        </View>
        {onOptionsPress ? (
          <Pressable
            hitSlop={10}
            onPress={onOptionsPress}
            accessibilityLabel="Más opciones"
            style={{ marginRight: 14, padding: 4 }}
          >
            <Feather name="more-horizontal" size={20} color={colors.mutedForeground} />
          </Pressable>
        ) : (
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} style={{ marginRight: 14 }} />
        )}
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
          source={thumbnailSource}
          style={styles.cardImage}
          contentFit="cover"
          placeholder={BLUR_PLACEHOLDER}
          transition={IMAGE_TRANSITION}
          onError={handleThumbnailError}
        />
        {locked && <LockStar />}
        <View style={styles.durBadge}>
          <Text style={styles.durText}>{video.durationLabel}</Text>
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
        {video.title}
      </Text>
      {video.author && (
        <Text style={[styles.cardAuthor, { color: secondaryTextColor }]} numberOfLines={1}>
          {video.author}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: 0 },
  imageContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 15,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: "100%" },
  cardTitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  cardAuthor: {
    fontFamily: "Manrope",
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  durBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(27,6,15,0.72)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#FFFFFF" },

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
  hTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 5 },
  hMeta: { flexDirection: "row", alignItems: "center" },
  hDuration: { fontFamily: "Manrope", fontSize: 11 },

  feedItem: { width: "100%", marginBottom: 28 },
  feedImageWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: "hidden",
  },
  feedImage: { width: "100%", height: "100%" },
  feedCamBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    padding: 5,
  },
  feedCaptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  feedCaption: { fontFamily: "Manrope", fontSize: 11, flex: 1, marginRight: 12 },
  feedTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700", lineHeight: 18, marginTop: 6 },
  feedAuthor: { fontFamily: "Manrope", fontSize: 11, marginTop: 4 },

  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212,175,55,0.92)",
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
