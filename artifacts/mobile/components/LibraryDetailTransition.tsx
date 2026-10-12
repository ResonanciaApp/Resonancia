import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Animated, BackHandler, PanResponder, StyleSheet, useWindowDimensions } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { BackOverrideProvider } from "@/context/BackOverrideContext";
import { easeOutCubic } from "@/constants/motion";
import { hasLibrarySlide } from "@/lib/library-detail-navigation";

/**
 * A transparent native modal leaves Biblioteca in place. Only this panel moves;
 * no native push/parallax or library dismissal runs alongside it.
 */
function LibraryDetailTransition({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(width)).current;
  const ready = useRef(false);
  const closing = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    Animated.timing(x, { toValue: 0, duration: 350, easing: easeOutCubic, useNativeDriver: true })
      .start(({ finished }) => { ready.current = finished; });
    return () => { mounted.current = false; x.stopAnimation(); };
  }, [x]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    ready.current = false;
    x.stopAnimation();
    Animated.timing(x, { toValue: width, duration: 300, easing: easeOutCubic, useNativeDriver: true })
      .start(({ finished }) => {
        if (!finished || !mounted.current) return;
        if (router.canGoBack()) router.back();
        else router.navigate("/(tabs)/biblioteca" as never);
      });
  }, [width, x]);

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => subscription.remove();
  }, [close]));

  // Preserve a rightward edge swipe without letting the native stack also move.
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      ready.current && !closing.current && g.x0 <= 30 && g.dx > 6 && g.dx > Math.abs(g.dy),
    onPanResponderGrant: () => x.stopAnimation(),
    onPanResponderMove: (_, g) => x.setValue(Math.max(0, g.dx)),
    onPanResponderRelease: (_, g) => {
      if (g.dx > width * 0.25 || (g.dx > 12 && g.vx > 0.5)) close();
      else Animated.timing(x, { toValue: 0, duration: 180, easing: easeOutCubic, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () =>
      Animated.timing(x, { toValue: 0, duration: 180, easing: easeOutCubic, useNativeDriver: true }).start(),
  }), [close, width, x]);

  return (
    <BackOverrideProvider onBack={close}>
      <Animated.View {...pan.panHandlers} style={[styles.fill, { transform: [{ translateX: x }] }]}>
        {children}
      </Animated.View>
    </BackOverrideProvider>
  );
}

/** Stable screenLayout function: other routes retain their existing transitions. */
export function libraryScreenLayout({ children, route }: {
  children: React.ReactNode;
  route: { params?: object };
}) {
  return hasLibrarySlide(route.params)
    ? <LibraryDetailTransition>{children}</LibraryDetailTransition>
    : <>{children}</>;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
