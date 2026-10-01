import React from "react";
import { Animated, Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { usePressScaleAnimation } from "@/hooks/usePressScaleAnimation";

export function ProfileIntentionPill({
  onPress,
  style,
  textStyle,
}: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { scale, animatePress } = usePressScaleAnimation();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        testID="profile-intention-pill"
        accessibilityRole="button"
        accessibilityLabel="Intención. Abrir Tu camino"
        onPressIn={() => animatePress(true)}
        onPressOut={() => animatePress(false)}
        onPress={(event) => {
          event.stopPropagation();
          onPress();
        }}
        style={({ pressed }) => [style, pressed && { opacity: 0.78 }]}
      >
        <Text style={textStyle}>Intención</Text>
      </Pressable>
    </Animated.View>
  );
}