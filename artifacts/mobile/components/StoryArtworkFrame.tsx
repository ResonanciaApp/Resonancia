import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import type { ReflectionStoryComposition } from "@/lib/reflection-story-logic";
import type { ProfileAvatarSource } from "@/lib/profile-avatar";
import { StoryAvatar } from "./StoryAvatar";

export const STORY_WIDTH = 1080;
export const STORY_QUOTE_TOP = 610;
export const STORY_QUOTE_HEIGHT = 700;

export type ReflectionArtworkProps = {
  message: string;
  width: number;
  bgImageSource: number | { uri: string } | undefined;
  composition: ReflectionStoryComposition;
  avatarSource?: ProfileAvatarSource;
  onReady?: () => void;
  onFailure?: () => void;
  onAvatarFailure?: () => void;
};

export function StoryArtworkFrame({
  message,
  width,
  bgImageSource,
  composition,
  avatarSource,
  onReady,
  onFailure,
  onAvatarFailure,
}: ReflectionArtworkProps) {
  const exportScale = width / STORY_WIDTH;
  const isExport = width === STORY_WIDTH;
  const height = (width * 16) / 9;
  const backgroundKey = JSON.stringify(bgImageSource);
  const avatarKey = JSON.stringify(avatarSource);
  const [loadedBackground, setLoadedBackground] = useState<string>();
  const [loadedAvatar, setLoadedAvatar] = useState<string>();
  useEffect(() => {
    if (loadedBackground === backgroundKey && (!avatarSource || loadedAvatar === avatarKey)) onReady?.();
  }, [loadedBackground, loadedAvatar, backgroundKey, avatarKey, avatarSource, onReady]);

  return (
    <View
      style={[
        styles.storyArtwork,
        {
          width,
          height,
          borderRadius: isExport ? 0 : 22,
        },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [
              { translateX: composition.backgroundX * width },
              { translateY: composition.backgroundY * height },
            ],
          },
        ]}
      >
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { transform: [{ scale: composition.backgroundScale }] },
          ]}
        >
          <Image
            key={backgroundKey}
            source={bgImageSource}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            onLoad={() => setLoadedBackground(backgroundKey)}
            onError={onFailure}
          />
        </View>
      </View>
      <View pointerEvents="none" style={styles.storyShade} />
      <View
        pointerEvents="none"
        style={[
          styles.storyQuoteRegion,
          {
            top: STORY_QUOTE_TOP * exportScale,
            height: STORY_QUOTE_HEIGHT * exportScale,
            paddingHorizontal: 120 * exportScale,
            transform: [
              { translateX: composition.textX * width },
              { translateY: composition.textY * height },
            ],
          },
        ]}
      >
        <Text
          numberOfLines={14}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={[
            styles.storyQuote,
            {
              fontSize: 60 * exportScale,
              lineHeight: 78 * exportScale,
            },
          ]}
        >
          {message.trim()}
        </Text>
        <StoryAvatar source={avatarSource} scale={exportScale}
          onReady={() => setLoadedAvatar(avatarKey)} onFailure={onAvatarFailure ?? onFailure} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  storyArtwork: {
    overflow: "hidden",
    backgroundColor: "#191919",
  },
  storyShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  storyQuoteRegion: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  storyQuote: {
    flexShrink: 1,
    width: "100%",
    color: "#F9F9F9",
    fontFamily: "CormorantGaramond",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.42)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
});
