/**
 * LandingBgGeo — geometrías sagradas animadas para el fondo del landing de Geometrix.
 * Fade in/out con glow sutil. Tamaños pequeños, medianos y grandes.
 * El usuario definirá las geometrías exactas; por ahora son placeholders representativos.
 */
import React from "react";
import { StyleSheet, View } from "react-native";
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

const BLUE  = "#6584d4";
const BLUE2 = "#c7caec";
const GOLD  = "#BE9650";
const GOLD2 = "#D6A85B";

/* ─── hook: genera un loop de fade in / fade out ─────────────────── */
function useFadeCycle(
  peakOpacity: number,
  durationMs: number,
  delayMs: number,
) {
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const half = durationMs / 2;
    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(peakOpacity, { duration: half, easing: Easing.inOut(Easing.sin) }),
          withTiming(0,           { duration: half, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

/* ─── geometrías individuales ────────────────────────────────────── */

/** Flor de Vida: 7 círculos en patrón hexagonal */
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
        <Circle key={i} cx={x} cy={y} r={r} stroke={color} strokeWidth={0.7} fill="none"
          strokeOpacity={i === 0 ? 0.8 : 0.45} />
      ))}
      {/* círculo exterior guía */}
      <Circle cx={cx} cy={cy} r={r * 3} stroke={color} strokeWidth={0.4}
        fill="none" strokeOpacity={0.2} strokeDasharray="3 5" />
    </Svg>
  );
}

/** Vesica Piscis */
function VesicaPiscis({ size, color }: { size: number; color: string }) {
  const r = size * 0.34;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size * 0.38} cy={size / 2} r={r} stroke={color} strokeWidth={0.8} fill="none" strokeOpacity={0.7} />
      <Circle cx={size * 0.62} cy={size / 2} r={r} stroke={color} strokeWidth={0.8} fill="none" strokeOpacity={0.7} />
      <Circle cx={size / 2}    cy={size / 2} r={size * 0.48} stroke={color} strokeWidth={0.4}
        fill="none" strokeOpacity={0.2} strokeDasharray="4 6" />
    </Svg>
  );
}

/** Metatrón simplificado: 7 círculos + líneas de conexión */
function MetatronSimple({ size, color }: { size: number; color: string }) {
  const cx = size / 2, cy = size / 2;
  const r  = size * 0.18;
  const centers: [number, number][] = [
    [cx, cy],
    ...([0, 60, 120, 180, 240, 300] as number[]).map(
      (a) => [cx + r * 2 * Math.cos((a * Math.PI) / 180), cy + r * 2 * Math.sin((a * Math.PI) / 180)] as [number, number],
    ),
  ];
  // líneas desde centro a cada satélite
  const lines = centers.slice(1).map(([x, y], i) => (
    <Line key={i} x1={cx} y1={cy} x2={x} y2={y}
      stroke={color} strokeWidth={0.5} strokeOpacity={0.25} />
  ));
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {lines}
      {centers.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={r} stroke={color} strokeWidth={0.6} fill="none"
          strokeOpacity={i === 0 ? 0.7 : 0.4} />
      ))}
      <Circle cx={cx} cy={cy} r={r * 3.1} stroke={color} strokeWidth={0.4}
        fill="none" strokeOpacity={0.15} />
    </Svg>
  );
}

/** Estrella de Davide / Sri Yantra básico: dos triángulos entrelazados */
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
      <Path d={`M ${tri1.split(" ").join(" L ")} Z`} stroke={color} strokeWidth={0.8} fill="none" strokeOpacity={0.7} />
      <Path d={`M ${tri2.split(" ").join(" L ")} Z`} stroke={color} strokeWidth={0.8} fill="none" strokeOpacity={0.45} />
      <Circle cx={cx} cy={cy} r={R * 1.05} stroke={color} strokeWidth={0.4} fill="none" strokeOpacity={0.2} />
      <Circle cx={cx} cy={cy} r={R * 0.35} stroke={color} strokeWidth={0.5} fill="none" strokeOpacity={0.3} />
    </Svg>
  );
}

/** Círculos concéntricos */
function ConcentricRings({ size, color }: { size: number; color: string }) {
  const cx = size / 2, cy = size / 2;
  const rings = [0.45, 0.34, 0.24, 0.15, 0.07].map((f) => size * f);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((r, i) => (
        <Circle key={i} cx={cx} cy={cy} r={r} stroke={color} strokeWidth={0.6}
          fill="none" strokeOpacity={0.55 - i * 0.08} />
      ))}
      {/* rayos */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <Line key={i}
          x1={cx + rings[4] * Math.cos((a * Math.PI) / 180)}
          y1={cy + rings[4] * Math.sin((a * Math.PI) / 180)}
          x2={cx + rings[0] * Math.cos((a * Math.PI) / 180)}
          y2={cy + rings[0] * Math.sin((a * Math.PI) / 180)}
          stroke={color} strokeWidth={0.4} strokeOpacity={0.2} />
      ))}
    </Svg>
  );
}

