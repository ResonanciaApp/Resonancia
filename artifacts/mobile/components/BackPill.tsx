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
  borderColor?: string;
  borderWidth?: number;
  /** Superficie circular estándar para controles independientes del drawer. */
  standardSurface?: boolean;
  /** Desplazamiento horizontal del icono dentro del pill (positivo = derecha). */
  iconOffsetX?: number;
}

export function BackPill({
  onPress,
  style,
  color = "#fff",
  size = 22,
  hitSlop = 10,
  bgColor,
  borderColor,
  borderWidth,
  standardSurface = false,
  iconOffsetX,
}: BackPillProps) {
  return (
    <PressableScale onPress={onPress} containerStyle={style} hitSlop={hitSlop}>
      <View
        style={[
          styles.base,
          standardSurface && styles.standardSurface,
          bgColor ? {
            backgroundColor: bgColor,
            borderRadius: standardSurface ? 21.5 : 19,
          } : undefined,
          (borderWidth || standardSurface) ? {
            borderWidth: borderWidth ?? 1,
            borderColor: borderColor ?? "rgba(255,255,255,0.2)",
          } : undefined,
          standardSurface && !bgColor ? { backgroundColor: "rgba(0,0,0,0.22)" } : undefined,
        ]}
      >
        <View style={iconOffsetX ? { transform: [{ translateX: iconOffsetX }] } : undefined}>
          {/* La superficie circular estándar tiene un único tamaño de icono.
              Los callers legacy sin standardSurface conservan su `size`. */}
          <Feather name="chevron-left" size={standardSurface ? 28 : size} color={color} />
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
  standardSurface: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
  },
});
