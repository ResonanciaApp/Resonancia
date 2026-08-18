import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import type { DescansoSound } from "@/data/descanso-sounds";
import { useSceneTheme } from "@/context/SceneThemeContext";

const SCREEN_H = Dimensions.get("window").height;
const PLAYER_H = 64;

interface Props {
  sound: DescansoSound;
  isPlaying: boolean;
  /** Muestra una ruedita en lugar del play/pause mientras el audio carga. */
  isLoading?: boolean;
  onToggle: () => void;
  onStop: () => void;
  bottomOffset: number;
  closeColor: string;
  isExpanded: boolean;
  topOffset: number;
  onExpand: () => void;
}

export function DormirMiniPlayer({ sound, isPlaying, isLoading, onToggle, onStop, bottomOffset, closeColor, isExpanded, topOffset, onExpand }: Props) {
  const { activeSceneId } = useSceneTheme();
  const bgColor = activeSceneId === "tibet" ? "#160f28" : "rgba(0,0,0,0.40)";

  const opacity      = useRef(new Animated.Value(0)).current;
  const translateY   = useRef(new Animated.Value(80)).current;
  const closingRef   = useRef(false);
  const expandMountedRef = useRef(false);

  // translateY negativo para llevar el mini player justo debajo del área del header (logo Pulso)
  // top edge actual = SCREEN_H - bottomOffset - PLAYER_H
  // top edge deseado = topOffset + 56
  // delta = (topOffset + 56) - (SCREEN_H - bottomOffset - PLAYER_H)
  const expandedY = topOffset + 56 + PLAYER_H + bottomOffset - SCREEN_H;

  // Entrada inicial al montar (nuevo sonido)
  useEffect(() => {
    closingRef.current = false;
    opacity.setValue(0);
    translateY.setValue(80);
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [sound.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expansión / colapso — omitir ejecución del primer montaje para no
  // cancelar la animación de entrada del efecto [sound.id]
  useEffect(() => {
    if (!expandMountedRef.current) {
      expandMountedRef.current = true;
      return;
    }
    if (closingRef.current) return;
    Animated.timing(translateY, {
      toValue: isExpanded ? expandedY : 0,
      duration: 250,
      delay: isExpanded ? 50 : 0,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 80, duration: 300, useNativeDriver: true }),
    ]).start(() => onStop());
  };

  return (
    <Pressable
      onPress={!isExpanded ? onExpand : undefined}
      style={[styles.wrapper, { bottom: bottomOffset + 7 }]}
    >
      <Animated.View style={[styles.container, { backgroundColor: bgColor, opacity, transform: [{ translateY }] }]}>
        <Image source={sound.image} style={styles.img} resizeMode="cover" />

        <Pressable
          onPress={(e) => { e.stopPropagation(); onToggle(); }}
          style={styles.playBtn}
          hitSlop={8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
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
          )}
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{sound.label}</Text>
          <Text style={styles.sub}>
            {sound.categoryId === "binaural" ? "Sonidos Binaurales" : "Ambientales"}
          </Text>
        </View>

        {!isExpanded && (
          <Pressable
            onPress={(e) => { e.stopPropagation(); handleClose(); }}
            hitSlop={10}
            style={{ paddingRight: 16 }}
          >
            <Feather name="x" size={20} color={closeColor} style={{ opacity: 0.6 }} />
          </Pressable>
        )}

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
});
