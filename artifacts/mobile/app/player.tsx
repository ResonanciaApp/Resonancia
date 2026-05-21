import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlowRing } from "@/components/GlowRing";
import { SacredBackground } from "@/components/SacredBackground";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");
const ART_SIZE = width * 0.72;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function BreathingPulse({ isPlaying }: { isPlaying: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      scale.value = withRepeat(
        withTiming(1.12, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 800 });
    }
    return () => cancelAnimation(scale);
  }, [isPlaying]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: ART_SIZE + 40,
          height: ART_SIZE + 40,
          borderRadius: (ART_SIZE + 40) / 2,
          position: "absolute",
          backgroundColor: "rgba(198,155,79,0.05)",
          borderWidth: 1,
          borderColor: "rgba(198,155,79,0.15)",
        },
        animStyle,
      ]}
    />
  );
}

export default function PlayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentSession, isPlaying, isLoading, progress, elapsed, actualDurationSeconds, pauseResume, stop, isFavorite, toggleFavorite, seekTo } =
    usePlayer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!currentSession) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Feather name="music" size={40} color={colors.border} />
        <Text style={[styles.noSession, { color: colors.mutedForeground }]}>
          No session playing
        </Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtnSolo, { borderColor: colors.border }]}>
          <Text style={{ color: colors.mutedForeground }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // Use actual file duration (set by expo-av); falls back to declared duration until loaded
  const totalSeconds = actualDurationSeconds || currentSession.duration * 60;
  const remaining = totalSeconds - elapsed;
  const fav = isFavorite(currentSession.id);

  const handleSeek = (event: { nativeEvent: { locationX: number } }, barWidth: number) => {
    const x = event.nativeEvent.locationX;
    const p = Math.max(0, Math.min(1, x / barWidth));
    seekTo(p);
  };

  const handlePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pauseResume();
  };

  const skipForward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    seekTo(Math.min(1, progress + 10 / totalSeconds));
  };

  const skipBackward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    seekTo(Math.max(0, progress - 10 / totalSeconds));
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Image
        source={currentSession.image}
        style={[StyleSheet.absoluteFill, { opacity: 0.12, resizeMode: "cover" }]}
        blurRadius={20}
      />
      <LinearGradient
        colors={[colors.background, "transparent", colors.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SacredBackground size={width * 1.6} />

      {/* Header */}
      <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="chevron-down" size={26} color={colors.foreground} />
        </Pressable>
        <View style={styles.navCenter}>
          <Text style={[styles.navLabel, { color: colors.accent }]}>NOW PLAYING</Text>
        </View>
        <Pressable onPress={() => { toggleFavorite(currentSession.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.iconBtn}>
          <Feather name="heart" size={22} color={fav ? colors.primary : colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Art + Glow */}
      <View style={styles.artSection}>
        <GlowRing size={ART_SIZE + 80} color="rgba(198,155,79,0.12)" delay={0} duration={4000} />
        <GlowRing size={ART_SIZE + 120} color="rgba(198,155,79,0.07)" delay={700} duration={4000} />
        <BreathingPulse isPlaying={isPlaying} />
        <View style={[styles.artFrame, { borderColor: "rgba(198,155,79,0.25)" }]}>
          <Image
            source={currentSession.image}
            style={[styles.artImage, { width: ART_SIZE, height: ART_SIZE }]}
          />
          <LinearGradient
            colors={["transparent", "rgba(24,17,12,0.4)"]}
            style={[StyleSheet.absoluteFill, { borderRadius: ART_SIZE / 2 }]}
          />
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={[styles.category, { color: colors.accent }]}>
          {currentSession.categoryLabel}
        </Text>
        <Text style={[styles.sessionTitle, { color: colors.foreground }]}>
          {currentSession.title}
        </Text>
        <Text style={[styles.sessionSub, { color: colors.mutedForeground }]}>
          {currentSession.subtitle}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <Pressable
          style={styles.progressTrack}
          onPress={(e) => {
            const BAR_WIDTH = width - 64;
            handleSeek(e, BAR_WIDTH);
          }}
        >
          <View style={[styles.progressBg, { backgroundColor: colors.secondary }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
            <View
              style={[
                styles.progressThumb,
                {
                  left: `${progress * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </Pressable>
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
            {formatTime(elapsed)}
          </Text>
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
            -{formatTime(remaining)}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={[styles.controls, { paddingBottom: bottomPad + 24 }]}>
        <Pressable onPress={skipBackward} style={styles.controlSide}>
          <Feather name="skip-back" size={24} color={colors.foreground} />
          <Text style={[styles.skipLabel, { color: colors.mutedForeground }]}>10s</Text>
        </Pressable>

        <Pressable
          onPress={handlePlayPause}
          disabled={isLoading}
          style={[styles.playButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
        >
          {isLoading ? (
            <Feather name="loader" size={32} color={colors.primaryForeground} />
          ) : (
            <Feather
              name={isPlaying ? "pause" : "play"}
              size={32}
              color={colors.primaryForeground}
            />
          )}
        </Pressable>

        <Pressable onPress={skipForward} style={styles.controlSide}>
          <Feather name="skip-forward" size={24} color={colors.foreground} />
          <Text style={[styles.skipLabel, { color: colors.mutedForeground }]}>10s</Text>
        </Pressable>
      </View>

      {/* Bottom Extras */}
      <View style={[styles.extras, { paddingBottom: bottomPad + 10 }]}>
        <Pressable style={styles.extraBtn}>
          <Feather name="moon" size={18} color={colors.mutedForeground} />
          <Text style={[styles.extraLabel, { color: colors.mutedForeground }]}>Sleep</Text>
        </Pressable>
        <Pressable style={styles.extraBtn}>
          <Feather name="volume-2" size={18} color={colors.mutedForeground} />
          <Text style={[styles.extraLabel, { color: colors.mutedForeground }]}>Volume</Text>
        </Pressable>
        <Pressable style={styles.extraBtn}>
          <Feather name="share" size={18} color={colors.mutedForeground} />
          <Text style={[styles.extraLabel, { color: colors.mutedForeground }]}>Share</Text>
        </Pressable>
        <Pressable
          onPress={() => { stop(); router.back(); }}
          style={styles.extraBtn}
        >
          <Feather name="x-circle" size={18} color={colors.mutedForeground} />
          <Text style={[styles.extraLabel, { color: colors.mutedForeground }]}>Stop</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navCenter: {
    flex: 1,
    alignItems: "center",
  },
  navLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
  },
  artSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minHeight: ART_SIZE + 60,
  },
  artFrame: {
    borderRadius: ART_SIZE / 2,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  artImage: {
    borderRadius: ART_SIZE / 2,
    resizeMode: "cover",
  },
  infoSection: {
    alignItems: "center",
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  category: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  sessionTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  sessionSub: {
    fontSize: 14,
    textAlign: "center",
  },
  progressSection: {
    paddingHorizontal: 32,
    marginBottom: 20,
  },
  progressTrack: {
    paddingVertical: 10,
  },
  progressBg: {
    height: 3,
    borderRadius: 2,
    overflow: "visible",
    position: "relative",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timeText: {
    fontSize: 12,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  controlSide: {
    alignItems: "center",
    gap: 4,
  },
  skipLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C69B4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  extras: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
  },
  extraBtn: {
    alignItems: "center",
    gap: 4,
  },
  extraLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  noSession: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtnSolo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
});
