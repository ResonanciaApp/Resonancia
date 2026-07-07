import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

import { SacredGlyph } from "@/components/SacredGlyph";
import { useGeoUniverse } from "@/context/GeoUniverseContext";

interface AnimGlyphProps {
  id: "flor-vida" | "metatron" | "mandala";
  size: number;
  style: object;
  spinDuration: number;
  breatheDuration: number;
  dir?: 1 | -1;
}

function AnimGlyph({ id, size, style, spinDuration, breatheDuration, dir = 1 }: AnimGlyphProps) {
  const rot   = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: spinDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    a.start();
    return () => a.stop();
  }, [rot, spinDuration]);

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: breatheDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: breatheDuration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [pulse, breatheDuration]);

  const rotDeg = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${360 * dir}deg`],
  });
  const scalePulse = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1.0] });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: 0.35,
          transform: [{ rotate: rotDeg }, { scale: scalePulse }],
        },
      ]}
      pointerEvents="none"
    >
      <SacredGlyph id={id} color="#FFFFFF" size={size} strokeScale={0.7} />
    </Animated.View>
  );
}

export function GeoUniverseBackground() {
  const { enabled } = useGeoUniverse();

  if (!enabled) return null;

  return (
    <View style={styles.root} pointerEvents="none">
      <AnimGlyph
        id="flor-vida"
        size={340}
        style={styles.topRight}
        spinDuration={60000}
        breatheDuration={8000}
        dir={1}
      />
      <AnimGlyph
        id="metatron"
        size={290}
        style={styles.bottomLeft}
        spinDuration={80000}
        breatheDuration={10000}
        dir={-1}
      />
      <AnimGlyph
        id="mandala"
        size={210}
        style={styles.centerRight}
        spinDuration={50000}
        breatheDuration={7000}
        dir={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  topRight: {
    position: "absolute",
    top: -70,
    right: -85,
  },
  bottomLeft: {
    position: "absolute",
    bottom: 100,
    left: -95,
  },
  centerRight: {
    position: "absolute",
    top: "38%",
    right: -50,
  },
});
