import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { sessionMiniPlayerEvents } from "@/lib/miniPlayerEvents";

const PLAYER_H = 64;

interface Props {
  bottomOffset: number;
}

export function SessionMiniPlayer({ bottomOffset }: Props) {
  const { currentSession, isPlaying, pauseResume, stop } = usePlayer();
  const { activeSceneId } = useSceneTheme();
  const bgColor = activeSceneId === "tibet" ? "#1a1243" : "rgba(0,0,0,0.40)";

  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(80)).current;
  const closingRef = useRef(false);
  const [visible, setVisible] = useState(false);

  // Disparo del evento "minimizar desde el reproductor"
  useEffect(() => {
    const unsub = sessionMiniPlayerEvents.subscribe(() => {
      if (closingRef.current) return;
      closingRef.current = false;
      setVisible(true);
      opacity.setValue(0);
      translateY.setValue(-80);
      Animated.parallel([
        Animated.timing(opacity,    { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sesión termina de forma natural → ocultar
  useEffect(() => {
    if (!currentSession && visible) {
      animateOut(() => {});
    }
  }, [currentSession]); // eslint-disable-line react-hooks/exhaustive-deps

  const animateOut = (onDone: () => void) => {
    if (closingRef.current) return;
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 80, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      closingRef.current = false;
      onDone();
    });
  };

  const handleClose = () => animateOut(() => stop());

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
          { backgroundColor: bgColor, opacity, transform: [{ translateY }] },
        ]}
      >
        <Image
          source={currentSession.image as any}
          style={styles.img}
          resizeMode="cover"
        />

        <Pressable
          onPress={(e) => { e.stopPropagation(); pauseResume(); }}
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
          <Text style={styles.title} numberOfLines={1}>
            {currentSession.title}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {currentSession.categoryLabel}
          </Text>
        </View>

        <Pressable
          onPress={(e) => { e.stopPropagation(); handleClose(); }}
          hitSlop={10}
          style={{ paddingRight: 16 }}
        >
          <Feather name="x" size={20} color="#ffffff" style={{ opacity: 0.6 }} />
        </Pressable>
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
});
