import { Feather } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useVideoById, getVideoSourceUri } from "@/hooks/useVideos";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";
import { useVideosState } from "@/context/VideosContext";

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();

  const { video } = useVideoById(id);
  const locked = !!video?.isPremium && !isPremium;

  const player = useVideoPlayer(video ? getVideoSourceUri(video) : "", (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (locked) router.replace("/membresia" as never);
  }, [locked]);

  // Temporizador de reposo (VideosContext): al expirar, pausa el video
  const { timerExpired, clearTimerExpired } = useVideosState();
  // Descartar una expiración "vieja" (ocurrida sin pantalla de video activa)
  useEffect(() => {
    clearTimerExpired();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (timerExpired) {
      try {
        player.pause();
      } catch {
        // silent
      }
      clearTimerExpired();
    }
  }, [timerExpired, clearTimerExpired, player]);

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  if (!video) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <SacredBackground />
        <View style={[styles.center, { paddingTop: topPad + 40 }]}>
          <Feather name="film" size={36} color={colors.border} />
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>
            Video no encontrado
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={[styles.backLink, { color: colors.accent }]}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />
      <SacredBackground />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 + bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoWrap}>
          <VideoView
            style={styles.video}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
            contentFit="contain"
          />
        </View>

        <View style={styles.meta}>
          <Text style={[styles.kicker, { color: colors.accent }]}>
            VIDEO · {video.durationLabel}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{video.title}</Text>
          {video.subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {video.subtitle}
            </Text>
          ) : null}
          {video.description ? (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {video.description}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "600" },
  backLink: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },

  header: { paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  videoWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
  },
  video: { width: "100%", height: "100%" },

  meta: { paddingHorizontal: 20, paddingTop: 20 },
  kicker: { fontFamily: "Manrope", fontSize: 11, letterSpacing: 1.2, fontWeight: "700", marginBottom: 8 },
  title: { fontFamily: "Manrope", fontSize: 22, fontWeight: "700", lineHeight: 28, marginBottom: 8 },
  subtitle: { fontFamily: "Manrope", fontSize: 14, lineHeight: 20, marginBottom: 14 },
  description: { fontFamily: "Manrope", fontSize: 14, lineHeight: 22 },
});
