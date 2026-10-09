import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

// Same fill and fade as the Premium trial plans (app/membresia.tsx AnimatedPlanSelection).
export const TAB_FILL_FADE = {
  duration: 400,
  easing: Easing.inOut(Easing.cubic),
  useNativeDriver: true,
} as const;

export const ReflectionCategoryTabFill = React.memo(function ReflectionCategoryTabFill({
  selected,
  reduceMotion = false,
}: { selected: boolean; reduceMotion?: boolean }) {
  const opacity = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(selected ? 1 : 0);
      return;
    }
    const animation = Animated.timing(opacity, { toValue: selected ? 1 : 0, ...TAB_FILL_FADE });
    animation.start();
    return () => animation.stop();
  }, [opacity, selected, reduceMotion]);

  return (
    <View pointerEvents="none" style={styles.clip}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tint]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
        <BlurView
          intensity={38}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.tintSelected]} />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  clip: { ...StyleSheet.absoluteFillObject, borderRadius: 999, overflow: "hidden" },
  tint: { backgroundColor: "rgba(255,255,255,0.10)" },
  tintSelected: { backgroundColor: "rgba(107,80,210,0.60)" },
});
