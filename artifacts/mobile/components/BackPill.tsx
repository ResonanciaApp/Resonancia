import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { PressableScale } from "@/components/PressableScale";

interface BackPillProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  color?: string;
  size?: number;
  hitSlop?: number;
  bgColor?: string;
  /** Desplazamiento horizontal del icono dentro del pill (positivo = derecha). */
  iconOffsetX?: number;
}

export function BackPill({ onPress, style, color = "#fff", size = 22, hitSlop = 10, bgColor, iconOffsetX }: BackPillProps) {
  return (
    <PressableScale onPress={onPress} containerStyle={style} hitSlop={hitSlop}>
      <View style={[styles.base, bgColor ? { backgroundColor: bgColor, borderRadius: 19 } : undefined]}>
        <View style={iconOffsetX ? { transform: [{ translateX: iconOffsetX }] } : undefined}>
          <Feather name="chevron-left" size={size} color={color} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
