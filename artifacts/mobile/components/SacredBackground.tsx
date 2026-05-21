import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Line } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const GOLD = "#C69B4F";
const GOLD_DIM = "rgba(198,155,79,0.12)";
const GOLD_MID = "rgba(198,155,79,0.06)";

function SacredSvg({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r1 = size * 0.12;
  const r2 = size * 0.22;
  const r3 = size * 0.32;
  const r4 = size * 0.42;
  const r5 = size * 0.48;

  const petalRadius = r2 * 0.95;
  const petalCount = 6;
  const petalOffsets = Array.from({ length: petalCount }, (_, i) => {
    const angle = (i * Math.PI * 2) / petalCount;
    return {
      x: cx + petalRadius * Math.cos(angle),
      y: cy + petalRadius * Math.sin(angle),
    };
  });

  const outerPoints = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.PI * 2) / 12 - Math.PI / 2;
    return {
      x: cx + r4 * Math.cos(angle),
      y: cy + r4 * Math.sin(angle),
    };
  });

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {[r1, r2, r3, r4, r5].map((r, i) => (
        <Circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          stroke={GOLD_DIM}
          strokeWidth={0.6}
          fill="none"
        />
      ))}
      {petalOffsets.map((p, i) => (
        <Circle
          key={`petal-${i}`}
          cx={p.x}
          cy={p.y}
          r={r2 * 0.95}
          stroke={GOLD_MID}
          strokeWidth={0.5}
          fill="none"
        />
      ))}
      {outerPoints.map((p, i) => {
        const opposite = outerPoints[(i + 6) % 12];
        if (i < 6) {
          return (
            <Line
              key={`line-${i}`}
              x1={p.x}
              y1={p.y}
              x2={opposite.x}
              y2={opposite.y}
              stroke={GOLD_MID}
              strokeWidth={0.4}
            />
          );
        }
        return null;
      })}
      <Circle cx={cx} cy={cy} r={r1 * 0.4} stroke={GOLD} strokeWidth={0.8} fill="none" />
    </Svg>
  );
}

type Props = {
  size?: number;
  style?: object;
};

export function SacredBackground({ size = Math.max(width, height) * 1.3, style }: Props) {
  const rotation = useSharedValue(0);
  const rotation2 = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 90000, easing: Easing.linear }),
      -1,
      false
    );
    rotation2.value = withRepeat(
      withTiming(-360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
    scale.value = withRepeat(
      withTiming(1.04, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    return () => {
      cancelAnimation(rotation);
      cancelAnimation(rotation2);
      cancelAnimation(scale);
    };
  }, []);

  const animStyle1 = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const animStyle2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation2.value}deg` }],
    opacity: 0.6,
  }));

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            top: -(size - height) / 2,
            left: -(size - width) / 2,
          },
          animStyle1,
        ]}
      >
        <SacredSvg size={size} />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size * 0.7,
            height: size * 0.7,
            top: height / 2 - (size * 0.7) / 2,
            left: width / 2 - (size * 0.7) / 2,
          },
          animStyle2,
        ]}
      >
        <SacredSvg size={size * 0.7} />
      </Animated.View>
    </View>
  );
}
