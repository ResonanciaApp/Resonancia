import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
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
  const { currentScene, isPlaying, isMuted, setScene, togglePlayback, stopAmbient } =
    useAmbientPlayer();
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
      damping: 20,
      stiffness: 220,
    }).start();
  }, [expanded, expandAnim]);

  const isActive = isPlaying && !isMuted;

  const pickerOpacity = expandAnim;
  const pickerTranslateX = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
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
          <Image
            source={currentScene.image}
            style={styles.thumbnailImg}
            contentFit="cover"
          />
          {isActive && <View style={styles.activeDot} />}
        </Pressable>

        {/* Volume toggle */}
        <Pressable onPress={togglePlayback} hitSlop={10} style={styles.volBtn}>
          <Feather
            name={isActive ? "volume-2" : "volume-x"}
            size={14}
            color={isActive ? "#D4AF37" : "#5A2020"}
          />
        </Pressable>
      </View>

      {/* ── Expanded scene picker — opens to the LEFT ── */}
      {expanded && (
        <Animated.View
          style={[
            styles.picker,
            {
              opacity: pickerOpacity,
              transform: [{ translateX: pickerTranslateX }],
            },
          ]}
        >
          {AMBIENT_SCENES.map((scene) => {
            const selected = scene.id === currentScene.id;
            return (
              <Pressable
                key={scene.id}
                onPress={() => {
                  setExpanded(false);   // close picker instantly
                  setScene(scene.id as SceneId).then(() => {
                    if (!isPlaying) togglePlayback();
                  }).catch(() => {});
                }}
                style={styles.sceneBtn}
              >
                <View
                  style={[
                    styles.sceneThumb,
                    selected && styles.sceneThumbSelected,
                  ]}
                >
                  <Image
                    source={scene.image}
                    style={styles.sceneImg}
                    contentFit="cover"
                  />
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const THUMB = 32;
const SCENE_THUMB = 32;

const styles = StyleSheet.create({
  root: {
    alignItems: "flex-end",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#27070E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  thumbnail: {
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
    overflow: "visible",
  },
  thumbnailImg: {
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
  },
  thumbnailOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
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
    backgroundColor: "#D4AF37",
    borderWidth: 1.5,
    borderColor: "#1B060F",
  },
  volBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Picker — positioned to the LEFT of the widget
  picker: {
    position: "absolute",
    top: 0,
    right: 66, // widget row width + gap
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#1E1108",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  sceneBtn: {
    alignItems: "center",
    gap: 4,
  },
  sceneThumb: {
    width: SCENE_THUMB,
    height: SCENE_THUMB,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  sceneThumbSelected: {
    borderColor: "#D4AF37",
  },
  sceneImg: {
    width: SCENE_THUMB,
    height: SCENE_THUMB,
  },
  sceneLabel: {
    color: "#587060",
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  sceneLabelSelected: {
    color: "#D4AF37",
  },
});
