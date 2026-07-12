/**
 * SceneAnimationInline — renderiza una escena Geometrix animada inline
 * (sin modal), en un View de altura fija. Se usa en el header de Inicio
 * entre el logo y "Tu progreso semanal".
 */
import React, { useEffect, useRef } from "react";
import { Animated, Easing as RNEasing, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import RAnimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { SacredGlyph } from "@/components/SacredGlyph";
import { bgGradientColors, gradientColors, type GeoSettings } from "@/data/geometrix-creations";
import { baseOf } from "@/data/geometries";
import type { SceneAnimation } from "@workspace/api-client-react";

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

function AnimatedLayer({
  instanceId,
  settings,
  masterOpacity,
  index,
  motion,
  size,
}: {
  instanceId: string;
  settings: GeoSettings;
  masterOpacity: number;
  index: number;
  motion: boolean;
  size: number;
}) {
  const rot = useSharedValue(0);
  const { rotate, rotateLeft, rotateSpeed, breatheAmount, thickness, zoom, scale } = settings;
  const safeSpeed = Number.isFinite(rotateSpeed) ? Math.max(0, Math.min(1, rotateSpeed)) : 0.5;
  const spinDuration = ((38000 + index * 6000) / (0.5 + safeSpeed * 2.5)) * 1.6;
  const dir = rotateLeft ? -1 : 1;
  const spin = (rotate || rotateLeft) && motion;
  const safeAmount = Number.isFinite(breatheAmount) ? Math.max(0, Math.min(1, breatheAmount)) : 0;
  const breatheDepth = 0.04 + safeAmount * 0.18;
  const pulse = useSharedValue(0);
  // Replica la fórmula exacta de GeometryLayerInner:
  //   base1px = 100 / effectiveSize  (el viewBox es 0–100, así que 1px real = 100/size)
  //   sw = base1px × (1 + thickness × 5)
  // Esto hace que el trazo sea proporcional al tamaño real del glifo (zoom × scale),
  // igual que en el editor. La fórmula anterior (1 + thickness × 2) ignoraba zoom/scale
  // y producía trazos gruesos cuando la geometría es grande.
  const safeThickness = Number.isFinite(thickness) ? Math.max(0, Math.min(1, thickness)) : 0;
  const safeZoom = Number.isFinite(zoom) ? Math.max(0.1, zoom) : 1;
  const userScale = Number.isFinite(scale) ? Math.max(0.1, scale) : 1;
  const committedMag = userScale * safeZoom;
  const effectiveSize = size * committedMag;
  const base1px = effectiveSize > 0 ? 100 / effectiveSize : 1;
  const sw = base1px * (1 + safeThickness * 5);

  useEffect(() => {
    if (!spin) {
      cancelAnimation(rot);
      rot.value = withTiming(0, { duration: 400 });
      return;
    }
    rot.value = withRepeat(
      withTiming(1, { duration: spinDuration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rot);
  }, [spin, spinDuration, rot]);

  useEffect(() => {
    if (safeAmount > 0 && motion) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 400 });
    }
    return () => cancelAnimation(pulse);
  }, [safeAmount, motion, index, pulse]);

  const grad = gradientColors(settings.gradientId);
  const baseOpacity = Math.max(0.15, settings.opacity * masterOpacity);

  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rot.value * 360 * dir}deg` },
      { scale: safeAmount > 0 ? 1 - breatheDepth + pulse.value * breatheDepth : 1 },
    ],
    opacity: baseOpacity,
  }));

  return (
    <RAnimated.View style={[StyleSheet.absoluteFill, s.center, aStyle]} pointerEvents="none">
      <SacredGlyph
        id={baseOf(instanceId)}
        color={settings.color}
        gradient={grad}
        size={size}
        strokeWidth={sw}
      />
    </RAnimated.View>
  );
}

interface Props {
  scene: SceneAnimation | null;
  height: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function SceneAnimationInline({ scene, height, onPress, style }: Props) {
  const fadeAnim = useRef(new Animated.Value(scene ? 0 : 1)).current;
  const prevSceneId = useRef<number | null>(null);

  useEffect(() => {
    if (!scene) return;
    if (scene.id === prevSceneId.current) return;
    prevSceneId.current = scene.id;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      easing: RNEasing.out(RNEasing.cubic),
      useNativeDriver: true,
    }).start();
  }, [scene?.id]);

  if (!scene) return <View style={[{ height }, style]} />;

  const recipe = scene.recipe as SceneRecipe;
  const active = recipe.active ?? [];
  const settings = recipe.settings ?? {};
  const master = recipe.master ?? {};
  const masterOpacity = master.opacity ?? 1;
  const motion = master.motion !== false;
  const glyphSize = height * 1.15;

  const bgGrad = bgGradientColors(master.bgGradientId ?? null);
  const hasBg = !!(master.bgColor || bgGrad);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      <Pressable
        onPress={onPress}
        style={[s.container, { height }, hasBg && s.containerBg]}
      >
        {active.map((instanceId, i) => {
          const gs = settings[instanceId];
          if (!gs) return null;
          return (
            <AnimatedLayer
              key={instanceId}
              instanceId={instanceId}
              settings={gs}
              masterOpacity={masterOpacity}
              index={i}
              motion={motion}
              size={glyphSize}
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
    overflow: "hidden",
  },
  containerBg: {
    backgroundColor: "transparent",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});