/** Pétalo hexagonal: 6 círculos alrededor de un centro */
function HexPetals({ size, color }: { size: number; color: string }) {
  const cx = size / 2, cy = size / 2;
  const r  = size * 0.22;
  const petals = ([0, 60, 120, 180, 240, 300] as number[]).map(
    (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)] as [number, number],
  );
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {petals.map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={r} stroke={color} strokeWidth={0.6} fill="none" strokeOpacity={0.4} />
      ))}
      <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={0.6} fill="none" strokeOpacity={0.65} />
      <Circle cx={cx} cy={cy} r={r * 2.05} stroke={color} strokeWidth={0.4} fill="none" strokeOpacity={0.18} />
    </Svg>
  );
}

/* ─── un actor animado ───────────────────────────────────────────── */
type GeoType = "flower" | "vesica" | "metatron" | "star" | "rings" | "hexPetals";

interface GeoActorProps {
  type: GeoType;
  size: number;
  color: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  peakOpacity: number;
  duration: number;
  delay: number;
}

function GeoActor({ type, size, color, top, bottom, left, right, peakOpacity, duration, delay }: GeoActorProps) {
  const animStyle = useFadeCycle(peakOpacity, duration, delay);

  const geo = (() => {
    switch (type) {
      case "flower":   return <FlowerOfLife size={size} color={color} />;
      case "vesica":   return <VesicaPiscis size={size} color={color} />;
      case "metatron": return <MetatronSimple size={size} color={color} />;
      case "star":     return <DoubleStar size={size} color={color} />;
      case "rings":    return <ConcentricRings size={size} color={color} />;
      case "hexPetals":return <HexPetals size={size} color={color} />;
    }
  })();

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        animStyle,
        {
          width: size,
          height: size,
          ...(top    !== undefined ? { top }    : {}),
          ...(bottom !== undefined ? { bottom } : {}),
          ...(left   !== undefined ? { left }   : {}),
          ...(right  !== undefined ? { right }  : {}),
        },
      ]}
      pointerEvents="none"
    >
      {geo}
    </Animated.View>
  );
}

/* ─── componente principal ───────────────────────────────────────── */
export function LandingBgGeo() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* ── ZONA SUPERIOR ─────────────────────────────────────── */}

      {/* GRANDE — Flor de Vida, esquina sup derecha, mitad fuera */}
      <GeoActor type="flower"    size={220} color={BLUE2}
        top={-40}   right={-60}
        peakOpacity={0.07} duration={13000} delay={0} />

      {/* MEDIANA — Metatrón, sup izquierda, borde de pantalla */}
      <GeoActor type="metatron"  size={130} color={BLUE}
        top={10}    left={-50}
        peakOpacity={0.10} duration={9500}  delay={3500} />

      {/* PEQUEÑA — Anillos concéntricos, centro-arriba */}
      <GeoActor type="rings"     size={58}  color={GOLD}
        top={55}    left={160}
        peakOpacity={0.18} duration={7000}  delay={6000} />

      {/* PEQUEÑA — Vesica Piscis, sup derecha interior */}
      <GeoActor type="vesica"    size={64}  color={GOLD2}
        top={90}    right={18}
        peakOpacity={0.15} duration={8000}  delay={2000} />

      {/* ── ZONA MEDIA (lateral) ──────────────────────────────── */}

      {/* GRANDE — Estrella, izquierda centro, mitad fuera */}
      <GeoActor type="star"      size={180} color={GOLD}
        top={270}   left={-80}
        peakOpacity={0.06} duration={14000} delay={1500} />

      {/* PEQUEÑA — Pétalos hex, derecha medio */}
      <GeoActor type="hexPetals" size={52}  color={BLUE2}
        top={320}   right={10}
        peakOpacity={0.16} duration={8500}  delay={9000} />

      {/* ── ZONA INFERIOR ─────────────────────────────────────── */}

      {/* GRANDE — Metatrón, esquina inf izquierda */}
      <GeoActor type="metatron"  size={240} color={BLUE}
        bottom={-60} left={-80}
        peakOpacity={0.05} duration={15000} delay={4000} />

      {/* MEDIANA — Pétalos hex, inf derecha */}
      <GeoActor type="hexPetals" size={120} color={GOLD}
        bottom={30}  right={-20}
        peakOpacity={0.09} duration={10000} delay={7500} />

      {/* PEQUEÑA — Estrella, inf centro */}
      <GeoActor type="star"      size={62}  color={BLUE2}
        bottom={80}  left={155}
        peakOpacity={0.17} duration={7500}  delay={5000} />

      {/* MEDIANA — Flor de Vida, inf izquierda */}
      <GeoActor type="flower"    size={110} color={GOLD2}
        bottom={110} left={-10}
        peakOpacity={0.08} duration={11000} delay={8000} />

      {/* PEQUEÑA — Anillos, inf derecha interior */}
      <GeoActor type="rings"     size={46}  color={GOLD}
        bottom={200} right={25}
        peakOpacity={0.20} duration={6500}  delay={11000} />
    </View>
  );
}
