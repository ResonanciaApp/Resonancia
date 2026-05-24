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
import { useColors } from "@/hooks/useColors";

export function MiniPlayer() {
  const { currentSession, isPlaying, progress, pauseResume, stop } = usePlayer();
  const colors = useColors();

  if (!currentSession) return null;

  const isIOS = Platform.OS === "ios";

  return (
    <Pressable
      onPress={() => router.push("/player" as never)}
      style={styles.wrapper}
    >
      {isIOS ? (
        <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 18 }]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card, borderRadius: 18 }]} />
      )}
      <LinearGradient
        colors={["rgba(198,155,79,0.08)", "rgba(60,36,21,0.4)"]}
        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
      />
      <View style={[styles.border, { borderColor: "rgba(198,155,79,0.2)" }]} />

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <View style={styles.row}>
        <Image source={currentSession.image} style={styles.art} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {currentSession.title}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {currentSession.categoryLabel} · {currentSession.durationLabel}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: 18,
  },
  progressBar: {
    height: 2,
    backgroundColor: "rgba(198,155,79,0.15)",
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
