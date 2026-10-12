import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

import { DURATION_SHEET_OPEN_BACKDROP_MS, DURATION_SHEET_OPEN_SPRING } from "@/lib/ambiental-duration-opening";

/** Same preset height as AmbientalDurationSheet (its SHEET_HEIGHT minHeight, safe-area padding included). */
export const JOURNEY_EXPLANATION_SHEET_HEIGHT = 320;
export const JOURNEY_EXPLANATION_CLOSE_MS = 500;
export const JOURNEY_EXPLANATION_BACKDROP_CLOSE_MS = 460;
export const JOURNEY_EXPLANATION_BACKDROP_OPACITY = 0.62;

/**
 * Mirrors AmbientalDurationSheet motion: opening spring + backdrop fade from
 * ambiental-duration-opening, timed close. Every visibility change bumps a
 * generation token so interrupted animations never run stale completions.
 */
export function useJourneyExplanationSheetMotion(visible: boolean, sheetHeight = JOURNEY_EXPLANATION_SHEET_HEIGHT) {
  const [rendered, setRendered] = useState(visible);
  const sheetY = useRef(new Animated.Value(sheetHeight + 80)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const generation = useRef(0);
  const wasShown = useRef(visible);

  useEffect(() => {
    const token = ++generation.current;
    let frame: number | undefined;
    sheetY.stopAnimation();
    backdropOpacity.stopAnimation();
    const cleanup = () => {
      generation.current++;
      if (frame !== undefined) cancelAnimationFrame(frame);
      sheetY.stopAnimation();
      backdropOpacity.stopAnimation();
    };
    if (visible) {
      wasShown.current = true;
      setRendered(true);
      sheetY.setValue(sheetHeight + 80);
      backdropOpacity.setValue(0);
      frame = requestAnimationFrame(() => {
        if (token !== generation.current) return;
        Animated.parallel([
          Animated.spring(sheetY, { toValue: 0, ...DURATION_SHEET_OPEN_SPRING, useNativeDriver: true }),
          Animated.timing(backdropOpacity, {
            toValue: JOURNEY_EXPLANATION_BACKDROP_OPACITY,
            duration: DURATION_SHEET_OPEN_BACKDROP_MS,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return cleanup;
    }
    if (!wasShown.current) return cleanup;
    Animated.parallel([
      Animated.timing(sheetY, { toValue: sheetHeight + 80, duration: JOURNEY_EXPLANATION_CLOSE_MS, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: JOURNEY_EXPLANATION_BACKDROP_CLOSE_MS, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished || token !== generation.current) return;
      wasShown.current = false;
      setRendered(false);
    });
    return cleanup;
  }, [visible, sheetHeight, sheetY, backdropOpacity]);

  return { rendered, sheetY, backdropOpacity };
}
