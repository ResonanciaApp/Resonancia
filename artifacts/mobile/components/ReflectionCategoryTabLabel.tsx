import React from "react";
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";

import { DiscoverSearchBorder } from "@/components/DiscoverSearchBorder";
import {
  REFLECTION_WALL_BORDER_GRADIENT,
  REFLECTION_WALL_BORDER_START,
  REFLECTION_WALL_BORDER_END,
  REFLECTION_WALL_BORDER_BRIGHTNESS,
} from "@/constants/reflectionWallBorder";

export const ReflectionCategoryTabBorder = React.memo(function ReflectionCategoryTabBorder({
  color, borderWidth = 1, opacity = 1, inset = 0,
}: { color?: string; borderWidth?: number; opacity?: number; inset?: number }) {
  if (color) return <View pointerEvents="none" style={[styles.categoryBorder, { borderColor: color, borderWidth, opacity, top: inset, right: inset, bottom: inset, left: inset }]} />;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity }]}>
    <DiscoverSearchBorder
      borderRadius={999}
      borderWidth={borderWidth}
      brightness={REFLECTION_WALL_BORDER_BRIGHTNESS}
      colors={REFLECTION_WALL_BORDER_GRADIENT}
      start={REFLECTION_WALL_BORDER_START}
      end={REFLECTION_WALL_BORDER_END}
    />
    </View>
  );
});

export const ReflectionCategoryTabLabel = React.memo(function ReflectionCategoryTabLabel({
  label,
  selected,
  textStyle,
}: {
  label: string;
  selected: boolean;
  textStyle: StyleProp<TextStyle>;
}) {
  const color = selected ? "#FFFFFF" : "#E0E0E0";

  return (
    <View pointerEvents="none">
      <Text
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[textStyle, styles.widthReserve]}
      >
        {label}
      </Text>
      <View style={styles.visibleLayer} pointerEvents="none">
        <Text style={[textStyle, styles.visibleText, { color, fontWeight: selected ? "700" : "500" }]}>
          {label}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  categoryBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 999, borderWidth: 1 },
  widthReserve: { color: "transparent", fontWeight: "700" },
  visibleLayer: { ...StyleSheet.absoluteFillObject, justifyContent: "center" },
  visibleText: { textAlign: "center" },
});