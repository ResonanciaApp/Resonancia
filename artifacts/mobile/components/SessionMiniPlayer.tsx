import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";
import { router } from "expo-router";
import { usePlayer } from "@/context/PlayerContext";
import { sessionMiniPlayerEvents } from "@/lib/miniPlayerEvents";

const PLAYER_H = 64;

interface Props {
  bottomOffset: number;
}

export function SessionMiniPlayer({ bottomOffset }: Props) {
  const { currentSession, isPlaying, pauseResume, stop } = usePlayer();
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(80)).current;
  const closingRef = useRef(false);
  const [visible, setVisible] = useState(false);

  // Escucha el evento de "minimizar desde el reproductor"
  useEffect(() => {
    const unsub = sessionMiniPlayerEvents.subscribe(() => {
      if (closingRef.current) return;
      closingRef.current = false;
      setVisible(true);
      opacity.setValue(0);
      translateY.setValue(80);
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuando la sesión termina naturalmente, salir
  useEffect(() => {
    if (!currentSession && visible) {
      animateOut(() => {});
    }
  }, [currentSession]); // eslint-disable-line react-hooks/exhaustive-deps

  const animateOut = (onDone: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 80, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      closingRef.current = false;
      onDone();
    });
  };

  const handleStop = () => {
    animateOut(() => stop());
  };

  if (!visible || !currentSession) return null;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/player", params: { anim: "fade" } } as never)
      }
      style={[styles.wrapper, { bottom: bottomOffset }]}
    >
      <Animated.View
        style={[
          styles.container,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        {Platform.OS !== "web" ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }]} />
        )}

        <Image
          source={currentSession.image as any}
          style={styles.img}
          resizeMode="cover"
        />

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentSession.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {currentSession.durationLabel}
          </Text>
        </View>

        <Pressable
          onPress={(e) => { e.stopPropagation?.(); pauseResume(); }}
          hitSlop={8}
          style={styles.btn}
        >
          <Feather name={isPlaying ? "pause" : "play"} size={20} color="#FBFBFB" />
        </Pressable>

        <Pressable
          onPress={(e) => { e.stopPropagation?.(); handleStop(); }}
          hitSlop={8}
          style={styles.btn}
        >
          <Feather name="x" size={18} color="rgba(255,255,255,0.55)" />
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    height: PLAYER_H,
    zIndex: 85,
  },
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    gap: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  img: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#FBFBFB",
  },
  sub: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  btn: {
    padding: 6,
  },
});
