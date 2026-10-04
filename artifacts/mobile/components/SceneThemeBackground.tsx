import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { blendThemePalette, SCENE_THEME_FADE_MS } from "@/lib/scene-theme-transition";

/** Crossfade background layers only. Content and text are never faded. */
export function SceneThemeBackground() {
  const { theme } = useSceneTheme();
  const [palette, setPalette] = useState(() => ({
    from: [...theme.gradient], to: [...theme.gradient],
  }));
  const paletteRef = useRef(palette);
  const opacity = useRef(new Animated.Value(1)).current;
  const generation = useRef(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const targetKey = theme.gradient.join(",");

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduceMotion(value);
    });
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { mounted = false; listener.remove(); };
  }, []);

  useEffect(() => {
    const token = ++generation.current;
    const target = targetKey.split(",");
    opacity.stopAnimation((visibleOpacity) => {
      if (generation.current !== token) return;
      const current = paletteRef.current;
      if (reduceMotion) {
        const next = { from: target, to: target };
        paletteRef.current = next;
        setPalette(next);
        opacity.setValue(1);
        return;
      }
      if (current.to.join(",") === targetKey && visibleOpacity === 1) return;
      const next = {
        from: blendThemePalette(current.from, current.to, visibleOpacity),
        to: target,
      };
      paletteRef.current = next;
      setPalette(next);
    });
    return () => {
      ++generation.current;
      opacity.stopAnimation();
    };
  }, [targetKey, reduceMotion, opacity]);

  // Reset opacity in the same commit as the new layers, not before they render.
  useLayoutEffect(() => {
    if (reduceMotion || palette.from.join(",") === palette.to.join(",")) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: SCENE_THEME_FADE_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [palette, reduceMotion, opacity]);

  const gradientProps = {
    locations: theme.gradientLocations,
    start: theme.gradientStart ?? { x: 0.5, y: 0 },
    end: theme.gradientEnd ?? { x: 0.5, y: 1 },
    style: StyleSheet.absoluteFill,
  };
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient {...gradientProps} colors={palette.from as [string, string, ...string[]]} />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <LinearGradient {...gradientProps} colors={palette.to as [string, string, ...string[]]} />
      </Animated.View>
    </View>
  );
}