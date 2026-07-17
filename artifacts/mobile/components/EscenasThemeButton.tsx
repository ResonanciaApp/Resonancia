import React, { useCallback, useRef } from "react";
import { Animated, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";

const SVG_SIZE = 45;

const RINGS = [
  { r: 11,   sw: 1.0, restOpacity: 0.18 },
  { r: 19.5, sw: 1.0, restOpacity: 0.60 },
  { r: 28,   sw: 1.0, restOpacity: 0.70 },
  { r: 37,   sw: 0.9, restOpacity: 0.55 },
  { r: 46,   sw: 0.8, restOpacity: 0.10 },
];

const DOT_R = 5;
const GOLD  = "#F7CB6B";
const WHITE = "#FFFFFF";

// AnimatedCircle: anima props SVG directamente (sin rasterización de wrapper)
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  onPress: () => void;
  style?: object;
}

export function EscenasThemeButton({ onPress, style }: Props) {
  const goldRingAnims = useRef(RINGS.map(() => new Animated.Value(0))).current;
  const goldDotAnim   = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    goldRingAnims.forEach((a) => a.setValue(0));
    goldDotAnim.setValue(0);

    const ringAnimations = RINGS.map((ring, i) =>
      Animated.sequence([
        Animated.timing(goldRingAnims[i], { toValue: ring.restOpacity, duration: 140, useNativeDriver: true }),
        Animated.timing(goldRingAnims[i], { toValue: 0,                duration: 380, useNativeDriver: true }),
      ])
    );

    Animated.parallel([
      Animated.stagger(90, ringAnimations),
      Animated.sequence([
        Animated.timing(goldDotAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(goldDotAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();

    const t = setTimeout(() => onPress(), 500);
    return () => clearTimeout(t);
  }, [goldRingAnims, goldDotAnim, onPress]);

  return (
    <Pressable onPress={handlePress} hitSlop={10} style={style}>
      <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 100 100">

        {/* Anillos blancos — reposo (estáticos, sin wrapper) */}
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

        {/* Punto blanco central */}
        <Circle cx="50" cy="50" r={DOT_R} fill={WHITE} />

        {/* Anillos dorados — animados directamente sobre el elemento SVG */}
        {RINGS.map((ring, i) => (
          <AnimatedCircle
            key={`g${i}`}
            cx="50" cy="50"
            r={ring.r}
            stroke={GOLD}
            strokeWidth={ring.sw}
            fill="none"
            opacity={goldRingAnims[i]}
          />
        ))}

        {/* Punto dorado central — animado */}
        <AnimatedCircle
          cx="50" cy="50"
          r={DOT_R}
          fill={GOLD}
          opacity={goldDotAnim}
        />

      </Svg>
    </Pressable>
  );
}
