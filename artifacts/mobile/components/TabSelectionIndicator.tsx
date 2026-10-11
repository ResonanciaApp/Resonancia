import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Reanimated, { ReduceMotion, useAnimatedReaction, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { TAB_PILL_BAR_H } from "@/constants/tab-bar";
import { TAB_ROW_PADDING, TAB_SELECTION_BACKGROUND, TAB_SELECTION_HEIGHT, TAB_SELECTION_INSET, tabSelectionSpring } from "@/constants/tab-selection";

/** One persistent capsule. Its position and spring run exclusively on the UI thread. */
export function TabSelectionIndicator({ width, count, index }: {
  width: number;
  count: number;
  index: number;
}) {
  const metrics = useSharedValue({ width, count, index });
  const x = useSharedValue(0);
  useEffect(() => { metrics.value = { width, count, index }; }, [width, count, index, metrics]);

  useAnimatedReaction(
    () => metrics.value,
    (next, previous) => {
      if (next.width <= 0 || next.count <= 0 || next.index < 0) return;
      const slot = (next.width - TAB_ROW_PADDING * 2) / next.count;
      const target = next.index * slot;
      if (!previous || previous.width <= 0 || previous.width !== next.width || previous.count !== next.count) {
        x.value = target;
        return;
      }
      // A new destination starts from the actual in-flight position, not the old tab.
      const distance = Math.abs(target - x.value) / slot;
      x.value = withSpring(target, { ...tabSelectionSpring(distance), reduceMotion: ReduceMotion.System });
    },
  );
  const style = useAnimatedStyle(() => ({
    width: metrics.value.count > 0
      ? Math.max(0, (metrics.value.width - TAB_ROW_PADDING * 2) / metrics.value.count - TAB_SELECTION_INSET * 2)
      : 0,
    opacity: metrics.value.width > 0 && metrics.value.index >= 0 ? 1 : 0,
    transform: [{ translateX: x.value }],
  }));
  return <Reanimated.View pointerEvents="none" testID="tab-selection-indicator" style={[styles.capsule, style]} />;
}

const styles = StyleSheet.create({
  capsule: {
    position: "absolute",
    left: TAB_ROW_PADDING + TAB_SELECTION_INSET,
    top: (TAB_PILL_BAR_H - TAB_SELECTION_HEIGHT) / 2 - 1,
    height: TAB_SELECTION_HEIGHT,
    borderRadius: TAB_SELECTION_HEIGHT / 2,
    backgroundColor: TAB_SELECTION_BACKGROUND,
  },
});
