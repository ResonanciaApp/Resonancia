import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { GrowthLevelImage, RewardLock } from "@/components/GrowthJourney";
import { getPositionedDayGradient } from "@/components/StreakWeekRow";
import { useGrowth } from "@/context/GrowthContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { allGrowthLevels, type GrowthLevel } from "@/data/growthLevels";

// Fixed editorial overview: only the first stop is available.
const STOPS = [
  { id: "floracion", label: "Floración", x: 0.27, y: 0.2 },
  { id: "ascenso", label: "El ascenso", x: 0.75, y: 0.13 },
  { id: "iluminacion", label: "Iluminación", x: 0.79, y: 0.5 },
  { id: "llegada", label: "La llegada", x: 0.5, y: 0.72 },
  { id: "despertar", label: "El Gran Despertar", x: 0.22, y: 0.52 },
] as const;

const ACTIVE = 76;
const LOCKED = 46;
const LABEL_W = 104;

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
  const pts = STOPS.map((s) => ({ x: s.x * width, y: s.y * h }));
  // Catmull-Rom to cubic Bezier: every segment ends exactly at a stop center.
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
    d += ` C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`;
  }

  return (
    <View style={{ width, height: h }} testID="growth-journey-map">
      <Svg width={width} height={h} style={StyleSheet.absoluteFill} pointerEvents="none" testID="growth-journey-map-route">
        <Path d={d} stroke={colors.mutedForeground} strokeOpacity={0.55} strokeWidth={2} strokeDasharray="2 8" strokeLinecap="round" fill="none" />
      </Svg>
      {STOPS.map((s, i) => {
        const active = i === 0;
        const size = active ? ACTIVE : LOCKED;
        const cx = pts[i].x, cy = pts[i].y;
        const left = Math.min(Math.max(cx - LABEL_W / 2, 4), width - LABEL_W - 4);
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
                <RewardLock levelId={`growth-map-${s.id}`} color={lockColor} />
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
  label: { marginTop: 6, fontFamily: "Manrope", fontSize: 11, lineHeight: 16, fontWeight: "700", textAlign: "center" },
});
