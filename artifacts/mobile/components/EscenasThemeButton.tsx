import React, { useCallback, useRef } from "react";
import { Animated, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";

// viewBox 1:1 con el display — sin escalado, coordenadas exactas en px
const S  = 45;          // display size
const CX = S / 2;       // 22.5
const CY = S / 2;       // 22.5

// punto + 2 anillos visibles + 1 tenue = 3 anillos
const RINGS = [
  { r: 7,    sw: 0.6, restOpacity: 0.60 }, // visible 1
  { r: 13,   sw: 0.6, restOpacity: 0.65 }, // visible 2
  { r: 19,   sw: 0.5, restOpacity: 0.12 }, // dim
];

const DOT_R = 2;
const GOLD  = "#F7CB6B";
const WHITE = "#FFFFFF";

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
      {/* viewBox = "0 0 45 45": coordenadas = px de display, sin escalar */}
      <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>

        {/* Anillos blancos — reposo */}
        {RINGS.map((ring, i) => (
          <Circle
            key={`w${i}`}
            cx={CX} cy={CY}
            r={ring.r}
            stroke={WHITE}
            strokeWidth={ring.sw}
            fill="none"
            opacity={ring.restOpacity}
          />
        ))}

        {/* Punto blanco central */}
        <Circle cx={CX} cy={CY} r={DOT_R} fill={WHITE} />

        {/* Anillos dorados — animados */}
        {RINGS.map((ring, i) => (
          <AnimatedCircle
            key={`g${i}`}
            cx={CX} cy={CY}
            r={ring.r}
            stroke={GOLD}
            strokeWidth={ring.sw}
            fill="none"
            opacity={goldRingAnims[i]}
          />
        ))}

        {/* Punto dorado — animado */}
        <AnimatedCircle cx={CX} cy={CY} r={DOT_R} fill={GOLD} opacity={goldDotAnim} />

      </Svg>
    </Pressable>
  );
}
