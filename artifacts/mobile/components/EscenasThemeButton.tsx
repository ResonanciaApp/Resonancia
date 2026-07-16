import React, { useCallback, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const SPHERE = 11;
const GAP = 3;

// Cada tema: [base_top, base_bottom] y [bright_top, bright_bottom]
// bright = solid del tema + ~10% más de luminosidad (25/255 ≈ 10%)
const THEMES: { base: [string, string]; bright: [string, string] }[] = [
  {
    // tibet  — solid #2D1C52
    base:   ["#2D1C52", "#2D4082"],
    bright: ["#46356B", "#3D5095"],
  },
  {
    // profundo — solid #311F3D
    base:   ["#311F3D", "#21142A"],
    bright: ["#4A3856", "#3A2540"],
  },
  {
    // indigo — solid #211538
    base:   ["#211538", "#19273F"],
    bright: ["#3A2E51", "#2E3F5A"],
  },
];

interface Props {
  onPress: () => void;
  style?: object;
}

export function EscenasThemeButton({ onPress, style }: Props) {
  const anims = useRef(THEMES.map(() => new Animated.Value(0))).current;

  const handlePress = useCallback(() => {
    anims.forEach((a) => a.setValue(0));

    Animated.sequence([
      // Esfera 1
      Animated.timing(anims[0], { toValue: 1, duration: 75, useNativeDriver: true }),
      Animated.timing(anims[0], { toValue: 0, duration: 75, useNativeDriver: true }),
      // Esfera 2
      Animated.timing(anims[1], { toValue: 1, duration: 75, useNativeDriver: true }),
      Animated.timing(anims[1], { toValue: 0, duration: 75, useNativeDriver: true }),
      // Esfera 3
      Animated.timing(anims[2], { toValue: 1, duration: 75, useNativeDriver: true }),
      Animated.timing(anims[2], { toValue: 0, duration: 75, useNativeDriver: true }),
    ]).start(() => {
      onPress();
    });
  }, [anims, onPress]);

  return (
    <Pressable onPress={handlePress} hitSlop={8} style={style}>
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.08)",
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: GAP,
        }}
      >
        {THEMES.map((theme, i) => (
          <View
            key={i}
            style={{
              width: SPHERE,
              height: SPHERE,
              borderRadius: SPHERE / 2,
              overflow: "hidden",
            }}
          >
            {/* Capa base — siempre visible */}
            <LinearGradient
              colors={theme.base}
              style={{ width: SPHERE, height: SPHERE }}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            {/* Overlay luminoso — anima en la secuencia de tap */}
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: anims[i],
              }}
            >
              <LinearGradient
                colors={theme.bright}
                style={{ width: SPHERE, height: SPHERE }}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </Animated.View>
          </View>
        ))}
      </View>
    </Pressable>
  );
}
