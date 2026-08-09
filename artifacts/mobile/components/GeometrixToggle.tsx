/**
 * GeometrixToggle — botón de geometría sagrada para el header de Inicio.
 * Al pulsarlo activa/desactiva un overlay sutil de formas sagradas animadas.
 */
import React, { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Line, Path } from "react-native-svg";

const GOLD  = "#F9F9F9";
const GOLD2 = "#F9F9F9";
const CREAM = "#FAF0EE";

// ─── Ícono del botón: Flor de Vida miniatura ─────────────────────
function GeometrixIcon({ active }: { active: boolean }) {
  const size = 22;
  const cx = size / 2, cy = size / 2;
  const r = size * 0.175;
  const centers: [number, number][] = [
    [cx, cy],
    ...([0, 60, 120, 180, 240, 300] as number[]).map(
      (a) => [cx + r * 2 * Math.cos((a * Math.PI) / 180), cy + r * 2 * Math.sin((a * Math.PI) / 180)] as [number, number],
    ),
  ];
  const color = active ? GOLD : CREAM;
  const alpha = active ? 1 : 0.38;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {centers.map(([x, y], i) => (
        <Circle
          key={i} cx={x} cy={y} r={r}
          stroke={color} strokeWidth={0.75} fill="none"
          strokeOpacity={i === 0 ? alpha : alpha * 0.65}
        />
      ))}
      <Circle cx={cx} cy={cy} r={r * 3.05}
        stroke={color} strokeWidth={0.4} fill="none"
        strokeOpacity={alpha * 0.3} strokeDasharray="2 3" />
    </Svg>
  );
}

// ─── Botón de toggle ─────────────────────────────────────────────
interface GeometrixBtnProps {
  active: boolean;
  onToggle: (v: boolean) => void;
}

export function GeometrixBtn({ active, onToggle }: GeometrixBtnProps) {
  const glow = useSharedValue(0);

  useEffect(() => {
    if (active) {
      glow.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    } else {
      glow.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.quad) });
    }
  }, [active, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Pressable
      onPress={() => onToggle(!active)}
      hitSlop={10}
      style={styles.btn}
    >
      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />
      <GeometrixIcon active={active} />
    </Pressable>
  );
}

// ─── Formas SVG del overlay ──────────────────────────────────────

function FlowerOfLife({ size, color }: { size: number; color: string }) {
  const cx = size / 2, cy = size / 2;
  const r  = size * 0.19;
  const centers: [number, number][] = [
    [cx, cy],
    ...([0, 60, 120, 180, 240, 300] as number[]).map(
      (a) => [cx + r * 2 * Math.cos((a * Math.PI) / 180), cy + r * 2 * Math.sin((a * Math.PI) / 180)] as [number, number],
    ),
  ];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {centers.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={r} stroke={color} strokeWidth={0.6} fill="none"
          strokeOpacity={i === 0 ? 0.8 : 0.45} />
      ))}
      <Circle cx={cx} cy={cy} r={r * 3} stroke={color} strokeWidth={0.35}
        fill="none" strokeOpacity={0.2} strokeDasharray="3 5" />
    </Svg>
  );
}

function MetatronSimple({ size, color }: { size: number; color: string }) {
  const cx = size / 2, cy = size / 2;
  const r  = size * 0.18;
  const centers: [number, number][] = [
    [cx, cy],
    ...([0, 60, 120, 180, 240, 300] as number[]).map(
      (a) => [cx + r * 2 * Math.cos((a * Math.PI) / 180), cy + r * 2 * Math.sin((a * Math.PI) / 180)] as [number, number],
    ),
  ];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {centers.slice(1).map(([x, y], i) => (
        <Line key={i} x1={cx} y1={cy} x2={x} y2={y}
          stroke={color} strokeWidth={0.45} strokeOpacity={0.22} />
      ))}
      {centers.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={r} stroke={color} strokeWidth={0.55} fill="none"
          strokeOpacity={i === 0 ? 0.65 : 0.38} />
      ))}
      <Circle cx={cx} cy={cy} r={r * 3.1} stroke={color} strokeWidth={0.35}
        fill="none" strokeOpacity={0.14} />
    </Svg>
  );
}

function DoubleStar({ size, color }: { size: number; color: string }) {
  const cx = size / 2, cy = size / 2;
  const R  = size * 0.42;
  const tri1 = [0, 120, 240]
    .map((a) => `${cx + R * Math.cos(((a - 90) * Math.PI) / 180)},${cy + R * Math.sin(((a - 90) * Math.PI) / 180)}`)
    .join(" ");
  const tri2 = [60, 180, 300]
    .map((a) => `${cx + R * Math.cos(((a - 90) * Math.PI) / 180)},${cy + R * Math.sin(((a - 90) * Math.PI) / 180)}`)
    .join(" ");
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path d={`M ${tri1.split(" ").join(" L ")} Z`} stroke={color} strokeWidth={0.7} fill="none" strokeOpacity={0.65} />
      <Path d={`M ${tri2.split(" ").join(" L ")} Z`} stroke={color} strokeWidth={0.7} fill="none" strokeOpacity={0.42} />
      <Circle cx={cx} cy={cy} r={R * 1.05} stroke={color} strokeWidth={0.35} fill="none" strokeOpacity={0.18} />
      <Circle cx={cx} cy={cy} r={R * 0.35} stroke={color} strokeWidth={0.45} fill="none" strokeOpacity={0.28} />
    </Svg>
  );
}

