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
import Svg, { Circle, Polygon, Line } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const GOLD_BRIGHT = "rgba(198,155,79,0.22)";
const GOLD_MID   = "rgba(198,155,79,0.10)";
const GOLD_DIM   = "rgba(198,155,79,0.055)";

// ── Flower of Life ────────────────────────────────────────────────────────────
// 19 overlapping equal circles: 1 center + 6 ring-1 + 6 ring-2 + 6 ring-3
function FlowerOfLifeSvg({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const R  = size * 0.115; // unit petal radius

  const centers: { x: number; y: number }[] = [{ x: cx, y: cy }];

  // Ring 1 – 6 petals at distance R from center (form "Seed of Life")
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    centers.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  }

  // Ring 2 – 6 petals at R√3 offset 30°
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    centers.push({
      x: cx + R * Math.sqrt(3) * Math.cos(a),
      y: cy + R * Math.sqrt(3) * Math.sin(a),
    });
  }

  // Ring 3 – 6 petals at 2R from center (completes Flower of Life)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    centers.push({ x: cx + 2 * R * Math.cos(a), y: cy + 2 * R * Math.sin(a) });
  }

  const outerR = R * 3; // exact boundary circle of the pattern

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {/* Outer containment rings */}
      <Circle cx={cx} cy={cy} r={outerR * 1.18} stroke={GOLD_DIM}  strokeWidth={0.45} fill="none" />
      <Circle cx={cx} cy={cy} r={outerR}         stroke={GOLD_MID}  strokeWidth={0.55} fill="none" />

      {/* All 19 Flower of Life circles */}
      {centers.map((c, i) => (
        <Circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={R}
          stroke={i === 0 ? GOLD_BRIGHT : GOLD_MID}
          strokeWidth={i === 0 ? 0.65 : 0.45}
          fill="none"
        />
      ))}

      {/* Tiny centre dot */}
      <Circle cx={cx} cy={cy} r={R * 0.16} stroke={GOLD_BRIGHT} strokeWidth={0.7} fill="none" />
    </Svg>
  );
}

// ── Merkaba (Star Tetrahedron / Star of David in 2D) ─────────────────────────
// Two interlocking equilateral triangles + inner hexagon + spoke lines
function MerkabaSvg({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const R  = size * 0.30; // triangle circumradius

  // Triangle 1 – apex pointing UP
  const t1 = Array.from({ length: 3 }, (_, i) => {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    return `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`;
  }).join(" ");

  // Triangle 2 – apex pointing DOWN (rotated 180°)
  const t2 = Array.from({ length: 3 }, (_, i) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    return `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`;
  }).join(" ");

  // Inner hexagon (intersection of both triangles, radius = R / √3)
  const hexR = R / Math.sqrt(3);
  const hex  = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    return `${cx + hexR * Math.cos(a)},${cy + hexR * Math.sin(a)}`;
  }).join(" ");

  // 6 spoke lines from center to each triangle vertex
  const allVertices = [
    ...Array.from({ length: 3 }, (_, i) => {
      const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    }),
    ...Array.from({ length: 3 }, (_, i) => {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    }),
  ];

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {/* Circumscribed circle */}
      <Circle cx={cx} cy={cy} r={R * 1.06} stroke={GOLD_DIM} strokeWidth={0.45} fill="none" />

      {/* Spoke lines from center to each point */}
      {allVertices.map((v, i) => (
        <Line
          key={i}
          x1={cx} y1={cy}
          x2={v.x} y2={v.y}
          stroke={GOLD_DIM}
          strokeWidth={0.35}
        />
      ))}

      {/* Inner hexagon */}
      <Polygon points={hex} stroke={GOLD_MID} strokeWidth={0.45} fill="none" />

      {/* The two Merkaba triangles */}
      <Polygon points={t1} stroke={GOLD_BRIGHT} strokeWidth={0.75} fill="none" />
      <Polygon points={t2} stroke={GOLD_BRIGHT} strokeWidth={0.75} fill="none" />

      {/* Centre ring */}
      <Circle cx={cx} cy={cy} r={hexR * 0.22} stroke={GOLD_BRIGHT} strokeWidth={0.7} fill="none" />
    </Svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
type Props = {
  size?: number;
  style?: object;
};

export function SacredBackground({
  size = Math.max(width, height) * 1.25,
  style,
}: Props) {
  const rot1  = useSharedValue(0);
  const rot2  = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Flower of Life: very slow clockwise (one full turn every 2 min)
    rot1.value = withRepeat(
      withTiming(360, { duration: 120000, easing: Easing.linear }),
      -1,
      false
    );
    // Merkaba: counter-clockwise, slightly faster (one turn per 75 s)
    rot2.value = withRepeat(
      withTiming(-360, { duration: 75000, easing: Easing.linear }),
      -1,
      false
    );
    // Gentle breath-like scale pulse
    pulse.value = withRepeat(
      withTiming(1.04, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    return () => {
      cancelAnimation(rot1);
      cancelAnimation(rot2);
      cancelAnimation(pulse);
    };
  }, []);

  const animFlower = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot1.value}deg` }, { scale: pulse.value }],
  }));

  const animMerkaba = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot2.value}deg` }],
    opacity: 0.85,
  }));

  const frame = {
    position: "absolute" as const,
    width: size,
    height: size,
    top:  -(size - height) / 2,
    left: -(size - width)  / 2,
  };

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {/* Flower of Life layer */}
      <Animated.View style={[frame, animFlower]}>
        <FlowerOfLifeSvg size={size} />
      </Animated.View>

      {/* Merkaba layer (counter-rotates) */}
      <Animated.View style={[frame, animMerkaba]}>
        <MerkabaSvg size={size} />
      </Animated.View>
    </View>
  );
}
