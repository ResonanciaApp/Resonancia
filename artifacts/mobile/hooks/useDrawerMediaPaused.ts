import { useCallback, useEffect, useRef, useState } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { useDrawerMotion } from "@/context/DrawerContext";

/** Local media state: pause during a drag too, without subscribing Home to
 * drawer state or sending a React update on every animation frame. */
export function useDrawerMediaPaused(enabled: boolean) {
  const { drawerProgress } = useDrawerMotion();
  const [paused, setPaused] = useState(() => enabled && drawerProgress.value > 0);
  const pausedRef = useRef(paused);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const resumeFrame = useRef<number | null>(null);
  const generation = useRef(0);

  const publishPause = useCallback((next: boolean) => {
    const token = ++generation.current;
    if (resumeFrame.current !== null) {
      cancelAnimationFrame(resumeFrame.current);
      resumeFrame.current = null;
    }
    if (next) {
      pausedRef.current = true;
      setPaused(true);
      return;
    }
    if (!pausedRef.current) return;
    // Let the closing frame + interaction/accessibility commit finish before
    // asking the native video decoder to produce frames again. No timeout.
    resumeFrame.current = requestAnimationFrame(() => {
      resumeFrame.current = requestAnimationFrame(() => {
        resumeFrame.current = null;
        if (token !== generation.current || (enabledRef.current && drawerProgress.value > 0)) return;
        pausedRef.current = false;
        setPaused(false);
      });
    });
  }, [drawerProgress]);

  useEffect(() => () => {
    generation.current++;
    if (resumeFrame.current !== null) cancelAnimationFrame(resumeFrame.current);
  }, []);

  useAnimatedReaction(
    () => enabled && drawerProgress.value > 0,
    (next, previous) => {
      if (next !== previous) runOnJS(publishPause)(next);
    },
    [drawerProgress, enabled, publishPause],
  );

  return enabled && paused;
}
