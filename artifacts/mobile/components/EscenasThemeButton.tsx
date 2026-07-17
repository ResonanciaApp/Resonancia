import React, { useCallback, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const SVG_SIZE = 50; // tamaño visual total (los anillos pueden usar todo el espacio)

// Radios de los 5 anillos en viewBox 0–100 (centro 50,50)
// 3 visibles en reposo + 2 muy tenues
const RINGS = [
  { r: 11,   sw: 1.0, restOpacity: 0.18 }, // dim 1 (oculto)
  { r: 19.5, sw: 1.0, restOpacity: 0.60 }, // visible 1
  { r: 28,   sw: 1.0, restOpacity: 0.70 }, // visible 2
  { r: 37,   sw: 0.9, restOpacity: 0.55 }, // visible 3
  { r: 46,   sw: 0.8, restOpacity: 0.10 }, // dim 2 (oculto)
];

const GOLD = "#F7CB6B";
const DOT_R = 5;

interface Props {
  onPress: () => void;
  style?: object;
}

export function EscenasThemeButton({ onPress, style }: Props) {
  const ringAnims = useRef(RINGS.map((r) => new Animated.Value(r.restOpacity))).current;

  const handlePress = useCallback(() => {
    // Cada anillo: destello → vuelve a reposo
    const animations = RINGS.map((ring, i) =>
      Animated.sequence([
        Animated.timing(ringAnims[i], { toValue: 1,              duration: 140, useNativeDriver: true }),
        Animated.timing(ringAnims[i], { toValue: ring.restOpacity, duration: 380, useNativeDriver: true }),
      ])
    );

    // Iluminación de adentro hacia afuera, escalonada 90 ms
    Animated.stagger(90, animations).start();

    // Abrir sheet cuando el último anillo ya se iluminó
    const t = setTimeout(() => onPress(), 500);
    return () => clearTimeout(t);
  }, [ringAnims, onPress]);

  return (
    <Pressable onPress={handlePress} hitSlop={10} style={style}>
      <View style={{ width: SVG_SIZE, height: SVG_SIZE, alignItems: "center", justifyContent: "center" }}>

        {/* Anillos — cada uno en su propio Animated.View para opacidad nativa */}
        {RINGS.map((ring, i) => (
          <Animated.View
            key={i}
            style={{ position: "absolute", opacity: ringAnims[i] }}
          >
            <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 100 100">
              <Circle
                cx="50" cy="50"
                r={ring.r}
                stroke={GOLD}
                strokeWidth={ring.sw}
                fill="none"
              />
            </Svg>
          </Animated.View>
        ))}

        {/* Punto central dorado */}
        <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 100 100" style={{ position: "absolute" }}>
          <Circle cx="50" cy="50" r={DOT_R} fill={GOLD} />
        </Svg>

      </View>
    </Pressable>
  );
}
