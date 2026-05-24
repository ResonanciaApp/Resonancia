import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AMBIENT_SCENES,
  useAmbientPlayer,
  type SceneId,
} from "@/context/AmbientPlayerContext";
import { usePlayer } from "@/context/PlayerContext";

const ND = Platform.OS !== "web";

export function AmbientWidget() {
  const { currentScene, isPlaying, isMuted, setScene, togglePlayback } = useAmbientPlayer();
  const { stopAmbient } = useAmbientPlayer();
  const { isPlaying: sessionIsPlaying } = usePlayer();
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Stop ambient when a session starts
  useEffect(() => {
    if (sessionIsPlaying) {
      stopAmbient();
      setExpanded(false);
    }
  }, [sessionIsPlaying, stopAmbient]);

  // Animate expand/collapse
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: ND,
      damping: 18,
      stiffness: 200,
    }).start();
  }, [expanded, expandAnim]);

  const isActive = isPlaying && !isMuted;

  const pickerTranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });

  return (
    <View style={styles.root}>
      {/* ── Widget row ── */}
      <View style={styles.row}>
        {/* Scene thumbnail — tap to expand */}
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={styles.thumbnail}
        >
          <LinearGradient
            colors={currentScene.colors as [string, string]}
            style={styles.thumbnailGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather
              name={currentScene.icon as React.ComponentProps<typeof Feather>["name"]}
              size={13}
              color="rgba(255,255,255,0.92)"
            />
          </LinearGradient>
          {isActive && <View style={styles.activeDot} />}
        </Pressable>

        {/* Volume toggle */}
        <Pressable onPress={togglePlayback} hitSlop={10} style={styles.volBtn}>
          <Feather
            name={isActive ? "volume-2" : "volume-x"}
            size={14}
            color={isActive ? "#C69B4F" : "#5A4432"}
          />
        </Pressable>
      </View>

      {/* ── Expanded scene picker ── */}
      {expanded && (
        <Animated.View
          style={[
            styles.picker,
            { opacity: expandAnim, transform: [{ translateY: pickerTranslateY }] },
          ]}
        >
          {AMBIENT_SCENES.map((scene) => {
            const selected = scene.id === currentScene.id;
            return (
              <Pressable
                key={scene.id}
                onPress={async () => {
                  await setScene(scene.id as SceneId);
                  // Auto-start if not yet playing
                  if (!isPlaying) {
                    await togglePlayback();
                  }
                  setExpanded(false);
                }}
                style={styles.sceneBtn}
              >
                <LinearGradient
                  colors={scene.colors as [string, string]}
                  style={[styles.sceneThumb, selected && styles.sceneThumbSelected]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Feather
                    name={scene.icon as React.ComponentProps<typeof Feather>["name"]}
                    size={12}
                    color="rgba(255,255,255,0.95)"
                  />
                </LinearGradient>
                <Text style={[styles.sceneLabel, selected && styles.sceneLabelSelected]}>
                  {scene.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "flex-end",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#24160F",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(198,155,79,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  thumbnail: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: "visible",
  },
  thumbnailGrad: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#C69B4F",
    borderWidth: 1.5,
    borderColor: "#18110C",
  },
  volBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Picker
  picker: {
    position: "absolute",
    top: 50,
    right: 0,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#1E1108",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(198,155,79,0.18)",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  sceneBtn: {
    alignItems: "center",
    gap: 5,
  },
  sceneThumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  sceneThumbSelected: {
    borderColor: "#C69B4F",
  },
  sceneLabel: {
    color: "#7A6040",
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  sceneLabelSelected: {
    color: "#C69B4F",
  },
});
