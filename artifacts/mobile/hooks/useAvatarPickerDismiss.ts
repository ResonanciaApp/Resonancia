import { useMemo, useRef } from "react";
import { Animated, PanResponder } from "react-native";
import { GROWTH_SHEET_SPRING } from "./useGrowthJourneySheetMotion";

/** Take a downward drag only when it won't consume a scroll through the grid. */
export function useAvatarPickerDismiss(options: {
  enabled: boolean;
  sheetY: Animated.Value;
  sheetTop: number;
  gridTop: number;
  scrollOffset: { value: number };
  onClose: () => void;
}) {
  const current = useRef(options);
  current.current = options;
  return useMemo(() => {
    let eligible = false;
    let dragged = false;
    const restore = () => {
      if (current.current.enabled) Animated.spring(current.current.sheetY, {
        toValue: 0, ...GROWTH_SHEET_SPRING,
      }).start();
    };
    const pan = PanResponder.create({
      onStartShouldSetPanResponderCapture: event => {
        const state = current.current;
        dragged = false;
        const aboveGrid = event.nativeEvent.pageY < state.sheetTop + state.gridTop;
        eligible = state.enabled && (aboveGrid || state.scrollOffset.value <= 0.5);
        return false; // Ordinary taps still reach buttons and avatar cards.
      },
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        current.current.enabled && eligible && gesture.dy > 8 && gesture.dy > Math.abs(gesture.dx),
      onPanResponderGrant: () => {
        dragged = true;
        current.current.sheetY.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => current.current.sheetY.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_, gesture) => {
        if (!current.current.enabled) return;
        if (gesture.dy > 70 || (gesture.dy > 12 && gesture.vy > 0.5)) current.current.onClose();
        else restore();
      },
      onPanResponderTerminate: restore,
    });
    return {
      panHandlers: pan.panHandlers,
      onBlankPress: () => {
        if (!dragged && current.current.enabled) current.current.onClose();
      },
    };
  }, []);
}
