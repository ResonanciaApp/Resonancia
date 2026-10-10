import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { GrowthLevelImage, RewardLock } from "@/components/GrowthJourney";
import { getPositionedDayGradient } from "@/components/StreakWeekRow";
import { useGrowth } from "@/context/GrowthContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { allGrowthLevels, type GrowthLevel } from "@/data/growthLevels";

// Fixed editorial overview: only the first stop is available.
const STOPS = [
  { id: "floracion", label: "Floración" },
  { id: "ascenso", label: "El ascenso" },
  { id: "iluminacion", label: "Iluminación" },
  { id: "llegada", label: "La llegada" },
  { id: "despertar", label: "El Gran Despertar" },
] as const;

const ACTIVE = 93;
const LOCKED = 52;
const LABEL_W = 104;
const LOCKED_ART: Record<string, number> = {
  ascenso: require("../assets/images/growth/map-ascenso.webp"),
  iluminacion: require("../assets/images/growth/map-iluminacion.webp"),
  llegada: require("../assets/images/growth/map-llegada.webp"),
  despertar: require("../assets/images/growth/map-despertar.webp"),
};

export const GROWTH_MAP_HEIGHT = 350;

export function GrowthJourneyMap({ width }: { width: number }) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const lockColor = getPositionedDayGradient(theme.gradient)[0];
  const { levels } = useGrowth();
  const bloom = levels.filter((l) => l.group === "florecimiento");
  const last: GrowthLevel | undefined = bloom[bloom.length - 1]
    ?? allGrowthLevels.find((l) => l.id === "expansion");
  const h = GROWTH_MAP_HEIGHT;
  const center = { x: width / 2, y: h / 2 };
  // Equal radii and 72-degree spacing; leave room for images and labels.
  const radius = Math.min(width / 2 - LABEL_W / 2 - 4, 120);
  const pts = STOPS.map((_, i) => {
    const angle = -Math.PI / 2 + i * (2 * Math.PI / STOPS.length);
    return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
  });
  // Follow the same circle clockwise, stopping at El Gran Despertar.
  // No closing arc back to Floración.
  const route = pts.map((point, i) => i === 0
    ? `M${point.x} ${point.y}`
    : `A${radius} ${radius} 0 0 1 ${point.x} ${point.y}`).join(" ");

  return (
    <View style={{ width, height: h }} testID="growth-journey-map">
      <Svg width={width} height={h} style={StyleSheet.absoluteFill} pointerEvents="none" testID="growth-journey-map-route">
        <Path d={route} stroke={colors.mutedForeground} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="2 8" strokeLinecap="round" fill="none" />
      </Svg>
      {STOPS.map((s, i) => {
        const active = i === 0;
        const size = active ? ACTIVE : LOCKED;
        const cx = pts[i].x, cy = pts[i].y;
        const left = cx - LABEL_W / 2;
        return (
          <View
            key={s.id}
            testID={`growth-map-stop-${s.id}`}
            accessible
            accessibilityLabel={`${i + 1}. ${s.label}, ${active ? "disponible" : "no disponible"}`}
            accessibilityState={{ disabled: !active, selected: active }}
            style={{ position: "absolute", left, top: cy - size / 2, width: LABEL_W, alignItems: "center" }}
          >
            <View
              testID={`growth-map-node-${s.id}`}
              style={[
                styles.node,
                { width: size, height: size, borderRadius: size / 2 },
                !active && styles.lockedNode,
              ]}
            >
              {active && last ? (
                <GrowthLevelImage level={last} size={size - 4} />
              ) : (
                <View testID={`growth-map-image-frame-${s.id}`} style={styles.lockedImageFrame}>
                  <Image
                    testID={`growth-map-image-${s.id}`}
                    source={LOCKED_ART[s.id]}
                    resizeMode="cover"
                    style={styles.lockedImage}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  />
                  <View
                    testID={`growth-map-image-overlay-${s.id}`}
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, styles.imageOverlay]}
                  />
                  <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.lockOverlay]}>
                    <RewardLock levelId={`growth-map-${s.id}`} color={lockColor} size={14} />
                  </View>
                </View>
              )}
            </View>
            <Text
              testID={`growth-map-label-${s.id}`}
              style={[styles.label, { color: active ? colors.foreground : colors.mutedForeground, opacity: active ? 1 : 0.7 }]}
              numberOfLines={2}
            >
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  node: { alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 0 },
  lockedNode: { backgroundColor: "rgba(0,0,0,0.16)" },
  lockedImageFrame: { width: LOCKED - 4, height: LOCKED - 4, borderRadius: (LOCKED - 4) / 2, overflow: "hidden" },
  lockedImage: { width: "100%", height: "100%" },
  imageOverlay: { backgroundColor: "rgba(255,255,255,0.5)" },
  lockOverlay: { alignItems: "center", justifyContent: "center" },
  label: { marginTop: 6, fontFamily: "Manrope", fontSize: 11, lineHeight: 16, fontWeight: "700", textAlign: "center" },
});
