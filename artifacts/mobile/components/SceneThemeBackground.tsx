import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SCENE_THEME_FADE_MS } from "@/lib/scene-theme-transition";
import type { SceneTheme } from "@/config/scene-themes";

function createLayer(theme: SceneTheme, id: number, visible: boolean) {
  return {
    id,
    colors: [...theme.gradient] as [string, string, ...string[]],
    locations: theme.gradientLocations,
    start: theme.gradientStart ?? { x: 0.5, y: 0 },
    end: theme.gradientEnd ?? { x: 0.5, y: 1 },
    opacity: new Animated.Value(visible ? 1 : 0),
  };
}

/** Immutable native layers: never replace the colors of a visible gradient. */
export function SceneThemeBackground() {
  const { theme } = useSceneTheme();
  const targetKey = JSON.stringify([theme.gradient, theme.gradientLocations, theme.gradientStart, theme.gradientEnd]);
  const [layers, setLayers] = useState(() => [createLayer(theme, 0, true)]);
  const layersRef = useRef(layers);
  const targetRef = useRef(targetKey);
  const generation = useRef(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduceMotion(value);
    });
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { mounted = false; listener.remove(); };
  }, []);

  useLayoutEffect(() => {
    if (targetRef.current === targetKey) return;
    targetRef.current = targetKey;
    const id = ++generation.current;
    // Freeze the existing composite on native. No readback or reconstructed
    // palette is needed, even when the source/destination have different stops.
    layersRef.current.forEach(layer => layer.opacity.stopAnimation());
    const next = [...layersRef.current, createLayer(theme, id, false)];
    layersRef.current = next;
    setLayers(next);
  }, [targetKey, theme]);

  useLayoutEffect(() => {
    const top = layers[layers.length - 1];
    if (layers.length === 1 || top.id !== generation.current) return;
    const token = top.id;
    const finish = () => {
      if (generation.current !== token) return;
      // Keep the same keyed native view at opacity 1. Remove only layers
      // fully covered by it; do not swap/reset the destination at completion.
      layersRef.current = [top];
      setLayers([top]);
    };
    if (reduceMotion) {
      top.opacity.setValue(1);
      finish();
      return;
    }
    const animation = Animated.timing(top.opacity, {
      toValue: 1,
      duration: SCENE_THEME_FADE_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => { if (finished) finish(); });
    return () => animation.stop();
  }, [layers, reduceMotion]);

  useEffect(() => () => {
    ++generation.current;
    layersRef.current.forEach(layer => layer.opacity.stopAnimation());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {layers.map(layer => (
        <Animated.View key={layer.id} style={[StyleSheet.absoluteFill, { opacity: layer.opacity }]}>
          <LinearGradient
            colors={layer.colors}
            locations={layer.locations}
            start={layer.start}
            end={layer.end}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ))}
    </View>
  );
}
