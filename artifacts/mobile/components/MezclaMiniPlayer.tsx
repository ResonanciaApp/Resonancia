import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import Svg, { Path, Rect } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useMixer } from "@/context/MixerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSoundImage } from "@/config/sound-images";
import { REMOTE_SOUND_IMAGE_MAP } from "@/lib/remoteSoundMap";

const PLAYER_H  = 64;
const THUMB_SZ  = 40;   // tamaño de cada thumbnail
const THUMB_OFF = 14;   // desplazamiento entre thumbs apiladas

interface Props {
  bottomOffset: number;
}

export function MezclaMiniPlayer({ bottomOffset }: Props) {
  const {
    presets,
    loadedPresetId,
    activeSounds,
    isPlaying: mixPlaying,
    togglePlay,
    stopAll,
  } = useMixer();
  const { activeSceneId } = useSceneTheme();

  const bgColor = activeSceneId === "tibet" ? "#1a1243" : "rgba(0,0,0,0.40)";

  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(80)).current;
  const closingRef = useRef(false);
  const prevIdRef  = useRef<string | null>(null);

  const visible = !!(loadedPresetId && activeSounds.length > 0);
  const loadedPreset = presets.find((p) => p.id === loadedPresetId) ?? null;

  // Animación de entrada cada vez que se carga una nueva mezcla
  useEffect(() => {
    if (!visible) return;
    if (loadedPresetId === prevIdRef.current) return;
    prevIdRef.current = loadedPresetId;

    closingRef.current = false;
    opacity.setValue(0);
    translateY.setValue(80);
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [loadedPresetId, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 80, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      stopAll();
      prevIdRef.current = null;
    });
  };

  if (!visible || !loadedPreset) return null;

  const thumbSounds = loadedPreset.sounds.slice(0, 3);
  // Ancho del stack: THUMB_SZ + (n-1) * THUMB_OFF
  const stackW = THUMB_SZ + Math.max(0, thumbSounds.length - 1) * THUMB_OFF;

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: bgColor, opacity, transform: [{ translateY }] },
        ]}
      >
        {/* ── Thumbnails apiladas ─────────────────────────────────── */}
        <View style={[styles.thumbStack, { width: stackW }]}>
          {thumbSounds.map((s, i) => {
            const localImg  = getSoundImage(s.id);
            const remoteUri = REMOTE_SOUND_IMAGE_MAP[s.id] ? { uri: REMOTE_SOUND_IMAGE_MAP[s.id] } : undefined;
            const src = localImg ?? remoteUri;
            return (
              <View
                key={s.id}
                style={[
                  styles.thumb,
                  {
                    left:   i * THUMB_OFF,
                    zIndex: thumbSounds.length - i,
                  },
                ]}
              >
                {src ? (
                  <Image source={src} style={styles.thumbImg} contentFit="cover" />
                ) : (
                  <View style={[styles.thumbImg, styles.thumbFallback]}>
                    <Feather name="music" size={12} color="#F7CB6B" />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Play / Pause ─────────────────────────────────────────── */}
        <Pressable
          onPress={togglePlay}
          style={styles.playBtn}
          hitSlop={8}
        >
          <Svg width={26} height={26} viewBox="0 0 48 48">
            {mixPlaying ? (
              <>
                <Rect x="7"  y="5" width="12" height="36" rx="5" ry="5" fill="white" />
                <Rect x="27" y="5" width="12" height="36" rx="5" ry="5" fill="white" />
              </>
            ) : (
              <Path
                d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                fill="white"
              />
            )}
          </Svg>
        </Pressable>

        {/* ── Nombre + conteo ──────────────────────────────────────── */}
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{loadedPreset.name}</Text>
          <Text style={styles.sub}>
            {loadedPreset.sounds.length} sonido{loadedPreset.sounds.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* ── Cerrar ───────────────────────────────────────────────── */}
        <Pressable onPress={handleClose} hitSlop={10} style={styles.closeBtn}>
          <Feather name="x" size={20} color="#ffffff" style={{ opacity: 0.6 }} />
        </Pressable>
      </Animated.View>
    </View>
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
    paddingRight: 4,
  },
  thumbStack: {
    height: PLAYER_H,
    position: "relative",
    flexShrink: 0,
  },
  thumb: {
    position: "absolute",
    top: (PLAYER_H - THUMB_SZ) / 2,
    width: THUMB_SZ,
    height: THUMB_SZ,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  thumbImg: {
    width: THUMB_SZ,
    height: THUMB_SZ,
  },
  thumbFallback: {
    backgroundColor: "rgba(247,203,107,0.12)",
    alignItems: "center",
    justifyContent: "center",
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
  closeBtn: {
    paddingRight: 14,
    paddingLeft: 4,
  },
});
