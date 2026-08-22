/**
 * SceneAnimationInline — renderiza una escena Geometrix animada inline
 * (sin modal), en un View de altura fija. Se usa en el header de Inicio
 * entre el logo y "Tu progreso semanal".
 *
 * AnimatedLayer replica la lógica de GeometryLayerInner de geometrix.tsx:
 * tamaño efectivo (scale × zoom), efectos de bloom/glow/halo/ripple/expansión,
 * kaleidoscopio, opacidad y desplazamiento.
 */
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing as RNEasing, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { Circle, Defs, RadialGradient, Stop, Svg } from "react-native-svg";
import RAnimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";

import { SacredGlyph } from "@/components/SacredGlyph";
import { bgGradientColors, gradientColors, type GeoSettings } from "@/data/geometrix-creations";
import { baseOf, type GeometryId } from "@/data/geometries";
import { useGeometrixCatalog } from "@/hooks/useGeometrixCatalog";
import type { SceneAnimation } from "@workspace/api-client-react";

// ── Utilidades de color (copiadas de geometrix.tsx) ────────────────────────
function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function parseHex(hex: string): [number, number, number] {
  let h = (hex || "").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.round(clamp01(v / 255) * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}
function adjustSaturation(hex: string, amount: number): string {
  if (!hex || hex[0] !== "#") return hex;
  const [r, g, b] = parseHex(hex);
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  const m = clamp01(amount) * 2;
  return toHex(gray + (r - gray) * m, gray + (g - gray) * m, gray + (b - gray) * m);
}
function saturateGrad(
  grad: readonly [string, string] | undefined,
  amount: number,
): readonly [string, string] | undefined {
  if (!grad || amount === 0.5) return grad;
  return [adjustSaturation(grad[0], amount), adjustSaturation(grad[1], amount)] as const;
}

// ── Halo: aura radial suave detrás del glifo ──────────────────────────────
function HaloGlow({ size, color, amount }: { size: number; color: string; amount: number }) {
  const a = clamp01(amount);
  const gid = `si-halo-${React.useId().replace(/:/g, "")}`;
  return (
    <View style={s.layer} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
        <Defs>
          <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.5 * a} />
            <Stop offset="0.5" stopColor={color} stopOpacity={0.2 * a} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="50" cy="50" r="50" fill={`url(#${gid})`} />
      </Svg>
    </View>
  );
}

// ── Ripple: anillos concéntricos que emanan en bucle ──────────────────────
function RippleRings({ size, color, amount }: { size: number; color: string; amount: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.ease) }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);
  const a = clamp01(amount);
  const ring1 = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + t.value * 0.9 }],
    opacity: (1 - t.value) * 0.6 * a,
  }));
  const ring2 = useAnimatedStyle(() => {
    const p = (t.value + 0.5) % 1;
    return { transform: [{ scale: 0.4 + p * 0.9 }], opacity: (1 - p) * 0.6 * a };
  });
  return (
    <>
      <RAnimated.View style={[s.layer, ring1]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="46" stroke={color} strokeWidth={1.6} fill="none" />
        </Svg>
      </RAnimated.View>
      <RAnimated.View style={[s.layer, ring2]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="46" stroke={color} strokeWidth={1.6} fill="none" />
        </Svg>
      </RAnimated.View>
    </>
  );
}

// ── Expansión: eco del glifo que crece y se desvanece en bucle ────────────
function ExpansionEcho({
  geoId, color, grad, size, strokeScale, kaleidoscope, kaleidSegments, amount,
}: {
  geoId: GeometryId; color: string; grad: readonly [string, string] | undefined;
  size: number; strokeScale: number; kaleidoscope: boolean; kaleidSegments: number; amount: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.out(Easing.ease) }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);
  const maxOpacity = 0.15 + clamp01(amount) * 0.45;
  const st = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + t.value * 0.6 }],
    opacity: (1 - t.value) * maxOpacity,
  }));
  return (
    <RAnimated.View style={[s.layer, st]} pointerEvents="none">
      <SacredGlyph id={geoId} color={color} gradient={grad} size={size}
        strokeScale={strokeScale} kaleidoscope={kaleidoscope} kaleidSegments={kaleidSegments} />
    </RAnimated.View>
  );
}

