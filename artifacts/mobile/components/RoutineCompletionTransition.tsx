import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, type LayoutChangeEvent } from "react-native";
import Reanimated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const TRANSITION_DURATION = 350;
const COMPLETE_MIN_HEIGHT = 156;

export function RoutineCompletionTransition({
  complete,
  animateToPending = true,
  children,
  completedContent,
}: {
  complete: boolean;
  animateToPending?: boolean;
  children: React.ReactNode;
  completedContent: React.ReactNode;
}) {
  const focusedRef = useRef(false);
  const pendingContent = useRef(children);
  if (!complete) pendingContent.current = children;
  const completeRef = useRef(complete);
  completeRef.current = complete;
  const generationRef = useRef(0);
  const [retainPending, setRetainPending] = useState(!complete);
  const progress = useSharedValue(complete ? 1 : 0);
  const pendingHeight = useSharedValue(0);
  const completeHeight = useSharedValue(COMPLETE_MIN_HEIGHT);
  const releasePending = useCallback((generation: number) => {
    if (generation === generationRef.current && completeRef.current) {
      setRetainPending(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    focusedRef.current = true;
    return () => {
      focusedRef.current = false;
      ++generationRef.current;
      cancelAnimation(progress);
      progress.value = completeRef.current ? 1 : 0;
      setRetainPending(!completeRef.current);
    };
  }, [progress]));

  useEffect(() => {
    const generation = ++generationRef.current;
    cancelAnimation(progress);
    if (!focusedRef.current || (!complete && !animateToPending)) {
      progress.value = complete ? 1 : 0;
      setRetainPending(!complete);
    } else {
      if (!complete) setRetainPending(true);
      progress.value = withTiming(
        complete ? 1 : 0,
        { duration: TRANSITION_DURATION },
        (finished) => {
          if (finished && complete) runOnJS(releasePending)(generation);
        },
      );
    }
    return () => {
      ++generationRef.current;
      cancelAnimation(progress);
    };
  }, [animateToPending, complete, progress, releasePending]);

  const shellStyle = useAnimatedStyle(() => {
    // Pending rows own their normal-flow height. A cached measured height can
    // momentarily clip a new row and move the following sections on a later frame.
    if (!complete && !animateToPending) return {};
    if (pendingHeight.value <= 0 && progress.value === 0) return {};
    const from = pendingHeight.value || completeHeight.value;
    return {
      height: from + (completeHeight.value - from) * progress.value,
    };
  });
  const pendingStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const completeStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const measurePending = useCallback((event: LayoutChangeEvent) => {
    pendingHeight.value = event.nativeEvent.layout.height;
  }, [pendingHeight]);
  const measureComplete = useCallback((event: LayoutChangeEvent) => {
    completeHeight.value = event.nativeEvent.layout.height;
  }, [completeHeight]);

  return (
    <Reanimated.View testID="routine-transition" style={shellStyle}>
      {(!complete || retainPending) && (
        <Reanimated.View
          testID="routine-transition-pending"
          style={pendingStyle}
          onLayout={measurePending}
          pointerEvents={complete ? "none" : "auto"}
          accessibilityElementsHidden={complete}
          importantForAccessibility={complete ? "no-hide-descendants" : "auto"}
        >
          {pendingContent.current}
        </Reanimated.View>
      )}
      <Reanimated.View
        testID="routine-transition-complete"
        style={[styles.completeLayer, completeStyle]}
        onLayout={measureComplete}
        pointerEvents={complete ? "auto" : "none"}
        accessibilityElementsHidden={!complete}
        importantForAccessibility={complete ? "auto" : "no-hide-descendants"}
      >
        {completedContent}
      </Reanimated.View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  completeLayer: { position: "absolute", top: 0, left: 0, right: 0 },
});