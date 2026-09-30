import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

export const GROWTH_SHEET_SPRING = {
  tension: 55,
  friction: 8,
  useNativeDriver: true,
} as const;

export function useGrowthJourneySheetMotion(visible: boolean, sheetHeight: number) {
  const [rendered, setRendered] = useState(visible);
  const sheetY = useRef(new Animated.Value(sheetHeight + 80)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const wasShown = useRef(visible);

  useEffect(() => {
    sheetY.stopAnimation();
    backdropOpacity.stopAnimation();
    if (visible) {
      wasShown.current = true;
      setRendered(true);
      sheetY.setValue(sheetHeight + 80);
      backdropOpacity.setValue(0);
      const frame = requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(sheetY, { toValue: 0, ...GROWTH_SHEET_SPRING }),
          Animated.timing(backdropOpacity, {
            toValue: 0.62,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return () => {
        cancelAnimationFrame(frame);
        sheetY.stopAnimation();
        backdropOpacity.stopAnimation();
      };
    }
    if (!wasShown.current) return;

    const exit = Animated.parallel([
      Animated.timing(sheetY, {
        toValue: sheetHeight + 80,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 460,
        useNativeDriver: true,
      }),
    ]);
    exit.start(({ finished }) => {
      if (finished) {
        wasShown.current = false;
        setRendered(false);
      }
    });
    return () => exit.stop();
  }, [visible, sheetHeight, sheetY, backdropOpacity]);

  return { rendered, sheetY, backdropOpacity };
}