import React from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import RAnimated, { cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { SacredBackground } from "@/components/SacredBackground";
import { useDrawer, useDrawerMotion } from "@/context/DrawerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  DRAWER_CORNER_RADIUS,
  DRAWER_GESTURE_ACTIVE_X,
  DRAWER_GESTURE_FAIL_Y,
  dragProgress,
  foregroundElevation,
  foregroundShadowOpacity,
  foregroundTranslateX,
  foregroundVeilOpacity,
  shouldSettleOpen,
} from "@/lib/drawerGeometry";

/**
 * Superficie frontal estilo X: contiene la pantalla activa y sus overlays.
 * Se desplaza a la derecha y revela el menu fijo detras.
 * Capas separadas: la exterior lleva translate + sombra (sin recorte), la
 * interior recorta las esquinas y el velo blanco va encima del contenido.
 * Las esquinas son estáticas; el resto usa el mismo progreso de Reanimated.
 */
export function DrawerForeground({ children }: { children: React.ReactNode }) {
  const {
    drawerProgress,
    drawerWidth,
    drawerGestureVersion,
    foregroundBlocked,
    beginDrawerDrag,
    settleDrawerDrag,
    close,
  } = useDrawer();
  const { theme } = useSceneTheme();
  const dragStart = useSharedValue(0);
  const dragging = useSharedValue(false);
  const gestureVersion = useSharedValue(0);

  const outerStyle = useAnimatedStyle(() => {
    const p = drawerProgress.value;
    return {
      transform: [{ translateX: foregroundTranslateX(p, drawerWidth.value) }],
      shadowOpacity: foregroundShadowOpacity(p),
      elevation: foregroundElevation(p),
    };
  });
  const veilStyle = useAnimatedStyle(() => ({
    opacity: foregroundVeilOpacity(drawerProgress.value),
  }));

  const closeFromStrip = React.useCallback(() => close(), [close]);

  const gesture = React.useMemo(() => {
    const pan = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-DRAWER_GESTURE_FAIL_Y, DRAWER_GESTURE_FAIL_Y])
      .onStart(() => {
        cancelAnimation(drawerProgress);
        dragging.value = true;
        gestureVersion.value = drawerGestureVersion.value;
        dragStart.value = drawerProgress.value;
        runOnJS(beginDrawerDrag)(gestureVersion.value);
      })
      .onUpdate((event) => {
        if (gestureVersion.value !== drawerGestureVersion.value) return;
        drawerProgress.value = dragProgress(dragStart.value, event.translationX, drawerWidth.value);
      })
      .onEnd((event) => {
        dragging.value = false;
        runOnJS(settleDrawerDrag)(shouldSettleOpen(drawerProgress.value, event.velocityX), gestureVersion.value);
      })
      .onFinalize(() => {
        if (!dragging.value) return;
        dragging.value = false;
        runOnJS(settleDrawerDrag)(dragStart.value >= 0.5, gestureVersion.value);
      });
    const tap = Gesture.Tap().onEnd((_event, success) => {
      if (success) runOnJS(closeFromStrip)();
    });
    return Gesture.Exclusive(pan, tap);
  }, [beginDrawerDrag, closeFromStrip, dragging, dragStart, drawerGestureVersion, drawerProgress, drawerWidth, gestureVersion, settleDrawerDrag]);

  return (
    <RAnimated.View
      style={[styles.outer, { backgroundColor: theme.solid }, outerStyle]}
      testID="drawer-foreground"
    >
      <RAnimated.View style={styles.inner}>
        <SacredBackground variant="gradient" noImage />
        <View
          style={{ flex: 1 }}
          accessibilityElementsHidden={foregroundBlocked}
          importantForAccessibility={foregroundBlocked ? "no-hide-descendants" : "auto"}
        >
          {children}
        </View>
        <RAnimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.veil, veilStyle]} />
        {foregroundBlocked && (
          <GestureDetector gesture={gesture}>
            <View
              style={StyleSheet.absoluteFill}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Cerrar menú"
              testID="drawer-foreground-strip"
            />
          </GestureDetector>
        )}
      </RAnimated.View>
    </RAnimated.View>
  );
}

/**
 * Arrastre progresivo de Inicio: no limitado al borde. El movimiento vertical
 * falla antes de activar el gesto para conservar el scroll.
 */
export function DrawerEdgeGesture({ enabled, top = 0, children }: { enabled: boolean; top?: number; children: React.ReactElement }) {
  const { drawerProgress, drawerWidth, drawerGestureVersion, beginDrawerDrag, settleDrawerDrag } = useDrawerMotion();
  const dragging = useSharedValue(false);
  const dragStart = useSharedValue(0);
  const gestureVersion = useSharedValue(0);
  const gesture = React.useMemo(
    () => Gesture.Pan()
      .enabled(enabled)
      .activeOffsetX(DRAWER_GESTURE_ACTIVE_X)
      .failOffsetX(-DRAWER_GESTURE_ACTIVE_X)
      .failOffsetY([-DRAWER_GESTURE_FAIL_Y, DRAWER_GESTURE_FAIL_Y])
      .onStart(() => {
        cancelAnimation(drawerProgress);
        dragging.value = true;
        gestureVersion.value = drawerGestureVersion.value;
        dragStart.value = drawerProgress.value;
        runOnJS(beginDrawerDrag)(gestureVersion.value);
      })
      .onUpdate((event) => {
        if (gestureVersion.value !== drawerGestureVersion.value) return;
        drawerProgress.value = dragProgress(dragStart.value, event.translationX, drawerWidth.value);
      })
      .onEnd((event) => {
        dragging.value = false;
        runOnJS(settleDrawerDrag)(event.translationX > 0 && event.velocityX > -500, gestureVersion.value);
      })
      .onFinalize(() => {
        if (!dragging.value) return;
        dragging.value = false;
        runOnJS(settleDrawerDrag)(dragStart.value >= 0.5, gestureVersion.value);
      }),
    [beginDrawerDrag, dragging, dragStart, drawerGestureVersion, drawerProgress, drawerWidth, enabled, gestureVersion, settleDrawerDrag],
  );
  return (
    <GestureDetector gesture={gesture}>
      {children}
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    borderTopLeftRadius: DRAWER_CORNER_RADIUS,
    borderBottomLeftRadius: DRAWER_CORNER_RADIUS,
    shadowColor: "#05070D",
    shadowOffset: { width: -6, height: 0 },
    shadowRadius: 18,
    shadowOpacity: 0,
  },
  inner: {
    flex: 1,
    borderTopLeftRadius: DRAWER_CORNER_RADIUS,
    borderBottomLeftRadius: DRAWER_CORNER_RADIUS,
    overflow: "hidden",
  },
  veil: {
    backgroundColor: "#FFFFFF",
  },
});
