import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  AMBIENT_SCENES,
  useAmbientPlayer,
  type SceneId,
} from "@/context/AmbientPlayerContext";

const ND = Platform.OS !== "web";

export function AmbientWidget() {
  const { currentScene, setScene } = useAmbientPlayer();
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Animate expand/collapse
  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(expandAnim, {
      toValue: next ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: ND,
    }).start();
  };

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
        <Pressable onPress={handleToggle} style={styles.thumbnail}>
          <Image
            source={currentScene.image}
            style={styles.thumbnailImg}
            contentFit="cover"
          />
        </Pressable>

        {/* Expand toggle */}
        <Pressable onPress={handleToggle} hitSlop={10} style={styles.volBtn}>
          <Feather
            name={expanded ? "chevron-right" : "chevron-left"}
            size={14}
            color="#F9F9F9"
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
                  setExpanded(false);
                  setScene(scene.id as SceneId).catch(() => {});
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
    overflow: "hidden",
  },
  thumbnailImg: {
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
  },
  volBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  picker: {
    position: "absolute",
    top: 0,
    right: 66,
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#1E1108",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  sceneBtn: {
    padding: 2,
  },
  sceneThumb: {
    width: SCENE_THUMB,
    height: SCENE_THUMB,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  sceneThumbSelected: {
    borderColor: "rgba(212,175,55,0.7)",
  },
  sceneImg: {
    width: "100%",
    height: "100%",
  },
});
