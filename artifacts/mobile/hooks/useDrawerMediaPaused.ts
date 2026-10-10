import { useState } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { useDrawerMotion } from "@/context/DrawerContext";

/** Local media state: pause during a drag too, without subscribing Home to
 * drawer state or sending a React update on every animation frame. */
export function useDrawerMediaPaused(enabled: boolean) {
  const { drawerProgress } = useDrawerMotion();
  const [paused, setPaused] = useState(() => enabled && drawerProgress.value > 0);

  useAnimatedReaction(
    () => enabled && drawerProgress.value > 0,
    (next, previous) => {
      if (next !== previous) runOnJS(setPaused)(next);
    },
    [drawerProgress, enabled],
  );

  return enabled && paused;
}
