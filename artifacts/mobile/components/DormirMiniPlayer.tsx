import React, { useEffect, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import type { DescansoSound } from "@/data/descanso-sounds";
import { useSceneTheme } from "@/context/SceneThemeContext";

interface Props {
  sound: DescansoSound;
  isPlaying: boolean;
  onToggle: () => void;
  onStop: () => void;
  bottomOffset: number;
  closeColor: string;
}

export function DormirMiniPlayer({ sound, isPlaying, onToggle, onStop, bottomOffset, closeColor }: Props) {
  const { activeSceneId } = useSceneTheme();
  const bgColor = activeSceneId === "tibet" ? "#1a1243" : "rgba(0,0,0,0.40)";

  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(15);
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [sound.id]);

  return (
    <Animated.View style={[styles.container, { bottom: bottomOffset, backgroundColor: bgColor, opacity, transform: [{ translateY }] }]}>
      <Image source={sound.image} style={styles.img} resizeMode="cover" />

      <Pressable
        onPress={(e) => { e.stopPropagation(); onToggle(); }}
        style={styles.playBtn}
        hitSlop={8}
      >
        <Svg width={26} height={26} viewBox="0 0 48 48">
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

      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{sound.label}</Text>
        <Text style={styles.sub}>
          {sound.categoryId === "binaural" ? "Sonidos Binaurales" : "Ambientales"}
        </Text>
      </View>

      <Pressable
        onPress={(e) => { e.stopPropagation(); onStop(); }}
        hitSlop={10}
        style={{ paddingRight: 16 }}
      >
        <Feather name="x" size={20} color={closeColor} style={{ opacity: 0.6 }} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 64,
    overflow: "hidden",
  },
  img: {
    width: 60,
    height: 64,
  },
  playBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    marginBottom: 2,
  },
  sub: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.48)",
  },
});
