import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ImageSourcePropType } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useSceneTheme } from "@/context/SceneThemeContext";

const SCREEN_H = Dimensions.get("window").height;
const PLAYER_H = 64;

type EntryFrom = "bottom" | "top";

interface Props {
  visible: boolean;
  animationKey: string;
  entryFrom?: EntryFrom;
  bottomOffset: number;
  topOffset: number;
  image: ImageSourcePropType;
  title: string;
  subtitle: string;
  isPlaying: boolean;
  isLoading?: boolean;
  progress?: number;
  closeColor?: string;
  expanded?: boolean;
  hidden?: boolean;
  onPress?: () => void;
  onToggle: () => void;
  onClose: () => void;
}

export function AudioMiniPlayer({
  visible,
  animationKey,
  entryFrom = "bottom",
  bottomOffset,
  topOffset,
  image,
  title,
  subtitle,
  isPlaying,
  isLoading = false,
  progress,
  closeColor = "#ffffff",
  expanded = false,
  hidden = false,
  onPress,
  onToggle,
  onClose,
}: Props) {
  const { activeSceneId } = useSceneTheme();
  const bgColor = activeSceneId === "tibet" ? "#160f28" : "rgba(0,0,0,0.40)";
  const startY = topOffset + 56 + PLAYER_H + bottomOffset - SCREEN_H;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(80)).current;
  const closingRef = useRef(false);
  const mountedRef = useRef(visible);
  const expandedMountedRef = useRef(false);
  const [mounted, setMounted] = useState(visible);

  const runAnimation = (from: number, to: number) => {
    opacity.stopAnimation();
    translateY.stopAnimation();
    opacity.setValue(0);
    translateY.setValue(from);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: to, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (visible) {
      mountedRef.current = true;
      setMounted(true);
      closingRef.current = false;
      runAnimation(entryFrom === "bottom" ? 80 : startY, 0);
      return;
    }

    if (!mountedRef.current) return;
    closingRef.current = true;
    opacity.stopAnimation();
    translateY.stopAnimation();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 80, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      mountedRef.current = false;
      setMounted(false);
      closingRef.current = false;
    });
  // animationKey restarts the same visual entrance when Dormir changes sound.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, animationKey, entryFrom, startY]);

  useEffect(() => {
    if (!visible || !mountedRef.current || closingRef.current) return;
    if (!expandedMountedRef.current) {
      expandedMountedRef.current = true;
      return;
    }

    translateY.stopAnimation();
    Animated.timing(translateY, {
      toValue: expanded ? startY : 0,
      duration: 250,
      delay: expanded ? 50 : 0,
      useNativeDriver: true,
    }).start();
  }, [expanded, startY, translateY, visible]);

  useEffect(() => () => {
    opacity.stopAnimation();
    translateY.stopAnimation();
  }, [opacity, translateY]);

  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    opacity.stopAnimation();
    translateY.stopAnimation();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 80, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      mountedRef.current = false;
      setMounted(false);
      closingRef.current = false;
      onClose();
    });
  };

  if (!mounted || hidden) return null;

  return (
    <Pressable
      onPress={!expanded ? onPress : undefined}
      style={[styles.wrapper, { bottom: bottomOffset + 5 }]}
    >
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: bgColor, opacity, transform: [{ translateY }] },
        ]}
      >
        <Image source={image} style={styles.img} resizeMode="cover" />

        <Pressable
          onPress={(event) => { event.stopPropagation(); onToggle(); }}
          style={styles.playBtn}
          hitSlop={8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Svg width={26} height={26} viewBox="0 0 48 48">
              {isPlaying ? (
                <>
                  <Rect x="7" y="5" width="12" height="36" rx="5" ry="5" fill="white" />
                  <Rect x="27" y="5" width="12" height="36" rx="5" ry="5" fill="white" />
                </>
              ) : (
                <Path
                  d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                  fill="white"
                />
              )}
            </Svg>
          )}
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>
        </View>

        {!expanded && (
          <Pressable
            onPress={(event) => { event.stopPropagation(); handleClose(); }}
            hitSlop={10}
            style={{ paddingRight: 16 }}
          >
            <Feather name="x" size={20} color={closeColor} style={{ opacity: 0.6 }} />
          </Pressable>
        )}

        <View style={styles.progressTrack} pointerEvents="none">
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(1, Math.max(0, progress ?? 0)) * 100}%` as any },
            ]}
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: PLAYER_H,
    overflow: "hidden",
  },
  img: {
    width: 60,
    height: PLAYER_H,
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
  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  progressFill: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 1,
  },
});