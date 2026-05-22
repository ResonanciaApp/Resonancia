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
import Svg, { Circle, Ellipse, Line, Path, Polygon } from "react-native-svg";

const { width, height } = Dimensions.get("window");

// Geometry — very faint, almost subliminal
const GOLD_BRIGHT = "rgba(198,155,79,0.09)";
const GOLD_MID   = "rgba(198,155,79,0.045)";
const GOLD_DIM   = "rgba(198,155,79,0.022)";

// Eye — slightly more present than the geometry, still quiet
const EYE_MAIN  = "rgba(198,155,79,0.20)";
const EYE_MID   = "rgba(198,155,79,0.12)";
const EYE_DIM   = "rgba(198,155,79,0.06)";

// ── Flower of Life ─────────────────────────────────────────────────────────────
function FlowerOfLifeSvg({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const R  = size * 0.115;

  const centers: { x: number; y: number }[] = [{ x: cx, y: cy }];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    centers.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    centers.push({
      x: cx + R * Math.sqrt(3) * Math.cos(a),
      y: cy + R * Math.sqrt(3) * Math.sin(a),
    });
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    centers.push({ x: cx + 2 * R * Math.cos(a), y: cy + 2 * R * Math.sin(a) });
  }

  const outerR = R * 3;

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Circle cx={cx} cy={cy} r={outerR * 1.18} stroke={GOLD_DIM}  strokeWidth={0.4} fill="none" />
      <Circle cx={cx} cy={cy} r={outerR}         stroke={GOLD_MID}  strokeWidth={0.4} fill="none" />
      {centers.map((c, i) => (
        <Circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={R}
          stroke={i === 0 ? GOLD_BRIGHT : GOLD_MID}
          strokeWidth={i === 0 ? 0.5 : 0.35}
          fill="none"
        />
      ))}
    </Svg>
  );
}

// ── Merkaba ────────────────────────────────────────────────────────────────────
function MerkabaSvg({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const R  = size * 0.30;

  const t1 = Array.from({ length: 3 }, (_, i) => {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    return `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`;
  }).join(" ");

  const t2 = Array.from({ length: 3 }, (_, i) => {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
    return `${cx + R * Math.cos(a)},${cy + R * Math.sin(a)}`;
  }).join(" ");

  const hexR = R / Math.sqrt(3);
  const hex  = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    return `${cx + hexR * Math.cos(a)},${cy + hexR * Math.sin(a)}`;
  }).join(" ");

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
      <Circle cx={cx} cy={cy} r={R * 1.06} stroke={GOLD_DIM} strokeWidth={0.4} fill="none" />
      {allVertices.map((v, i) => (
        <Line
          key={i}
          x1={cx} y1={cy}
          x2={v.x} y2={v.y}
          stroke={GOLD_DIM}
          strokeWidth={0.3}
        />
      ))}
      <Polygon points={hex} stroke={GOLD_MID} strokeWidth={0.35} fill="none" />
      <Polygon points={t1} stroke={GOLD_BRIGHT} strokeWidth={0.6} fill="none" />
      <Polygon points={t2} stroke={GOLD_BRIGHT} strokeWidth={0.6} fill="none" />
    </Svg>
  );
}

// ── Sacred Eye ─────────────────────────────────────────────────────────────────
// Almond-shaped eye with iris and pupil, static, centered
function SacredEyeSvg({ size }: { size: number }) {
  const cx  = size / 2;
  const cy  = size / 2;
  const ew  = size * 0.075; // half eye-width (tip to tip)
  const eh  = size * 0.026; // half eye-height (top to bottom)
  const ir  = size * 0.014; // iris radius
  const pr  = size * 0.005; // pupil radius

  // Lens shape: two quadratic curves through top and bottom arcs
  const eyePath =
    `M ${cx - ew},${cy} ` +
    `Q ${cx},${cy - eh} ${cx + ew},${cy} ` +
    `Q ${cx},${cy + eh} ${cx - ew},${cy} Z`;

  // Subtle outer aura ellipse
  const auraRx = ew * 1.55;
  const auraRy = eh * 2.2;

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      {/* Outer aura — barely visible halo */}
      <Ellipse
        cx={cx} cy={cy}
        rx={auraRx} ry={auraRy}
        stroke={EYE_DIM}
        strokeWidth={0.5}
        fill="none"
      />

      {/* Almond eye outline */}
      <Path
        d={eyePath}
        stroke={EYE_MAIN}
        strokeWidth={0.7}
        fill="none"
      />

      {/* Iris ring */}
      <Circle
        cx={cx} cy={cy}
        r={ir}
        stroke={EYE_MID}
        strokeWidth={0.55}
        fill="none"
      />

      {/* Pupil — tiny filled dot */}
      <Circle
        cx={cx} cy={cy}
        r={pr}
        fill={EYE_MAIN}
      />

      {/* Inner iris detail — tiny ring */}
      <Circle
        cx={cx} cy={cy}
        r={ir * 0.52}
        stroke={EYE_DIM}
        strokeWidth={0.4}
        fill="none"
      />
    </Svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
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
    rot1.value = withRepeat(
      withTiming(360, { duration: 120000, easing: Easing.linear }),
      -1,
      false
    );
    rot2.value = withRepeat(
      withTiming(-360, { duration: 75000, easing: Easing.linear }),
      -1,
      false
    );
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
      <Animated.View style={[frame, animFlower]}>
        <FlowerOfLifeSvg size={size} />
      </Animated.View>

      <Animated.View style={[frame, animMerkaba]}>
        <MerkabaSvg size={size} />
      </Animated.View>

      {/* Eye — static, always centered, sits above the rotating layers */}
      <View style={frame}>
        <SacredEyeSvg size={size} />
      </View>
    </View>
  );
}
