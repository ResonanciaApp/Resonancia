import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";

// Premium trial selection fade, with Pleyades' category-colored tab fills.
export const TAB_FILL_FADE = {
  duration: 400,
  easing: Easing.inOut(Easing.cubic),
  useNativeDriver: true,
} as const;

export const ReflectionCategoryTabFill = React.memo(function ReflectionCategoryTabFill({
  selected,
  color,
  reduceMotion = false,
}: { selected: boolean; color: string; reduceMotion?: boolean }) {
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
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          backgroundColor: "#FFFFFF",
          opacity: opacity.interpolate({ inputRange: [0, 1], outputRange: [0.07, 0] }),
        }]}
      />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
        <BlurView
          intensity={38}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.tintSelected, { backgroundColor: color }]} />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  clip: { ...StyleSheet.absoluteFillObject, borderRadius: 999, overflow: "hidden" },
  tintSelected: { opacity: 0.12 },
});
