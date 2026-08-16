/**
 * SceneAnimationModal — visualizador fullscreen de escenas animadas Geometrix.
 * Muestra las capas de la composición con giro suave (igual que en el editor)
 * + fondo del maestro + botón para explorar en Geometrix.
 */
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import RAnimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredGlyph } from "@/components/SacredGlyph";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { bgGradientColors, gradientColors, type GeoSettings } from "@/data/geometrix-creations";
import { baseOf } from "@/data/geometries";
import type { SceneAnimation } from "@workspace/api-client-react";

const { width: SCREEN_W } = Dimensions.get("window");

type SceneRecipe = {
  active?: string[];
  master?: {
    opacity?: number;
    motion?: boolean;
    bgColor?: string | null;
    bgGradientId?: string | null;
    bgBrightness?: number;
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
  const { rotate, rotateLeft, rotateSpeed, breatheAmount } = settings;
  const safeSpeed = Number.isFinite(rotateSpeed) ? Math.max(0, Math.min(1, rotateSpeed)) : 0.5;
  const spinDuration = ((38000 + index * 6000) / (0.5 + safeSpeed * 2.5)) * 1.6;
  const dir = rotateLeft ? -1 : 1;
  const spin = (rotate || rotateLeft) && motion;
  const safeAmount = Number.isFinite(breatheAmount) ? Math.max(0, Math.min(1, breatheAmount)) : 0;
  const breatheDepth = 0.04 + safeAmount * 0.18;
  const pulse = useSharedValue(0);

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

  const baseOpacity = Math.max(0.15, settings.opacity * masterOpacity);
  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rot.value * 360 * dir}deg` },
      { scale: safeAmount > 0 ? 1 - breatheDepth + pulse.value * breatheDepth : 1 },
    ],
    opacity: baseOpacity,
  }));

  const grad = gradientColors(settings.gradientId);

  return (
    <RAnimated.View style={[StyleSheet.absoluteFill, s.center, aStyle]} pointerEvents="none">
      <SacredGlyph
        id={baseOf(instanceId)}
        color={settings.color}
        gradient={grad}
        size={size}
        strokeWidth={1 + settings.thickness * 2}
      />
    </RAnimated.View>
  );
}

interface Props {
  scene: SceneAnimation | null;
  onClose: () => void;
}

export function SceneAnimationModal({ scene, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { openGeometrix } = useGeometrixPanel();

  if (!scene) return null;

  const recipe = scene.recipe as SceneRecipe;
  const active = recipe.active ?? [];
  const settings = recipe.settings ?? {};
  const master = recipe.master ?? {};
  const masterOpacity = master.opacity ?? 1;
  const motion = master.motion !== false;

  const bgGrad = bgGradientColors(master.bgGradientId ?? null);
  const bgColors: [string, string, ...string[]] = master.bgColor
    ? [master.bgColor, master.bgColor]
    : bgGrad
    ? [...(bgGrad as [string, string])]
    : (theme.gradient as unknown as [string, string, ...string[]]);

  const glyphSize = SCREEN_W * 0.75;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <LinearGradient
          colors={bgColors}
          start={{ x: 0.4, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Capas animadas */}
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

        {active.length === 0 && (
          <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
            <Text style={s.emptyText}>✦</Text>
          </View>
        )}

        {/* Header */}
        <View style={[s.header, { paddingTop: Math.max(insets.top, 20) + 8 }]}>
          <Pressable onPress={onClose} hitSlop={14} style={s.closeBtn}>
            <Feather name="x" size={22} color="#fff" />
          </Pressable>
          <Text style={s.title} numberOfLines={1}>
            {scene.name}
          </Text>
          {scene.isPremium && <Text style={{ fontSize: 14 }}>👑</Text>}
        </View>

        {/* Frase / descripción */}
        {!!(scene.phrase ?? scene.description) && (
          <View style={[s.descWrap, { top: Math.max(insets.top, 20) + 68 }]}>
            <Text style={s.desc} numberOfLines={2}>
              {scene.phrase ?? scene.description}
            </Text>
          </View>
        )}

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            s.cta,
            { bottom: insets.bottom + 32, opacity: pressed ? 0.82 : 1 },
          ]}
          onPress={() => {
            onClose();
            openGeometrix();
          }}
        >
          <Feather name="layers" size={16} color="#2D2D2D" style={{ marginRight: 8 }} />
          <Text style={s.ctaText}>Explorar en Geometrix</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1B060F" },
  center: { alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 48, color: "rgba(255,255,255,0.12)" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.40)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  descWrap: {
    position: "absolute",
    left: 24,
    right: 24,
    zIndex: 10,
  },
  desc: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 19,
    textAlign: "center",
  },
  cta: {
    position: "absolute",
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    paddingVertical: 17,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  ctaText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "#2D2D2D",
    letterSpacing: 0.1,
  },
});
