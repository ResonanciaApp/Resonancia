import React, { useEffect, useMemo } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, type SharedValue } from "react-native-reanimated";
import type { ProfileAvatarSource } from "@/lib/profile-avatar";
import { REFLECTION_STORY_AVATAR_SIZE, REFLECTION_STORY_AVATAR_X_MIN, REFLECTION_STORY_AVATAR_Y_MIN,
  snapReflectionStoryAvatarCoordinate, type ReflectionStoryAvatarPosition } from "@/lib/reflection-story-logic";
import { StoryAvatar } from "./StoryAvatar";

export function StoryAvatarLayer({ source, width, position, onPositionChange, displayScale, guideOpacity, onReady, onFailure }: {
  source: ProfileAvatarSource;
  width: number;
  position: ReflectionStoryAvatarPosition;
  onPositionChange?: (position: ReflectionStoryAvatarPosition) => void;
  displayScale?: SharedValue<number>;
  guideOpacity?: SharedValue<number>;
  onReady?: () => void;
  onFailure?: () => void;
}) {
  const height = width * 16 / 9;
  const scale = width / 1080;
  const size = REFLECTION_STORY_AVATAR_SIZE * scale;
  const x = useSharedValue(position.x);
  const y = useSharedValue(position.y);
  const startX = useSharedValue(position.x);
  const startY = useSharedValue(position.y);
  useEffect(() => { x.value = position.x; y.value = position.y; }, [position.x, position.y, x, y]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * width - size / 2 }, { translateY: y.value * height - size / 2 }],
  }));
  const pan = useMemo(() => Gesture.Pan().enabled(!!onPositionChange).minDistance(1).maxPointers(1)
    .onBegin(() => {
      if (guideOpacity) guideOpacity.value = 1;
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate(event => {
      const visibleScale = displayScale?.value ?? 1;
      const nextX = Math.max(REFLECTION_STORY_AVATAR_X_MIN, Math.min(1 - REFLECTION_STORY_AVATAR_X_MIN,
        startX.value + event.translationX / (width * visibleScale)));
      const nextY = Math.max(REFLECTION_STORY_AVATAR_Y_MIN, Math.min(1 - REFLECTION_STORY_AVATAR_Y_MIN,
        startY.value + event.translationY / (height * visibleScale)));
      x.value = snapReflectionStoryAvatarCoordinate(nextX, width * visibleScale);
      y.value = snapReflectionStoryAvatarCoordinate(nextY, height * visibleScale);
    })
    .onFinalize(() => {
      if (guideOpacity) guideOpacity.value = 0;
      if (onPositionChange) runOnJS(onPositionChange)({ x: x.value, y: y.value });
    }),
  [onPositionChange, displayScale, guideOpacity, width, height, startX, startY, x, y]);
  return <GestureDetector gesture={pan}>
    <Animated.View testID="story-avatar-independent-layer" accessibilityLabel="Avatar de la historia"
      style={[{ position: "absolute", left: 0, top: 0, width: size, height: size }, style]}>
      <StoryAvatar source={source} scale={scale} onReady={onReady} onFailure={onFailure} />
    </Animated.View>
  </GestureDetector>;
}
