import React, { useCallback, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
import { SvgXml } from "react-native-svg";

const CONTAINER = 32;
const GLYPH_SIZE = 32; // tamaño del SVG dentro del círculo

// Semilla de la Vida — viewBox 0 0 100 100
const SEMILLA_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g transform="translate(0,0) scale(1)" stroke="#FFFFFF" fill="none"
     stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="38.7417" cy="56.5"  r="13"/>
    <circle cx="50"      cy="63"    r="13"/>
    <circle cx="38.7417" cy="43.5"  r="13"/>
    <circle cx="50"      cy="50"    r="13"/>
    <circle cx="61.2583" cy="56.5"  r="13"/>
    <circle cx="50"      cy="37"    r="13"/>
    <circle cx="61.2583" cy="43.5"  r="13"/>
    <circle cx="50"      cy="50"    r="39"/>
  </g>
</svg>`;

interface Props {
  onPress: () => void;
  style?: object;
}

export function EscenasThemeButton({ onPress, style }: Props) {
  const scales  = useRef([0, 1, 2].map(() => new Animated.Value(1))).current;
  const opacity = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  const handlePress = useCallback(() => {
    scales.forEach((s) => s.setValue(1));
    opacity.forEach((o) => o.setValue(0.5));

    Animated.stagger(160, [
      Animated.parallel([
        Animated.timing(scales[0],  { toValue: 4.5, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity[0], { toValue: 0,   duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scales[1],  { toValue: 4.5, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity[1], { toValue: 0,   duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(scales[2],  { toValue: 4.5, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity[2], { toValue: 0,   duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    const t = setTimeout(() => onPress(), 380);
    return () => clearTimeout(t);
  }, [scales, opacity, onPress]);

  return (
    <Pressable onPress={handlePress} hitSlop={8} style={style}>
      <View style={{ width: CONTAINER, height: CONTAINER, alignItems: "center", justifyContent: "center" }}>

        {/* Ondas expansivas — basadas en el tamaño del glifo */}
        {scales.map((scale, i) => (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: GLYPH_SIZE,
              height: GLYPH_SIZE,
              borderRadius: GLYPH_SIZE / 2,
              backgroundColor: "rgba(255,255,255,0.4)",
              opacity: opacity[i],
              transform: [{ scale }],
            }}
          />
        ))}

        {/* Semilla de la Vida */}
        <SvgXml xml={SEMILLA_XML} width={GLYPH_SIZE} height={GLYPH_SIZE} />
      </View>
    </Pressable>
  );
}
