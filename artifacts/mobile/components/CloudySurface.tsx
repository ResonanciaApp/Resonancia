import { getThemeStyleId } from "@/config/scene-themes";
import React, { forwardRef, useMemo } from "react";
import { StyleSheet } from "react-native";
import { useSceneThemeOptional } from "@/context/SceneThemeContext";
import { resolveCloudySurfaceStyle } from "@/lib/cloudy-surface-style";

const STYLE_PROPS = [
  "style",
  "contentContainerStyle",
  "ListHeaderComponentStyle",
  "ListFooterComponentStyle",
  "columnWrapperStyle",
  "imageStyle",
] as const;

/**
 * Inserted at styled JSX boundaries by the app-scoped Babel plugin.
 * It keeps the original component, ref, events and children, and subscribes
 * even otherwise-static cards/controls to theme changes without remounting.
 */
export const CloudySurface = forwardRef<any, {
  __surfaceComponent: React.ElementType;
  [prop: string]: any;
}>(function CloudySurface({ __surfaceComponent: Component, ...props }, ref) {
  const cloudy = getThemeStyleId(useSceneThemeOptional()?.activeSceneId) === "cloudy";
  const themedStyles = useMemo(() => {
    if (!cloudy) return {};
    const result: Record<string, any> = {};
    for (const key of STYLE_PROPS) {
      if (props[key] !== undefined) {
        result[key] = resolveCloudySurfaceStyle(props[key], true, StyleSheet.flatten);
      }
    }
    return result;
  }, [
    cloudy, props.style, props.contentContainerStyle, props.ListHeaderComponentStyle,
    props.ListFooterComponentStyle, props.columnWrapperStyle, props.imageStyle,
  ]);
  return React.createElement(Component, { ...props, ...themedStyles, ref });
});