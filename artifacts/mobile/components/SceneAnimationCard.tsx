import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SacredGlyph } from "@/components/SacredGlyph";
import { gradientColors, type GeoSettings } from "@/data/geometrix-creations";
import { baseOf } from "@/data/geometries";
import type { SceneAnimation } from "@workspace/api-client-react";

type SceneRecipe = {
  active?: string[];
  master?: {
    opacity?: number;
    bgColor?: string | null;
    bgGradientId?: string | null;
  };
  settings?: Record<string, GeoSettings>;
};

interface Props {
  scene: SceneAnimation;
  size: number;
  onPress: () => void;
}

export function SceneAnimationCard({ scene, size, onPress }: Props) {
  const recipe = scene.recipe as SceneRecipe;
  const active = recipe.active ?? [];
  const settings = recipe.settings ?? {};
  const master = recipe.master ?? {};
  const masterOpacity = master.opacity ?? 1;

  const previewLayers = active.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.wrap,
        { width: size, height: Math.round(size * 1.32), opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={s.card}>
        {previewLayers.map((instanceId) => {
          const gs = settings[instanceId];
          if (!gs) return null;
          const grad = gradientColors(gs.gradientId);
          const opacity = Math.max(0.15, gs.opacity * masterOpacity);
          return (
            <View
              key={instanceId}
              style={[StyleSheet.absoluteFill, s.center]}
              pointerEvents="none"
            >
              <SacredGlyph
                id={baseOf(instanceId)}
                color={gs.color}
                gradient={grad}
                size={size * 0.7}
                strokeWidth={1 + gs.thickness * 2}
                opacity={opacity}
              />
            </View>
          );
        })}
        {previewLayers.length === 0 && (
          <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
            <Text style={s.emptyGlyph}>✦</Text>
          </View>
        )}
        {scene.isPremium && (
          <View style={s.crown}>
            <Text style={{ fontSize: 11 }}>👑</Text>
          </View>
        )}
      </View>
      <Text style={s.name} numberOfLines={2}>
        {scene.name}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center" },
  card: {
    width: "100%",
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  center: { alignItems: "center", justifyContent: "center" },
  emptyGlyph: { fontSize: 32, color: "rgba(255,255,255,0.15)" },
  crown: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    padding: 3,
  },
  name: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "#F4F4F4",
    marginTop: 9,
    textAlign: "center",
    paddingHorizontal: 2,
    lineHeight: 16,
  },
});
