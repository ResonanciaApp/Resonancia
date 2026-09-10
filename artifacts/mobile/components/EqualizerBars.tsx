import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

const MAX_H = 14;
const MIN_H = 3;
const BAR_W = 3;

function Bar({
  duration,
  delay,
  color,
}: {
  duration: number;
  delay: number;
  color: string;
}) {
  const h = useRef(new Animated.Value(MIN_H)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(h, { toValue: MAX_H, duration, useNativeDriver: false }),
        Animated.timing(h, { toValue: MIN_H, duration, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [color, delay, duration, h]);

  return <Animated.View style={[styles.bar, { height: h, backgroundColor: color }]} />;
}

interface Props {
  color?: string;
  size?: "sm" | "md";
  variant?: "default" | "zen";
}

export function EqualizerBars({
  color = "#F9F9F9",
  size = "md",
  variant = "default",
}: Props) {
  const scale = size === "sm" ? 0.75 : 1;
  const timings = variant === "zen"
    ? [
        { duration: 1100, delay: 0 },
        { duration: 1450, delay: 320 },
        { duration: 1250, delay: 640 },
      ]
    : [
        { duration: 380, delay: 0 },
        { duration: 500, delay: 140 },
        { duration: 430, delay: 270 },
      ];
  return (
    <View style={[styles.wrap, { height: MAX_H * scale, gap: 3 * scale }]}>
      {timings.map((timing, index) => (
        <Bar
          key={index}
          duration={timing.duration}
          delay={timing.delay}
          color={color}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  bar: {
    width: BAR_W,
    borderRadius: 1.5,
  },
});
