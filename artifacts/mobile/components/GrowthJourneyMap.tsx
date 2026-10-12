import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { GrowthLevelImage, RewardLock } from "@/components/GrowthJourney";
import { getThemeStyleId } from "@/config/scene-themes";
import { CLOUDY_GROWTH_STAGE_LABEL_COLOR, POSITIONED_DAY_GRADIENT } from "@/constants/colors";
import { useGrowth } from "@/context/GrowthContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { resolveAvatarUrl } from "@/lib/avatar";
import { GROWTH_WORLD_TEMPLATES, INITIAL_GROWTH_WORLDS } from "@/utils/growthWorlds";

// Fixed editorial overview: only the first stop is available.
const ACTIVE = 93;
const LOCKED = 52;
const LABEL_W = 104;
const LOCKED_ART: Record<string, number> = {
  florecimiento: require("../assets/images/growth/08-expansion.png"),
  ascenso: require("../assets/images/growth/map-ascenso.webp"),
  iluminacion: require("../assets/images/growth/map-iluminacion.webp"),
  llegada: require("../assets/images/growth/map-llegada.webp"),
  despertar: require("../assets/images/growth/map-despertar.webp"),
};

export const GROWTH_MAP_HEIGHT = 350;

export function GrowthJourneyMap({ width }: { width: number }) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const worldColor = theme.id === "galactic" ? "#BEDFF5" : theme.id === "fuego" ? "#FFD6BF" : theme.id === "natural" ? "#E5FFDB"
    : getThemeStyleId(theme.id) === "cloudy" ? CLOUDY_GROWTH_STAGE_LABEL_COLOR
    : POSITIONED_DAY_GRADIENT[0];
  const { worlds = INITIAL_GROWTH_WORLDS } = useGrowth();
  const stops = [...worlds, ...GROWTH_WORLD_TEMPLATES.filter(template => !worlds.some(world => world.id === template.id))].slice(0, 5);
  const h = GROWTH_MAP_HEIGHT;
  const center = { x: width / 2, y: h / 2 };
  // Equal radii and 72-degree spacing; leave room for images and labels.
  const radius = Math.min(width / 2 - LABEL_W / 2 - 4, 120) + 5;
  const pts = stops.map((_, i) => {
    const angle = -Math.PI / 2 + i * (2 * Math.PI / stops.length);
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
      {stops.map((s, i) => {
        const active = i === 0;
        const stopId = s.id === "florecimiento" ? "floracion" : s.id;
        const bundled = GROWTH_WORLD_TEMPLATES.find(template => template.id === s.id && template.coverUrl === s.coverUrl);
        const cover = bundled ? LOCKED_ART[s.id] : s.coverUrl;
        const size = active ? ACTIVE : LOCKED;
        const cx = pts[i].x, cy = pts[i].y;
        const labelWidth = active ? Math.min(164, width) : LABEL_W;
        const left = cx - labelWidth / 2;
        return (
          <View
            key={s.id}
            testID={`growth-map-stop-${stopId}`}
            accessible
            accessibilityLabel={`${i + 1}. ${s.name}${active ? ", Primer mundo" : ""}, ${active ? "disponible" : "no disponible"}`}
            accessibilityState={{ disabled: !active, selected: active }}
            style={{ position: "absolute", left, top: cy - size / 2, width: labelWidth, alignItems: "center" }}
          >
            <View
              testID={`growth-map-node-${stopId}`}
              style={[
                styles.node,
                { width: size, height: size, borderRadius: size / 2 },
                !active && styles.lockedNode,
              ]}
            >
              {active ? (
                <GrowthLevelImage level={{ id: `world-cover-${s.id}`, group: s.id, name: s.name, story: "", startDay: 0, endDay: 0, image: cover }} size={size - 4} />
              ) : (
                <View testID={`growth-map-image-frame-${s.id}`} style={styles.lockedImageFrame}>
                  <Image
                    testID={`growth-map-image-${s.id}`}
                    source={typeof cover === "string" ? { uri: resolveAvatarUrl(cover) ?? cover } : cover}
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
                    <RewardLock levelId={`growth-map-${s.id}`} color="#F9F9F9" size={16} />
                  </View>
                </View>
              )}
            </View>
            <Text
              testID={`growth-map-label-${stopId}`}
              style={[styles.label, active && styles.bloomLabel, { color: active ? colors.foreground : colors.mutedForeground, opacity: active ? 1 : 0.7 }]}
              numberOfLines={2}
            >
              {s.name}
            </Text>
            {active && (
              <Text testID="growth-map-world-floracion" style={[styles.worldLabel, { color: worldColor }]}>
                PRIMER MUNDO
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  node: { alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 0 },
  lockedNode: { backgroundColor: "transparent" },
  lockedImageFrame: { width: LOCKED - 4, height: LOCKED - 4, borderRadius: (LOCKED - 4) / 2, overflow: "hidden" },
  lockedImage: { width: "100%", height: "100%" },
  imageOverlay: { backgroundColor: "rgba(0,0,0,0.4)" },
  lockOverlay: { alignItems: "center", justifyContent: "center" },
  label: { marginTop: 6, fontFamily: "Manrope", fontSize: 11, lineHeight: 16, fontWeight: "700", textAlign: "center" },
  bloomLabel: { fontSize: 16, lineHeight: 20 },
  worldLabel: { marginTop: 2, fontFamily: "Manrope", fontSize: 10, lineHeight: 16, fontWeight: "700", textAlign: "center" },
});
