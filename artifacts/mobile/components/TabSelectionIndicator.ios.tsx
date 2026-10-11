import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, StyleSheet } from "react-native";
import { TAB_PILL_BAR_H } from "@/constants/tab-bar";
import {
  TAB_ROW_PADDING, TAB_SELECTION_BACKGROUND, TAB_SELECTION_HEIGHT,
  TAB_SELECTION_INSET, tabSelectionSpring, tabSelectionTranslation,
} from "@/constants/tab-selection";

/** iOS: native Animated transforms avoid Reanimated's Fabric commit-pausing path. */
export function TabSelectionIndicator({ width, count, index, barHeight = TAB_PILL_BAR_H }: {
  width: number;
  count: number;
  index: number;
  barHeight?: number;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const previous = useRef<{ width: number; count: number } | null>(null);
  const generation = useRef(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const slot = count > 0 ? Math.max(0, (width - TAB_ROW_PADDING * 2) / count) : 0;

  useEffect(() => {
    let alive = true;
    let receivedEvent = false;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", value => {
      receivedEvent = true;
      setReduceMotion(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (alive && !receivedEvent) setReduceMotion(value);
    }).catch(() => {});
    return () => { alive = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    const version = ++generation.current;
    if (width <= 0 || count <= 0 || index < 0 || slot <= 0) return;
    const target = index * slot;
    const resized = !previous.current || previous.current.width !== width || previous.current.count !== count;
    previous.current = { width, count };
    if (resized || reduceMotion) {
      x.stopAnimation();
      x.setValue(target);
    } else {
      // Read the native in-flight position, not the last destination or a JS listener.
      x.stopAnimation(position => {
        if (generation.current !== version) return;
        const visible = tabSelectionTranslation(position, slot, count);
        const pixels = Math.abs(target - visible);
        Animated.spring(x, {
          toValue: target,
          ...tabSelectionSpring(pixels / slot, pixels),
          useNativeDriver: true,
          isInteraction: false,
        }).start();
      });
    }
    return () => { ++generation.current; x.stopAnimation(); };
  }, [width, count, index, slot, reduceMotion, x]);

  // Native interpolation approximates the existing soft edge limit. The entire
  // path between tabs is exactly linear; no JS callback runs during movement.
  const translation = useMemo(() => {
    const last = Math.max(0, count - 1) * slot;
    const samples = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 12, 20, 10000];
    const inputRange = [
      ...samples.slice().reverse().map(value => -value),
      0,
      ...(last > 0 ? [last] : []),
      ...samples.map(value => last + value),
    ];
    return x.interpolate({
      inputRange,
      outputRange: inputRange.map(value => tabSelectionTranslation(value, slot, count)),
      extrapolate: "clamp",
    });
  }, [x, slot, count]);

  return (
    <Animated.View
      pointerEvents="none"
      testID="tab-selection-indicator"
      style={[
        styles.capsule,
        {
          top: (barHeight - TAB_SELECTION_HEIGHT) / 2 - 1,
          width: count > 0 ? Math.max(0, slot - TAB_SELECTION_INSET * 2) : 0,
          opacity: width > 0 && index >= 0 ? 1 : 0,
          transform: [{ translateX: translation }],
        },
      ]}
    />
  );
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
