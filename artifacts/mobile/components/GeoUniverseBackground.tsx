import React from "react";
import { StyleSheet, View } from "react-native";

import { SacredGlyph } from "@/components/SacredGlyph";
import { useGeoUniverse } from "@/context/GeoUniverseContext";

export function GeoUniverseBackground() {
  const { enabled } = useGeoUniverse();

  if (!enabled) return null;

  return (
    <View style={styles.root} pointerEvents="none">
      <View style={styles.topRight}>
        <SacredGlyph id="flor-vida" color="#FFFFFF" size={340} opacity={0.1} strokeScale={0.7} />
      </View>
      <View style={styles.bottomLeft}>
        <SacredGlyph id="metatron" color="#FFFFFF" size={290} opacity={0.1} strokeScale={0.7} />
      </View>
      <View style={styles.centerRight}>
        <SacredGlyph id="mandala" color="#FFFFFF" size={210} opacity={0.1} strokeScale={0.6} />
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
