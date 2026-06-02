import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import { useColors } from "@/hooks/useColors";

export function MiniPlayer() {
  const { currentSession, isPlaying, progress, pauseResume, stop } = usePlayer();
  const {
    activeSounds,
    isPlaying: mixPlaying,
    togglePlay,
    stopAll,
    presets,
    loadedPresetId,
    openSheet,
  } = useMixer();
  const colors = useColors();

  const isIOS = Platform.OS === "ios";

  // La sesión tiene prioridad sobre la mezcla (son mutuamente excluyentes, pero
  // por seguridad si ambas existieran mostramos la sesión).
  const mixActive = !currentSession && activeSounds.length > 0;

  if (!currentSession && !mixActive) return null;

  const shell = (children: React.ReactNode, onPress: () => void) => (
    <Pressable onPress={onPress} style={styles.wrapper}>
      {isIOS ? (
        <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, borderRadius: 18 }]} />
      )}
      <LinearGradient
        colors={["rgba(182,149,95,0.08)", "rgba(60,36,21,0.4)"]}
        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
      />
      <View style={[styles.border, { borderColor: "rgba(182,149,95,0.2)" }]} />
      {children}
    </Pressable>
  );

  if (mixActive) {
    const presetName = loadedPresetId
      ? presets.find((p) => p.id === loadedPresetId)?.name
      : null;
    const title = presetName || "Mi mezcla";
    const count = activeSounds.length;

    return shell(
      <>
        <View style={styles.progressBar} />
        <View style={styles.row}>
          <View style={[styles.art, styles.mixArt, { backgroundColor: "rgba(182,149,95,0.14)" }]}>
            <Feather name="sliders" size={20} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {count} {count === 1 ? "sonido" : "sonidos"}
            </Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            style={[styles.btn, { backgroundColor: colors.primary }]}
          >
            <Feather
              name={mixPlaying ? "pause" : "play"}
              size={18}
              color={colors.primaryForeground}
            />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              stopAll();
            }}
            style={styles.closeBtn}
          >
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </>,
      () => openSheet(),
    );
  }

  return shell(
    <>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <View style={styles.row}>
        <Image source={currentSession!.image} style={styles.art} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {currentSession!.title}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {currentSession!.categoryLabel} · {currentSession!.durationLabel}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            pauseResume();
          }}
          style={[styles.btn, { backgroundColor: colors.primary }]}
        >
          <Feather
            name={isPlaying ? "pause" : "play"}
            size={18}
            color={colors.primaryForeground}
          />
        </Pressable>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            stop();
          }}
          style={styles.closeBtn}
        >
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </>,
    () => router.push("/player" as never),
  );
}

const MAX_PLAYER_WIDTH = 430;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    maxWidth: MAX_PLAYER_WIDTH,
    width: "100%",
    alignSelf: "center",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 18,
  },
  progressBar: {
    height: 2,
    backgroundColor: "rgba(182,149,95,0.15)",
  },
  progressFill: {
    height: 2,
    borderRadius: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  mixArt: {
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  sub: {
    fontSize: 11,
  },
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
