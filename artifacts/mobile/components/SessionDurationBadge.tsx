import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  showClock?: boolean;
};

/**
 * Glassmorphism badge shared by session cards.
 * The tint layer stays exact while BlurView only supplies the frosted image
 * behind it, so the badge never inherits the old burgundy color.
 */
export function SessionDurationBadge({ label, style, textStyle, showClock = false }: Props) {
  const displayLabel = label.replace(/\bmin\b/gi, "Min");

  return (
    <View pointerEvents="none" style={[styles.root, style, styles.rounded]}>
      <SessionBadgeGlass />
      <View style={styles.content}>
        {showClock && <MaterialCommunityIcons name="clock" size={12} color="#F9F9F9" />}
        <Text style={[styles.text, textStyle]}>{displayLabel}</Text>
      </View>
    </View>
  );
}

/** Superficie compartida por las píldoras de metadata de las cards. */
export function SessionBadgeGlass() {
  return (
    <>
      <BlurView
        intensity={Platform.OS === "android" ? 60 : 28}
        tint="default"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.blackTint]} />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rounded: {
    borderRadius: 999,
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
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});