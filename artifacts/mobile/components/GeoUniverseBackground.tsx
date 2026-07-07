import React from "react";
import { StyleSheet, View } from "react-native";

import { SacredGlyph } from "@/components/SacredGlyph";
import { useGeoUniverse } from "@/context/GeoUniverseContext";
import { useSceneTheme } from "@/context/SceneThemeContext";

export function GeoUniverseBackground() {
  const { enabled } = useGeoUniverse();
  const { theme } = useSceneTheme();

  if (!enabled) return null;

  const color = theme.gradient[0];

  return (
    <View style={styles.root} pointerEvents="none">
      <View style={styles.topRight}>
        <SacredGlyph id="flor-vida" color={color} size={340} opacity={0.18} strokeScale={0.7} />
      </View>
      <View style={styles.bottomLeft}>
        <SacredGlyph id="metatron" color={color} size={290} opacity={0.14} strokeScale={0.7} />
      </View>
      <View style={styles.centerRight}>
        <SacredGlyph id="mandala" color={color} size={210} opacity={0.10} strokeScale={0.6} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  topRight: {
    position: "absolute",
    top: -70,
    right: -85,
  },
  bottomLeft: {
    position: "absolute",
    bottom: 100,
    left: -95,
  },
  centerRight: {
    position: "absolute",
    top: "38%",
    right: -50,
  },
});
