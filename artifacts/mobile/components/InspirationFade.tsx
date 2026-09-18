import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, View, useWindowDimensions } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

export function useInspirationReducedMotion() {
  const initial = useReducedMotion();
  const [reduced, setReduced] = useState(initial);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); });
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { mounted = false; listener.remove(); };
  }, []);
  return reduced;
}

/** Opacity only. Inactive pager pages remain visible during a push gesture. */
export function InspirationFade({ children, replayKey, animate = true, delay = 0, viewportTick }: {
  children: React.ReactNode; replayKey: string | number; animate?: boolean;
  delay?: number; viewportTick?: number;
}) {
  const reduced = useInspirationReducedMotion();
  const { height } = useWindowDimensions();
  const node = useRef<View>(null);
  const [revealed, setRevealed] = useState(viewportTick === undefined);
  const opacity = useRef(new Animated.Value(reduced || !animate ? 1 : 0)).current;
  const [interactive, setInteractive] = useState(reduced || !animate);
  const check = () => node.current?.measureInWindow((_x, y, _w, h) => {
    if (h > 0 && y < height && y + h > 0) setRevealed(true);
  });
  useEffect(() => { if (!revealed && viewportTick !== undefined) check(); }, [viewportTick, height, revealed]);
  useLayoutEffect(() => {
    opacity.stopAnimation();
    if (reduced || !animate) { opacity.setValue(1); setInteractive(true); return; }
    opacity.setValue(0);
    setInteractive(false);
    if (!revealed) return;
    const animation = Animated.timing(opacity, { toValue: 1, duration: 650, delay, useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) setInteractive(true); });
    return () => animation.stop();
  }, [replayKey, animate, reduced, revealed, delay, opacity]);
  return <View ref={node} onLayout={viewportTick === undefined ? undefined : check} collapsable={false}>
    <Animated.View style={{ opacity }} pointerEvents={interactive ? "auto" : "none"} accessibilityElementsHidden={!interactive} importantForAccessibility={interactive ? "auto" : "no-hide-descendants"}>
      {children}
    </Animated.View>
  </View>;
}