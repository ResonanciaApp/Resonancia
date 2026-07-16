import React, { useCallback, useRef } from "react";
import { Animated, Pressable, View } from "react-native";

const DOT = 7;
const CONTAINER = 32;

interface Props {
  onPress: () => void;
  style?: object;
}

export function EscenasThemeButton({ onPress, style }: Props) {
  const scales  = useRef([1, 2, 3].map(() => new Animated.Value(1))).current;
  const opacity = useRef([1, 2, 3].map(() => new Animated.Value(0))).current;

  const handlePress = useCallback(() => {
    // Resetear
    scales.forEach((s) => s.setValue(1));
    opacity.forEach((o) => o.setValue(0.55));

    // 3 ondas escalonadas, cada una dura 600 ms
    Animated.stagger(160, [
      Animated.parallel([
        Animated.timing(scales[0],  { toValue: 5, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity[0], { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scales[1],  { toValue: 5, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity[1], { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scales[2],  { toValue: 5, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity[2], { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    // Abrir sheet cuando la tercera onda ya arrancó
    const t = setTimeout(() => onPress(), 380);
    return () => clearTimeout(t);
  }, [scales, opacity, onPress]);

  return (
    <Pressable onPress={handlePress} hitSlop={8} style={style}>
      <View style={{ width: CONTAINER, height: CONTAINER, alignItems: "center", justifyContent: "center" }}>

        {/* Fondo del botón */}
        <View style={{
          position: "absolute",
          width: CONTAINER,
          height: CONTAINER,
          borderRadius: CONTAINER / 2,
          backgroundColor: "rgba(255,255,255,0.07)",
        }} />

        {/* Ondas expansivas */}
        {scales.map((scale, i) => (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: DOT,
              height: DOT,
              borderRadius: DOT / 2,
              backgroundColor: "rgba(255,255,255,0.5)",
              opacity: opacity[i],
              transform: [{ scale }],
            }}
          />
        ))}

        {/* Punto central */}
        <View style={{
          width: DOT,
          height: DOT,
          borderRadius: DOT / 2,
          backgroundColor: "#FFFFFF",
        }} />
      </View>
    </Pressable>
  );
}
