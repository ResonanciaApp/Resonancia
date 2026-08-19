import { BlurView } from "expo-blur";
import React from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  label: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

/**
 * Glassmorphism badge shared by session cards.
 * The tint layer stays exact while BlurView only supplies the frosted image
 * behind it, so the badge never inherits the old burgundy color.
 */
export function SessionDurationBadge({ label, style, textStyle }: Props) {
  return (
    <View pointerEvents="none" style={[styles.root, style]}>
      <BlurView
        intensity={Platform.OS === "android" ? 60 : 28}
        tint="default"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.blackTint]} />
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  blackTint: {
    backgroundColor: "rgba(0,0,0,0.20)",
  },
  text: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});