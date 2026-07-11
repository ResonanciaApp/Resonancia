import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import Svg, { Path, Rect } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { sessionMiniPlayerEvents } from "@/lib/miniPlayerEvents";

const SCREEN_H = Dimensions.get("window").height;

interface Props {
  isExpanded: boolean;
  onCollapse: () => void;
  bottomInset: number;
  topInset: number;
}

export function DormirSessionExpandedPlayer({
  isExpanded,
  onCollapse,
  bottomInset,
  topInset,
}: Props) {
  const { currentSession, isPlaying, pauseResume, stop } = usePlayer();
  const { activeSceneId } = useSceneTheme();

  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: isExpanded ? 0 : SCREEN_H,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const bgTop = activeSceneId === "tibet" ? "#1a1243" : "#0d0318";
  const bgBot = activeSceneId === "tibet" ? "#0d0a2a" : "#180830";

  const handleCollapse = () => {
    sessionMiniPlayerEvents.triggerShow();
    onCollapse();
  };

  const handleStop = () => {
    onCollapse();
    stop();
  };

  if (!currentSession) return null;

  return (
    <Animated.View
      pointerEvents={isExpanded ? "box-none" : "none"}
      style={[styles.root, { opacity, transform: [{ translateY }] }]}
    >
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={[bgTop, bgBot]} style={StyleSheet.absoluteFill} />

      {/* Botón colapsar */}
      <Pressable
        onPress={handleCollapse}
        hitSlop={14}
        style={[styles.collapseBtn, { top: topInset + 18 }]}
      >
        <Feather name="chevron-down" size={28} color="rgba(255,255,255,0.7)" />
      </Pressable>

      {/* Imagen grande */}
      <View style={[styles.imageWrap, { marginTop: topInset + 72 }]}>
        <Image
          source={currentSession.image as any}
          style={styles.image}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", bgBot]}
          style={styles.imageGrad}
        />
      </View>

      {/* Info + controles */}
      <View style={[styles.controls, { paddingBottom: bottomInset + 40 }]}>
        <Text style={styles.category}>{currentSession.categoryLabel}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {currentSession.title}
        </Text>

        {/* Play / Pause */}
        <Pressable
          onPress={pauseResume}
          style={({ pressed }) => [styles.playBtn, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Svg width={32} height={32} viewBox="0 0 48 48">
            {isPlaying ? (
              <>
                <Rect x="7"  y="5" width="12" height="36" rx="5" ry="5" fill="white" />
                <Rect x="27" y="5" width="12" height="36" rx="5" ry="5" fill="white" />
              </>
            ) : (
              <Path d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z" fill="white" />
            )}
          </Svg>
        </Pressable>

        {/* Detener */}
        <Pressable
          onPress={handleStop}
          hitSlop={10}
          style={({ pressed }) => [styles.stopBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="x-circle" size={18} color="rgba(255,255,255,0.45)" />
          <Text style={styles.stopText}>Detener sesión</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 90,
  },
  collapseBtn: {
    position: "absolute",
    right: 20,
    zIndex: 2,
    padding: 4,
  },
  imageWrap: {
    width: "100%",
    height: SCREEN_H * 0.42,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageGrad: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    height: 80,
  },
  controls: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  category: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 26,
    fontWeight: "700",
    color: "#FBFBFB",
    textAlign: "center",
    lineHeight: 32,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  stopText: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
  },
});