// ── Capa animada — replica GeometryLayerInner ──────────────────────────────
function AnimatedLayer({
  instanceId,
  settings,
  masterOpacity,
  index,
  motion,
  baseSize,
  strokeModeMap,
  liveScaleSV,
  reducedEffects,
  allowDecorativeEffects,
  allowMotionEffects,
}: {
  instanceId: string;
  settings: GeoSettings;
  masterOpacity: number;
  index: number;
  motion: boolean;
  baseSize: number;
  strokeModeMap: Map<string, "thin" | "natural">;
  liveScaleSV?: SharedValue<number>;
  /** Preserva el glifo y su movimiento, pero evita copias SVG redundantes. */
  reducedEffects?: boolean;
  /** Reserva bloom/glow/halo para las capas visualmente superiores. */
  allowDecorativeEffects?: boolean;
  /** Reserva ripple/expansión para una sola capa en la vista compacta. */
  allowMotionEffects?: boolean;
}) {
  const {
    rotate, rotateLeft, rotateSpeed,
    breatheAmount, fadeLoopAmount,
    opacity, saturation, color, gradientId,
    bloom, glow: geoGlow, halo, ripple, expansionAmount,
    kaleidoscope, kaleidSegments,
    scale, zoom, manualAngle, offsetX, offsetY,
  } = settings;

  // ── Tamaño efectivo (igual que GeometryLayerInner) ─────────────────────
  const safeScale = Number.isFinite(scale) ? scale : 1;
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const userScale = 0.4 + safeScale * 0.6;
  const committedMag = userScale * safeZoom;
  const effectiveSize = baseSize * committedMag;

  // ── Colores con saturación ─────────────────────────────────────────────
  const safeSat = Number.isFinite(saturation) ? clamp01(saturation) : 0.5;
  const grad = gradientColors(gradientId);
  const dispColor = adjustSaturation(color, safeSat);
  const dispGrad = saturateGrad(grad, safeSat);
  const bloomColor = mixHex(dispColor, "#FFFFFF", 0.55);

  // ── Efectos saneados ───────────────────────────────────────────────────
  const safeBloom = Number.isFinite(bloom) ? clamp01(bloom) : 0;
  const safeHalo = Number.isFinite(halo) ? clamp01(halo) : 0;
  const safeRipple = Number.isFinite(ripple) ? clamp01(ripple) : 0;
  const safeExpansion = Number.isFinite(expansionAmount) ? clamp01(expansionAmount) : 0;
  const safeGeoGlow = Number.isFinite(geoGlow) ? clamp01(geoGlow) : 0;
  const safeFade = Number.isFinite(fadeLoopAmount) ? clamp01(fadeLoopAmount) : 0;
  const safeBreath = Number.isFinite(breatheAmount) ? clamp01(breatheAmount) : 0;
  const safeKaleid = kaleidoscope ?? false;
  const safeKaleidSegs = kaleidSegments ?? 6;
  const bloomAmount = allowDecorativeEffects
    ? (reducedEffects ? Math.min(safeBloom, 0.6) : safeBloom)
    : 0;
  const glowAmount = allowDecorativeEffects
    ? (reducedEffects ? Math.min(safeGeoGlow, 0.6) : safeGeoGlow)
    : 0;

  // ── Animaciones ────────────────────────────────────────────────────────
  const safeSpeed = Number.isFinite(rotateSpeed) ? clamp01(rotateSpeed) : 0.5;
  const spinDuration = ((38000 + index * 6000) / (0.5 + safeSpeed * 2.5)) * 1.6;
  const dir = rotateLeft ? -1 : 1;
  const spin = (rotate || rotateLeft) && motion;

  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (!spin) { cancelAnimation(rot); rot.value = withTiming(0, { duration: 400 }); return; }
    rot.value = withRepeat(withTiming(1, { duration: spinDuration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rot);
  }, [spin, spinDuration, rot]);

  useEffect(() => {
    if (safeBreath > 0 && motion) {
      pulse.value = withRepeat(withTiming(1, { duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else { cancelAnimation(pulse); pulse.value = withTiming(0, { duration: 400 }); }
    return () => cancelAnimation(pulse);
  }, [safeBreath, motion, index, pulse]);

  useEffect(() => {
    if (safeFade > 0 && motion) {
      const minOpacity = 1 - safeFade * 0.85;
      fade.value = withRepeat(withTiming(minOpacity, { duration: 4200 + index * 600, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else { cancelAnimation(fade); fade.value = withTiming(1, { duration: 400 }); }
    return () => cancelAnimation(fade);
  }, [safeFade, motion, fade, index]);

  const breatheDepth = 0.04 + safeBreath * 0.18;
  const baseOpacity = clamp01(opacity * masterOpacity);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX ?? 0 },
      { translateY: offsetY ?? 0 },
      { rotate: `${(manualAngle ?? 0) + rot.value * 360 * dir}deg` },
      { scale: safeBreath > 0 ? 1 - breatheDepth + pulse.value * breatheDepth : 1 },
    ],
    opacity: baseOpacity * fade.value,
  }));

  const geoId = baseOf(instanceId) as GeometryId;
  // strokeMode del catálogo: "thin" → strokeScale 0.45 (igual que Geometrix)
  const thinFactor = strokeModeMap.get(geoId) === "thin" ? 0.45 : 1;

  return (
    <RAnimated.View style={[s.layer, aStyle]} pointerEvents="none">
      {safeHalo > 0 && allowDecorativeEffects && (
        <HaloGlow size={effectiveSize * 1.25} color={dispColor} amount={safeHalo} />
      )}
      {safeRipple > 0 && motion && allowMotionEffects && (
        <RippleRings size={effectiveSize} color={dispColor} amount={safeRipple} />
      )}
      {bloomAmount > 0 && (
        <>
          <View style={[s.layer, { opacity: 0.22 * bloomAmount }]} pointerEvents="none">
            <SacredGlyph id={geoId} color={bloomColor} size={effectiveSize}
              strokeScale={thinFactor} kaleidoscope={safeKaleid} kaleidSegments={safeKaleidSegs} />
          </View>
          {!reducedEffects && (
            <View style={[s.layer, { opacity: 0.14 * bloomAmount }]} pointerEvents="none">
              <SacredGlyph id={geoId} color={bloomColor} size={effectiveSize}
                strokeScale={thinFactor} kaleidoscope={safeKaleid} kaleidSegments={safeKaleidSegs} />
            </View>
          )}
        </>
      )}
      {glowAmount > 0 && (
        <>
          <View style={[s.layer, { opacity: 0.26 * glowAmount }]} pointerEvents="none">
            <SacredGlyph id={geoId} color={dispColor} gradient={dispGrad} size={effectiveSize}
              strokeScale={thinFactor} kaleidoscope={safeKaleid} kaleidSegments={safeKaleidSegs} />
          </View>
          {!reducedEffects && (
            <View style={[s.layer, { opacity: 0.16 * glowAmount }]} pointerEvents="none">
              <SacredGlyph id={geoId} color={dispColor} gradient={dispGrad} size={effectiveSize}
                strokeScale={thinFactor} kaleidoscope={safeKaleid} kaleidSegments={safeKaleidSegs} />
            </View>
          )}
        </>
      )}
      {safeExpansion > 0 && motion && allowMotionEffects && (
        <ExpansionEcho geoId={geoId} color={dispColor} grad={dispGrad}
          size={effectiveSize} strokeScale={thinFactor}
          kaleidoscope={safeKaleid} kaleidSegments={safeKaleidSegs}
          amount={safeExpansion} />
      )}
      <View style={s.layer} pointerEvents="none">
        <SacredGlyph id={geoId} color={dispColor} gradient={dispGrad} size={effectiveSize}
          strokeScale={thinFactor} kaleidoscope={safeKaleid} kaleidSegments={safeKaleidSegs}
          liveScaleSV={liveScaleSV} />
      </View>
    </RAnimated.View>
  );
}

// ── Tipos del recipe ───────────────────────────────────────────────────────
type SceneRecipe = {
  active?: string[];
  master?: {
    opacity?: number;
    motion?: boolean;
    bgColor?: string | null;
    bgGradientId?: string | null;
  };
  settings?: Record<string, GeoSettings>;
};

// ── Componente público ─────────────────────────────────────────────────────
interface Props {
  scene: SceneAnimation | null;
  height: number;
  onPress?: () => void;
  style?: ViewStyle;
  /** Cuando true, fuerza motion=false en todas las capas (usar al perder foco de tab). */
  paused?: boolean;
  /** SharedValue del zoom vivo por pinch. Si se pasa, el glifo redibuja al tamaño real
   *  en el UI thread (sin transform:scale en el contenedor → sin pixelación). */
  liveScaleSV?: SharedValue<number>;
  /**
   * Color de fondo temporal (Shuffle). Se muestra DETRÁS de las geometrías sin
   * persistirse ni modificar la receta. null/undefined = sin override.
   */
  bgOverride?: string | null;
  /**
   * Cuando true, desactiva el fade interno (6 000 ms por cambio de escena) y
   * deja que el padre controle la transición de opacidad con su propio Animated.Value.
   * Usar siempre que el padre envuelva el componente en un Animated.View con opacity.
   */
  noInternalFade?: boolean;
  /**
   * La vista compacta de Inicio limita las capas y las copias SVG de efectos.
   * No altera recetas ni afecta el lienzo/editor de Geometrix.
   */
  quality?: "full" | "home";
}

export function SceneAnimationInline({
  scene,
  height,
  onPress,
  style,
  paused,
  liveScaleSV,
  bgOverride,
  noInternalFade,
  quality = "full",
}: Props) {
  // Si noInternalFade=true el padre controla la opacidad → arrancar en 1 siempre.
  const fadeAnim = useRef(new Animated.Value(noInternalFade ? 1 : scene ? 0 : 1)).current;
  const prevSceneId = useRef<number | null>(null);

  // strokeModeMap: geometryId → "thin" | "natural", desde el catálogo del servidor.
  // Si aún carga, defaultea a "natural" (strokeScale=1) → no rompe el render.
  const { geometries: catalogGeos } = useGeometrixCatalog();
  const strokeModeMap = useMemo(
    () => new Map(catalogGeos.map((g) => [g.id, g.strokeMode])),
    [catalogGeos],
  );

  useEffect(() => {
    // Si el padre controla el fade, saltar el interno completamente.
    if (noInternalFade) return;
    if (!scene) return;
    if (scene.id === prevSceneId.current) return;
    prevSceneId.current = scene.id;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 6000,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start();
  }, [scene?.id, noInternalFade]);

  if (!scene) return <View style={[{ height }, style]} />;

  const recipe = scene.recipe as SceneRecipe;
  const active = recipe.active ?? [];
  const settingsMap = recipe.settings ?? {};
  const master = recipe.master ?? {};
  const masterOpacity = master.opacity ?? 1;
  // paused=true (tab sin foco) fuerza motion=false → cancela todos los withRepeat
  const motion = !paused && (master.motion !== false);
  // Inicio conserva todas las geometrías de la receta, pero concentra las
  // copias SVG decorativas en las capas superiores para no saturar SVG/UI.
  const isHomeQuality = quality === "home";

  // baseSize: el tamaño de referencia desde el que se aplica el committedMag
  // de cada geometría. Se toma height * 1.15 igual que antes, pero ahora
  // cada capa escala por su propio scale×zoom (effectiveSize = baseSize × mag).
  const baseSize = height * 1.15;

  const bgGrad = bgGradientColors(master.bgGradientId ?? null);
  const hasBg = !!(master.bgColor || bgGrad);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {!!bgOverride && (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: bgOverride }]}
          pointerEvents="none"
        />
      )}
      <Pressable
        onPress={onPress}
        style={[s.container, { height }, hasBg && s.containerBg]}
      >
        {active.map((instanceId, i) => {
          const gs = settingsMap[instanceId];
          if (!gs) return null;
          return (
            <AnimatedLayer
              key={instanceId}
              instanceId={instanceId}
              settings={gs}
              masterOpacity={masterOpacity}
              index={i}
              motion={motion}
              baseSize={baseSize}
              strokeModeMap={strokeModeMap}
              liveScaleSV={liveScaleSV}
              reducedEffects={isHomeQuality}
              allowDecorativeEffects={!isHomeQuality || i >= active.length - 2}
              allowMotionEffects={!isHomeQuality || i === active.length - 1}
            />
          );
        })}
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "visible",
  },
  containerBg: {
    backgroundColor: "transparent",
  },
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
