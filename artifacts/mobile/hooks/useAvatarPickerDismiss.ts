import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import { drawerDiagnosticEvent } from "@/hooks/useDrawerDiagnostics";
import {
  cancelAnimation, Easing, runOnJS, runOnUI, useAnimatedStyle, useSharedValue, withSpring, withTiming,
  type SharedValue,
} from "react-native-reanimated";

// Same physics as Animated's Origami tension 55 / friction 8.
const SHEET_SPRING = { stiffness: 284.5, damping: 25, mass: 1 };

/** The native gesture and all sheet motion share one UI-thread translation. */
export function useAvatarPickerDismiss(options: {
  visible: boolean;
  enabled: boolean;
  sheetHeight: number;
  sheetTop: number;
  gridTop: number;
  scrollOffset: SharedValue<number>;
  onClose: () => void;
}) {
  const { visible, enabled, sheetHeight, sheetTop, gridTop, scrollOffset } = options;
  const latest = useRef(options);
  latest.current = options;
  const [rendered, setRendered] = useState(visible);
  const [opened, setOpened] = useState(false);
  const modalShown = useRef(false);
  const revision = useRef(0);
  const wasShown = useRef(visible);
  const sheetY = useSharedValue(sheetHeight + 80);
  const backdropOpacity = useSharedValue(0);
  const isVisible = useSharedValue(visible);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const baseY = useSharedValue(0);
  const dragging = useSharedValue(false);
  const gestureClosing = useSharedValue(false);
  const gestureExitFinished = useSharedValue(false);
  const exitPartsRemaining = useSharedValue(0);
  const requestClose = useCallback(() => {
    drawerDiagnosticEvent("avatar:exit-finished");
    latest.current.onClose();
  }, []);
  const finishOpen = useCallback((token: number) => {
    if (revision.current === token && latest.current.visible) {
      drawerDiagnosticEvent("avatar:opened");
      setOpened(true);
    }
  }, []);
  const animateOpen = useCallback((token: number) => {
    runOnUI(() => {
      "worklet";
      sheetY.value = withSpring(0, SHEET_SPRING, finished => {
        if (finished) runOnJS(finishOpen)(token);
      });
      backdropOpacity.value = withTiming(0.62, { duration: 500 });
    })();
  }, [sheetY, backdropOpacity, finishOpen]);
  const onShow = useCallback(() => {
    modalShown.current = true;
    drawerDiagnosticEvent("avatar:native-shown");
    if (latest.current.visible && wasShown.current) animateOpen(revision.current);
  }, [animateOpen]);
  const finishGestureExitPart = useCallback((finished?: boolean) => {
    "worklet";
    if (!finished) return;
    exitPartsRemaining.value -= 1;
    if (exitPartsRemaining.value === 0) {
      gestureExitFinished.value = true;
      runOnJS(requestClose)();
    }
  }, [exitPartsRemaining, gestureExitFinished, requestClose]);
  // Buttons/backdrop use the timer's exit timing, but do not flip the parent's
  // visibility (and rebuild its large image grid) until both animations finish.
  const dismiss = useCallback(() => {
    drawerDiagnosticEvent("avatar:close-request");
    runOnUI(() => {
      "worklet";
      if (!isVisible.value || gestureClosing.value) return;
      gestureClosing.value = true;
      dragging.value = false;
      cancelAnimation(sheetY);
      cancelAnimation(backdropOpacity);
      exitPartsRemaining.value = 2;
      sheetY.value = withTiming(sheetHeight + 80, {
        duration: 500, easing: Easing.inOut(Easing.ease),
      }, finishGestureExitPart);
      backdropOpacity.value = withTiming(0, { duration: 460 }, finishGestureExitPart);
    })();
  }, [isVisible, gestureClosing, dragging, sheetY, backdropOpacity, exitPartsRemaining, sheetHeight, finishGestureExitPart]);
  const finishClose = useCallback((token: number) => {
    if (revision.current === token && !latest.current.visible) {
      drawerDiagnosticEvent("avatar:hidden");
      wasShown.current = false;
      modalShown.current = false;
      setRendered(false);
    }
  }, []);

  useEffect(() => {
    const token = ++revision.current;
    isVisible.value = visible;
    setOpened(false);
    if (!visible && wasShown.current && gestureExitFinished.value) {
      drawerDiagnosticEvent("avatar:hidden");
      // Both native animations have finished. React only dismisses the Modal;
      // it must not replay the exit or reset its translation.
      wasShown.current = false;
      modalShown.current = false;
      gestureExitFinished.value = false;
      gestureClosing.value = false;
      setRendered(false);
      return;
    }
    cancelAnimation(sheetY);
    cancelAnimation(backdropOpacity);
    if (visible) {
      drawerDiagnosticEvent("avatar:open-request");
      gestureClosing.value = false;
      gestureExitFinished.value = false;
      exitPartsRemaining.value = 0;
      wasShown.current = true;
      setRendered(true);
      sheetY.value = sheetHeight + 80;
      backdropOpacity.value = 0;
      // First mount waits for the native Modal, not just a React commit.
      // Reopening an exit already in progress doesn't emit another onShow.
      if (modalShown.current) animateOpen(token);
    } else if (wasShown.current) {
      drawerDiagnosticEvent("avatar:close-request");
      // Starts at the gesture's last position, never at a reset position.
      sheetY.value = withTiming(sheetHeight + 80, {
        duration: 500, easing: Easing.inOut(Easing.ease),
      }, finished => {
        if (finished) runOnJS(finishClose)(token);
      });
      backdropOpacity.value = withTiming(0, { duration: 460 });
    }
    return () => {
      cancelAnimation(sheetY);
      cancelAnimation(backdropOpacity);
    };
  }, [
    visible, sheetHeight, sheetY, backdropOpacity, isVisible, finishClose,
    gestureClosing, gestureExitFinished, exitPartsRemaining, animateOpen,
  ]);

  const gridGesture = useMemo(() => Gesture.Native(), []);
  const gesture = useMemo(() => Gesture.Pan()
    .enabled(enabled)
    .maxPointers(1)
    .manualActivation(true)
    // Let the list scroll once this recognizer fails; a downward drag at the
    // top instead owns the sheet, so the native ScrollView cannot steal it.
    .blocksExternalGesture(gridGesture)
    .onTouchesDown((event, manager) => {
      const touch = event.allTouches[0];
      if (!touch || event.allTouches.length !== 1 || !isVisible.value || gestureClosing.value) {
        manager.fail();
        return;
      }
      touchX.value = touch.absoluteX;
      touchY.value = touch.absoluteY;
      const aboveGrid = touch.absoluteY < sheetTop + gridTop;
      if (!aboveGrid && scrollOffset.value > 0.5) manager.fail();
    })
    .onTouchesMove((event, manager) => {
      if (dragging.value) return;
      const touch = event.allTouches[0];
      if (!touch) return;
      const dx = touch.absoluteX - touchX.value;
      const dy = touch.absoluteY - touchY.value;
      if (dy < -8 || (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy))) {
        manager.fail();
      } else if (dy > 8 && dy > Math.abs(dx)) {
        manager.activate();
      }
    })
    .onStart(() => {
      cancelAnimation(sheetY);
      baseY.value = sheetY.value;
      dragging.value = true;
    })
    .onUpdate(event => {
      if (gestureClosing.value) return;
      sheetY.value = Math.max(0, baseY.value + event.translationY);
    })
    .onEnd(event => {
      dragging.value = false;
      if (!isVisible.value || gestureClosing.value) return;
      if (event.translationY > 70 || (event.translationY > 12 && event.velocityY > 500)) {
        // Continue in this very UI callback: no JS round trip, React render,
        // or ease-in from rest between the finger and the automatic exit.
        gestureClosing.value = true;
        exitPartsRemaining.value = 2;
        sheetY.value = withSpring(sheetHeight + 80, {
          ...SHEET_SPRING,
          velocity: Math.max(0, event.velocityY),
          overshootClamping: true,
        }, finishGestureExitPart);
        backdropOpacity.value = withTiming(0, { duration: 460 }, finishGestureExitPart);
      } else {
        sheetY.value = withSpring(0, SHEET_SPRING);
      }
    })
    .onFinalize(() => {
      if (dragging.value && isVisible.value) sheetY.value = withSpring(0, SHEET_SPRING);
      dragging.value = false;
    }), [
      enabled, sheetTop, gridTop, scrollOffset, gridGesture, isVisible,
      touchX, touchY, baseY, dragging, sheetY, sheetHeight, backdropOpacity,
      gestureClosing, exitPartsRemaining, finishGestureExitPart,
    ]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  return { rendered, opened, onShow, dismiss, gesture, gridGesture, sheetStyle, backdropStyle };
}
