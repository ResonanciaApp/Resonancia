import React, { useCallback, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const SVG_SIZE = 45;

// Radios en viewBox 0–100 (centro 50,50)
// 3 visibles en reposo + 2 muy tenues
const RINGS = [
  { r: 11,   sw: 1.0, restOpacity: 0.18 }, // dim 1
  { r: 19.5, sw: 1.0, restOpacity: 0.60 }, // visible 1
  { r: 28,   sw: 1.0, restOpacity: 0.70 }, // visible 2
  { r: 37,   sw: 0.9, restOpacity: 0.55 }, // visible 3
  { r: 46,   sw: 0.8, restOpacity: 0.10 }, // dim 2
];

const DOT_R = 5;
const GOLD  = "#F7CB6B";
const WHITE = "#FFFFFF";

interface Props {
  onPress: () => void;
  style?: object;
}

export function EscenasThemeButton({ onPress, style }: Props) {
  // Opacidad de la capa dorada (0 en reposo, sube al presionar)
  const goldAnims   = useRef(RINGS.map(() => new Animated.Value(0))).current;
  const goldDotAnim = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    goldAnims.forEach((a) => a.setValue(0));
    goldDotAnim.setValue(0);

    // Anillos dorados: iluminan de adentro hacia afuera
    const ringAnimations = RINGS.map((ring, i) =>
      Animated.sequence([
        Animated.timing(goldAnims[i], { toValue: ring.restOpacity, duration: 140, useNativeDriver: true }),
        Animated.timing(goldAnims[i], { toValue: 0,                duration: 380, useNativeDriver: true }),
      ])
    );

    Animated.parallel([
      // Anillos escalonados
      Animated.stagger(90, ringAnimations),
      // Punto central
      Animated.sequence([
        Animated.timing(goldDotAnim, { toValue: 1,   duration: 120, useNativeDriver: true }),
        Animated.timing(goldDotAnim, { toValue: 0,   duration: 380, useNativeDriver: true }),
      ]),
    ]).start();

    const t = setTimeout(() => onPress(), 500);
    return () => clearTimeout(t);
  }, [goldAnims, goldDotAnim, onPress]);

  return (
    <Pressable onPress={handlePress} hitSlop={10} style={style}>
      <View style={{ width: SVG_SIZE, height: SVG_SIZE, alignItems: "center", justifyContent: "center" }}>

        {/* ── Capa blanca — reposo (estática) ── */}
        <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 100 100" style={{ position: "absolute" }}>
          {/* Anillos blancos */}
          {RINGS.map((ring, i) => (
            <Circle
              key={`w${i}`}
              cx="50" cy="50"
              r={ring.r}
              stroke={WHITE}
              strokeWidth={ring.sw}
              fill="none"
              opacity={ring.restOpacity}
            />
          ))}
          {/* Punto blanco */}
          <Circle cx="50" cy="50" r={DOT_R} fill={WHITE} />
        </Svg>

        {/* ── Capa dorada — animada al presionar ── */}
        {RINGS.map((ring, i) => (
          <Animated.View
            key={`g${i}`}
            style={{ position: "absolute", opacity: goldAnims[i] }}
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

        {/* Punto dorado central — animado */}
        <Animated.View style={{ position: "absolute", opacity: goldDotAnim }}>
          <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r={DOT_R} fill={GOLD} />
          </Svg>
        </Animated.View>

      </View>
    </Pressable>
  );
}
