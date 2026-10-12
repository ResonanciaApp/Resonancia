import React from "react";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getTabBarGlassOverlay, TAB_PILL_BLUR_INTENSITY, TAB_PILL_BLUR_TINT } from "@/constants/tab-bar";

/** Same glass surface and menu treatment as Portada's category dropdown. */
export function RoutineRepeatMenu({ visible, top, sceneId, value, onSelect, onDismiss }: {
  visible: boolean;
  top: number;
  sceneId: string;
  value: boolean;
  onSelect: (enabled: boolean) => void;
  onDismiss: () => void;
}) {
  if (!visible) return null;
  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}
        accessibilityRole="button" accessibilityLabel="Cerrar opciones de repetición"
        testID="routine-repeat-menu-backdrop" />
      <View style={[styles.menu, { top }]} accessibilityRole="menu" testID="routine-repeat-menu">
        <View pointerEvents="none" style={styles.surface}>
          <BlurView tint={TAB_PILL_BLUR_TINT} intensity={TAB_PILL_BLUR_INTENSITY}
            experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: getTabBarGlassOverlay(sceneId) }]} />
        </View>
        {[{ label: "Cada día", enabled: true }, { label: "Apagado", enabled: false }].map(option => (
          <Pressable key={option.label} onPress={() => onSelect(option.enabled)}
            accessibilityRole="menuitem" accessibilityState={{ selected: option.enabled === value }}
            testID={option.enabled ? "crear-rutina-repeat-daily" : "crear-rutina-repeat-off"}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
            <Text style={[styles.text, option.enabled === value && styles.selected]}>{option.label}</Text>
            {option.enabled === value && <Feather name="check" size={16} color="#F9F9F9" />}
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  surface: { ...StyleSheet.absoluteFillObject, borderRadius: 16, overflow: "hidden" },
  menu: {
    position: "absolute", right: 22, zIndex: 22, width: 200, borderRadius: 16,
    paddingVertical: 6, borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)", shadowColor: "#000",
    shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  option: {
    minHeight: 44, paddingHorizontal: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between", gap: 12,
  },
  pressed: { backgroundColor: "rgba(255,255,255,0.08)" },
  text: { color: "rgba(249,249,249,0.82)", fontSize: 15, fontFamily: "Manrope", fontWeight: "400" },
  selected: { color: "#F9F9F9", fontWeight: "600" },
});
