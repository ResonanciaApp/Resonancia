import React, { useEffect } from "react";
import { StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { reflectionGalleryScrollIndicator } from "@/lib/reflection-gallery-layout";

/** Shows while the list actually moves, including momentum and programmatic scroll. */
export function useScrollProgress(visible: boolean) {
  const offset = useSharedValue(0);
  const viewport = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const activity = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(activity);
    cancelAnimation(opacity);
    activity.value = 0;
    opacity.value = 0;
    offset.value = 0;
    return () => {
      cancelAnimation(activity);
      cancelAnimation(opacity);
    };
  }, [visible, activity, opacity, offset]);

  useAnimatedReaction(
    () => activity.value,
    (active, previous) => {
      if (active === previous) return;
      opacity.value = withTiming(active, {
        duration: active ? 160 : 240,
        reduceMotion: ReduceMotion.System,
      });
    },
  );
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (event.contentOffset.y === offset.value) return;
      offset.value = event.contentOffset.y;
      cancelAnimation(activity);
      activity.value = 1;
      activity.value = withDelay(120, withTiming(0, {
        duration: 0,
        reduceMotion: ReduceMotion.System,
      }), ReduceMotion.Never);
    },
    onMomentumEnd: () => {
      cancelAnimation(activity);
      activity.value = 0;
    },
  });
  const trackStyle = useAnimatedStyle(() => ({
    opacity: contentHeight.value > viewport.value ? opacity.value : 0,
  }));
  const thumbStyle = useAnimatedStyle(() => {
    const indicator = reflectionGalleryScrollIndicator(viewport.value, contentHeight.value, offset.value);
    return { height: indicator.height, transform: [{ translateY: indicator.translateY }] };
  });
  return {
    onScroll,
    onLayout: (event: LayoutChangeEvent) => { viewport.value = event.nativeEvent.layout.height; },
    onContentSizeChange: (_width: number, height: number) => { contentHeight.value = height; },
    trackStyle,
    thumbStyle,
  };
}

export function ScrollProgressIndicator({ progress }: { progress: ReturnType<typeof useScrollProgress> }) {
  return (
    <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[styles.track, progress.trackStyle]}>
      <Animated.View style={[styles.thumb, progress.thumbStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: "absolute", top: 0, bottom: 0, right: -6, width: 3, borderRadius: 2,
    backgroundColor: "rgba(249,249,249,0.13)", overflow: "hidden",
  },
  thumb: { width: 3, borderRadius: 2, backgroundColor: "rgba(249,249,249,0.75)" },
});
