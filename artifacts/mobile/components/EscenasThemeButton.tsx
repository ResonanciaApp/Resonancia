import React, { useCallback, useRef } from "react";
import { Animated, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";

// Vesica Piscis (de data/glyph-strings.ts, glifo "vesica"):
// dos círculos cx=38/62, cy=50, r=24 en viewBox 0 0 100 100.
const S = 45; // display size
const VB = 100;
// Trazo de 2 px en pantalla → unidades de viewBox
const STROKE_W = 2 * (VB / S);

const CIRCLES = [
  { cx: 38, cy: 50, r: 24 },
  { cx: 62, cy: 50, r: 24 },
];

const GOLD  = "#F7CB6B";
const WHITE = "#FFFFFF";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  onPress: () => void;
  style?: object;
}

export function EscenasThemeButton({ onPress, style }: Props) {
  const goldAnim = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    goldAnim.setValue(0);
    Animated.sequence([
      Animated.timing(goldAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(goldAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => onPress(), 500);
    return () => clearTimeout(t);
  }, [goldAnim, onPress]);

  return (
    <Pressable onPress={handlePress} hitSlop={10} style={style}>
      <Svg width={S} height={S} viewBox={`0 0 ${VB} ${VB}`}>
        {/* Vesica piscis blanca — reposo */}
        {CIRCLES.map((c, i) => (
          <Circle
            key={`w${i}`}
            cx={c.cx} cy={c.cy} r={c.r}
            stroke={WHITE}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.9}
          />
        ))}

        {/* Vesica piscis dorada — animada al tocar */}
        {CIRCLES.map((c, i) => (
          <AnimatedCircle
            key={`g${i}`}
            cx={c.cx} cy={c.cy} r={c.r}
            stroke={GOLD}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={goldAnim}
          />
        ))}
      </Svg>
    </Pressable>
  );
}
