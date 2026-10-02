import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { MEMBERSHIP_AURORA } from "@/constants/colors";
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
        accessibilityLabel="0 Días: Intención. Abrir Tu camino"
        onPressIn={() => animatePress(true)}
        onPressOut={() => animatePress(false)}
        onPress={(event) => {
          event.stopPropagation();
          onPress();
        }}
        style={({ pressed }) => [style, styles.content, pressed && { opacity: 0.78 }]}
      >
        <MaterialCommunityIcons
          name="spa"
          size={12}
          color={MEMBERSHIP_AURORA.premium.accent}
          style={styles.lotus}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
        <Text style={textStyle}>
          <Text style={{ fontWeight: "700" }}>0 Días</Text>
          {": Intención"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: "row", alignItems: "center", gap: 4 },
  lotus: { lineHeight: 12, includeFontPadding: false },
});