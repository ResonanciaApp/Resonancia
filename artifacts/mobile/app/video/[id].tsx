import { Feather } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect } from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { getVideoById, getVideoSourceUri } from "@/data/videos";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();

  const video = id ? getVideoById(id) : undefined;
  const locked = !!video?.isPremium && !isPremium;

  const player = useVideoPlayer(video ? getVideoSourceUri(video) : "", (p) => {
    p.loop = false;
  });

  // Si el video es premium y el usuario no lo es, redirigir a membresía.
  useEffect(() => {
    if (locked) router.replace("/membresia" as never);
  }, [locked]);

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
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      {/* Header con botón volver */}
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
  notFoundTitle: { fontSize: 16, fontWeight: "600" },
  backLink: { fontSize: 14, fontWeight: "600" },

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
  kicker: { fontSize: 11, letterSpacing: 1.2, fontWeight: "700", marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", lineHeight: 28, marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  description: { fontSize: 14, lineHeight: 22 },
});
