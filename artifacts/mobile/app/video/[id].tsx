import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { openPremiumPlans } from "@/lib/premiumGate";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { SacredBackground } from "@/components/SacredBackground";
import { useVideoById, getVideoSourceUri } from "@/hooks/useVideos";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";
import { useVideosState } from "@/context/VideosContext";

const BUNNY_PLAYER_STYLE_SCRIPT = `
  (() => {
    const applyResonanciaPlayerStyles = () => {
      document.documentElement.style.setProperty("--plyr-video-background", "#000", "important");
      if (document.body) {
        document.body.style.setProperty("background", "#000", "important");
        document.body.style.setProperty("background-color", "#000", "important");
      }

      document
        .querySelectorAll(".container, .plyr, .plyr__video-wrapper")
        .forEach((element) => {
          element.style.setProperty("background", "#000", "important");
          element.style.setProperty("background-color", "#000", "important");
        });

      const centralPlay = document.querySelector(".plyr__control--overlaid");
      if (centralPlay) {
        centralPlay.style.setProperty("width", "54px", "important");
        centralPlay.style.setProperty("height", "54px", "important");
        centralPlay.style.setProperty("padding", "15px", "important");
        centralPlay.style.setProperty("background", "rgba(255,255,255,0.03)", "important");
        centralPlay.style.setProperty("background-color", "rgba(255,255,255,0.03)", "important");
        centralPlay.style.setProperty("border", "1px solid rgba(255,255,255,0.12)", "important");
        centralPlay.style.setProperty("border-radius", "50%", "important");
        centralPlay.style.setProperty("-webkit-backdrop-filter", "blur(12px)", "important");
        centralPlay.style.setProperty("backdrop-filter", "blur(12px)", "important");
      }

      document
        .querySelectorAll('.plyr__controls .plyr__control[data-plyr="play"]')
        .forEach((controlPlay) => {
          controlPlay.style.setProperty("background", "transparent", "important");
          controlPlay.style.setProperty("background-color", "transparent", "important");
          controlPlay.style.setProperty("box-shadow", "none", "important");
        });

      document
        .querySelectorAll(".plyr__pb .sp__container > .sp__section:last-child")
        .forEach((progress) => {
          progress.style.setProperty("background-color", "#FFFFFF", "important");
        });
    };

    let style = document.getElementById("resonancia-bunny-player-styles");
    if (!style) {
      style = document.createElement("style");
      style.id = "resonancia-bunny-player-styles";
      style.textContent = \`
      :root {
        --plyr-video-background: #000 !important;
      }

      html,
      body,
      .container,
      .plyr,
      .plyr__video-wrapper {
        background: #000 !important;
      }

      .plyr--full-ui.plyr--video .plyr__control--overlaid {
        width: 54px !important;
        height: 54px !important;
        padding: 15px !important;
        background: rgba(255,255,255,0.03) !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 50% !important;
        -webkit-backdrop-filter: blur(12px) !important;
        backdrop-filter: blur(12px) !important;
      }

      .plyr__controls .plyr__control[data-plyr="play"],
      .plyr__controls .plyr__control[data-plyr="play"]:hover,
      .plyr__controls .plyr__control[data-plyr="play"]:focus,
      .plyr__controls .plyr__control[data-plyr="play"].plyr__tab-focus {
        background: transparent !important;
        box-shadow: none !important;
      }

      .plyr--video .plyr__controls .plyr__control:not([data-plyr="play"]):hover,
      .plyr--video .plyr__controls .plyr__control:not([data-plyr="play"]):focus,
      .plyr--video .plyr__controls .plyr__control:not([data-plyr="play"]):active,
      .plyr--video .plyr__controls .plyr__control:not([data-plyr="play"]).plyr__tab-focus,
      .plyr--video .plyr__controls .plyr__control:not([data-plyr="play"])[aria-expanded="true"] {
        background: rgba(255,255,255,0.30) !important;
      }

      .plyr__pb .sp__container > .sp__section:last-child {
        background-color: #FFFFFF !important;
      }

      .plyr__progress input[type="range"]::-webkit-slider-thumb {
        background: #FFFFFF !important;
      }
      .plyr__progress input[type="range"]::-moz-range-thumb {
        background: #FFFFFF !important;
      }
    \`;
      (document.head || document.documentElement).appendChild(style);
    }

    applyResonanciaPlayerStyles();
    new MutationObserver(applyResonanciaPlayerStyles).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    window.addEventListener("load", applyResonanciaPlayerStyles);
    setTimeout(applyResonanciaPlayerStyles, 250);
    setTimeout(applyResonanciaPlayerStyles, 1000);
  })();
  true;
`;

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();

  const { video } = useVideoById(id);
  const locked = !!video?.isPremium && !isPremium;
  const [webPlayerKey, setWebPlayerKey] = useState(0);

  const player = useVideoPlayer(video && !video.playbackUrl ? getVideoSourceUri(video) : "", (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (locked) openPremiumPlans();
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
      if (video?.playbackUrl) {
        setWebPlayerKey((key) => key + 1);
      } else {
        try {
          player.pause();
        } catch {
          // silent
        }
      }
      clearTimerExpired();
    }
  }, [timerExpired, clearTimerExpired, player, video?.playbackUrl]);

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  if (!video) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <SacredBackground variant="gradient" noImage />
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
      <SacredBackground variant="gradient" noImage />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <BackPill
          onPress={() => router.back()}
          style={{ alignSelf: "flex-start" }}
          size={28}
          bgColor="rgba(0,0,0,0.16)"
          borderColor="rgba(241,224,255,0.25)"
          borderWidth={1.2}
          iconOffsetX={-1}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 + bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoWrap}>
          {video.playbackUrl ? (
            <WebView
              key={`bunny-player-style-v7-${webPlayerKey}`}
              source={{ uri: video.playbackUrl }}
              style={styles.video}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
              injectedJavaScriptBeforeContentLoaded={BUNNY_PLAYER_STYLE_SCRIPT}
              injectedJavaScript={BUNNY_PLAYER_STYLE_SCRIPT}
            />
          ) : (
            <VideoView
              style={styles.video}
              player={player}
              allowsFullscreen
              allowsPictureInPicture
              contentFit="contain"
            />
          )}
        </View>

        <View style={styles.meta}>
          <Text style={[styles.kicker, { color: colors.accent }]}>
            {video.durationLabel}
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