function ConcentricRings({ size, color }: { size: number; color: string }) {
  const cx = size / 2, cy = size / 2;
  const rings = [0.45, 0.34, 0.24, 0.15, 0.07].map((f) => size * f);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((r, i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} stroke={color} strokeWidth={0.55}
          fill="none" strokeOpacity={0.52 - i * 0.08} />
      ))}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <Line key={i}
          x1={cx + rings[4] * Math.cos((a * Math.PI) / 180)}
          y1={cy + rings[4] * Math.sin((a * Math.PI) / 180)}
          x2={cx + rings[0] * Math.cos((a * Math.PI) / 180)}
          y2={cy + rings[0] * Math.sin((a * Math.PI) / 180)}
          stroke={color} strokeWidth={0.35} strokeOpacity={0.18} />
      ))}
    </Svg>
  );
}

function HexPetals({ size, color }: { size: number; color: string }) {
  const cx = size / 2, cy = size / 2;
  const r  = size * 0.22;
  const petals = ([0, 60, 120, 180, 240, 300] as number[]).map(
    (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)] as [number, number],
  );
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {petals.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={r} stroke={color} strokeWidth={0.55} fill="none" strokeOpacity={0.38} />
      ))}
      <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={0.55} fill="none" strokeOpacity={0.62} />
      <Circle cx={cx} cy={cy} r={r * 2.05} stroke={color} strokeWidth={0.35} fill="none" strokeOpacity={0.16} />
    </Svg>
  );
}

// ─── Actor individual: fade in/out cíclico ───────────────────────
type GeoType = "flower" | "metatron" | "star" | "rings" | "hexPetals";

interface ActorProps {
  type: GeoType; size: number; color: string;
  top?: number; bottom?: number; left?: number; right?: number;
  peakOpacity: number; duration: number; delay: number;
}

function useFadeCycle(peak: number, duration: number, delay: number, active: boolean) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (active) {
      const half = duration / 2;
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(peak, { duration: half, easing: Easing.inOut(Easing.sin) }),
            withTiming(0,    { duration: half, easing: Easing.inOut(Easing.sin) }),
          ),
          -1, false,
        ),
      );
    } else {
      opacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function GeoActor({ type, size, color, top, bottom, left, right, peakOpacity, duration, delay, active }:
  ActorProps & { active: boolean }) {
  const animStyle = useFadeCycle(peakOpacity, duration, delay, active);

  const geo = (() => {
    switch (type) {
      case "flower":    return <FlowerOfLife size={size} color={color} />;
      case "metatron":  return <MetatronSimple size={size} color={color} />;
      case "star":      return <DoubleStar size={size} color={color} />;
      case "rings":     return <ConcentricRings size={size} color={color} />;
      case "hexPetals": return <HexPetals size={size} color={color} />;
    }
  })();

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", width: size, height: size },
        top    !== undefined && { top },
        bottom !== undefined && { bottom },
        left   !== undefined && { left },
        right  !== undefined && { right },
        animStyle,
      ]}
    >
      {geo}
    </Animated.View>
  );
}

// ─── Overlay principal ───────────────────────────────────────────
interface OverlayProps { active: boolean }

export function GeometrixOverlay({ active }: OverlayProps) {
  return (
    <>
      {/* Superior */}
      <GeoActor active={active} type="flower"    size={200} color={GOLD2}
        top={-40}   right={-55}
        peakOpacity={0.13} duration={13000} delay={0} />

      <GeoActor active={active} type="metatron"  size={120} color={GOLD}
        top={10}    left={-35}
        peakOpacity={0.16} duration={10000} delay={2200} />

      <GeoActor active={active} type="rings"     size={55}  color={CREAM}
        top={60}    left={155}
        peakOpacity={0.20} duration={7500}  delay={4800} />

      <GeoActor active={active} type="hexPetals" size={65}  color={GOLD2}
        top={110}   right={10}
        peakOpacity={0.18} duration={9000}  delay={1200} />

      {/* Media */}
      <GeoActor active={active} type="star"      size={160} color={GOLD}
        top={280}   left={-70}
        peakOpacity={0.11} duration={14000} delay={1800} />

      <GeoActor active={active} type="flower"    size={80}  color={CREAM}
        top={320}   right={5}
        peakOpacity={0.15} duration={8500}  delay={6200} />

      <GeoActor active={active} type="rings"     size={45}  color={GOLD}
        top={460}   left={170}
        peakOpacity={0.22} duration={7000}  delay={3400} />

      {/* Inferior */}
      <GeoActor active={active} type="metatron"  size={220} color={GOLD2}
        bottom={-40} left={-65}
        peakOpacity={0.12} duration={15000} delay={3200} />

      <GeoActor active={active} type="hexPetals" size={110} color={GOLD}
        bottom={30}  right={-10}
        peakOpacity={0.16} duration={11000} delay={5800} />

      <GeoActor active={active} type="star"      size={60}  color={CREAM}
        bottom={100} left={145}
        peakOpacity={0.22} duration={8000}  delay={2700} />

      <GeoActor active={active} type="flower"    size={105} color={GOLD2}
        bottom={110} left={-10}
        peakOpacity={0.14} duration={12000} delay={7200} />
    </>
  );
}

// ─── Estilos ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  glow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 0,
  },
});
