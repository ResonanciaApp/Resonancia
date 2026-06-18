import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SacredGlyph } from "@/components/SacredGlyph";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import { baseOf, type GeometryId } from "@/data/geometries";
import {
  bgGradientColors,
  brightnessFactor,
  gradientColors,
  scaleColors,
  scaleHex,
  HOME_GRADIENT,
  type GeometrixCreation,
} from "@/data/geometrix-creations";

function CreationPreviewContent({ c, size }: { c: GeometrixCreation; size: number }) {
  const bgFactor = brightnessFactor(c.master.bgBrightness);
  const bgGrad = bgGradientColors(c.master.bgGradientId ?? null);
  const bgColors = c.master.bgColor
    ? ([scaleHex(c.master.bgColor, bgFactor), scaleHex(c.master.bgColor, bgFactor)] as readonly [string, string])
    : scaleColors(bgGrad ?? HOME_GRADIENT, bgFactor);
  return (
    <View style={{ width: size, height: size, overflow: "hidden" }}>
      <LinearGradient
        colors={bgColors as readonly [string, string, ...string[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
        {c.active.map((id) => {
          const s = c.settings[id];
          if (!s) return null;
          const baseOpacity = Math.max(0.15, s.opacity * c.master.opacity);
          return (
            <View
              key={id}
              style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", opacity: baseOpacity }]}
            >
              <SacredGlyph
                id={baseOf(id) as GeometryId}
                color={s.color}
                gradient={gradientColors(s.gradientId)}
                size={size * 0.78}
                strokeWidth={1 + s.thickness * 2}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Busca la creación por ID dentro del hook (uso normal). */
export function CreationCoverPreview({ creationId, size }: { creationId: string; size: number }) {
  const { creations } = useGeometrixCreations();
  const c = creations.find((x) => x.id === creationId);
  if (!c) return null;
  return <CreationPreviewContent c={c} size={size} />;
}

/** Acepta la creación directamente como prop — para presets hardcodeados que no están en AsyncStorage. */
export function CreationCoverPreviewDirect({ creation, size }: { creation: GeometrixCreation; size: number }) {
  return <CreationPreviewContent c={creation} size={size} />;
}
