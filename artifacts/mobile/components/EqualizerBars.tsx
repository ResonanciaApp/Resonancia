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
  }, []);

  return <Animated.View style={[styles.bar, { height: h, backgroundColor: color }]} />;
}

interface Props {
  color?: string;
  size?: "sm" | "md";
}

export function EqualizerBars({ color = "#F9F9F9", size = "md" }: Props) {
  const scale = size === "sm" ? 0.75 : 1;
  return (
    <View style={[styles.wrap, { height: MAX_H * scale, gap: 3 * scale }]}>
      <Bar duration={380} delay={0}   color={color} />
      <Bar duration={500} delay={140} color={color} />
      <Bar duration={430} delay={270} color={color} />
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
