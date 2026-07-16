import React, { useCallback, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Colores dim (reposo) y bright (animación) de cada tema
// bright = solid + ~10% más luminosidad
const LAYERS: { base: [string, string]; bright: [string, string] }[] = [
  { base: ["#2D1C52", "#2D4082"], bright: ["#46356B", "#3D5095"] }, // tibet
  { base: ["#311F3D", "#21142A"], bright: ["#4A3856", "#3A2540"] }, // profundo
  { base: ["#211538", "#19273F"], bright: ["#3A2E51", "#2E3F5A"] }, // indigo
];

const SIZE = 40;

interface Props {
  onPress: () => void;
  style?: object;
}

export function EscenasThemeButton({ onPress, style }: Props) {
  const anims = useRef(LAYERS.map(() => new Animated.Value(0))).current;

  const handlePress = useCallback(() => {
    anims.forEach((a) => a.setValue(0));

    Animated.sequence([
      // Tibet (150 ms)
      Animated.timing(anims[0], { toValue: 1, duration: 75, useNativeDriver: true }),
      Animated.timing(anims[0], { toValue: 0, duration: 75, useNativeDriver: true }),
      // Profundo (150 ms)
      Animated.timing(anims[1], { toValue: 1, duration: 75, useNativeDriver: true }),
      Animated.timing(anims[1], { toValue: 0, duration: 75, useNativeDriver: true }),
      // Índigo (150 ms)
      Animated.timing(anims[2], { toValue: 1, duration: 75, useNativeDriver: true }),
      Animated.timing(anims[2], { toValue: 0, duration: 75, useNativeDriver: true }),
    ]).start(() => onPress());
  }, [anims, onPress]);

  return (
    <Pressable onPress={handlePress} hitSlop={8} style={style}>
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          overflow: "hidden",
        }}
      >
        {/* Capa base — siempre visible en reposo */}
        <LinearGradient
          colors={LAYERS[0].base}
          style={{ width: SIZE, height: SIZE, position: "absolute" }}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Overlays de cada tema — se superponen en la misma esfera */}
        {LAYERS.map((layer, i) => (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              opacity: anims[i],
            }}
          >
            <LinearGradient
              colors={layer.bright}
              style={{ width: SIZE, height: SIZE }}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </Animated.View>
        ))}
      </View>
    </Pressable>
  );
}
