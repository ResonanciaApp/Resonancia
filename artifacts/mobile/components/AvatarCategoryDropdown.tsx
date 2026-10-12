import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { CardCaptionText as Text } from "@/components/CardCaptionText";
import { avatarFilterOptions, type AvatarCategory, type AvatarCategoryFilter } from "@/lib/profile-avatar-categories";

/** Transparent text control at the right margin immediately above the avatar grid. */
export function AvatarCategoryTrigger({
  label,
  open,
  onPress,
}: {
  label: string;
  open: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 25, bottom: 21, left: 16, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel={`Categoría de avatares: ${label}`}
      accessibilityState={{ expanded: open }}
      testID="avatar-category-trigger"
      style={({ pressed }) => [styles.trigger, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Text style={styles.triggerText} numberOfLines={1}>{label}</Text>
      <Feather name={open ? "chevron-up" : "chevron-down"} size={13} color="#F9F9F9" />
    </Pressable>
  );
}

/**
 * Menu rendered inside the existing Portada sheet (never a second native Modal).
 * The full-sheet backdrop dismisses it when touching outside.
 */
export function AvatarCategoryMenu({
  visible,
  top,
  right,
  categories,
  value,
  surface,
  onSelect,
  onDismiss,
}: {
  visible: boolean;
  top: number;
  right: number;
  categories: readonly AvatarCategory[];
  value: AvatarCategoryFilter;
  surface: string;
  onSelect: (filter: AvatarCategoryFilter) => void;
  onDismiss: () => void;
}) {
  if (!visible) return null;
  const options = avatarFilterOptions(categories);
  return (
    <>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Cerrar lista de categorías"
        testID="avatar-category-backdrop"
      />
      <View style={[styles.menu, { top, right, backgroundColor: surface }]} accessibilityRole="menu" testID="avatar-category-menu">
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" style={styles.menuScroll}>
          {options.map((option) => {
            const selected = option.id === value;
            return (
              <Pressable
                key={option.id}
                onPress={() => onSelect(option.id)}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                testID={`avatar-category-option-${option.id}`}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]} numberOfLines={1}>
                  {option.label}
                </Text>
                {selected && <Feather name="check" size={16} color="#F9F9F9" />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    alignSelf: "flex-end",
    maxWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "transparent",
  },
  triggerText: {
    color: "#F9F9F9",
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Inter_500Medium",
    flexShrink: 1,
  },
  menu: {
    position: "absolute",
    zIndex: 22,
    minWidth: 200,
    maxWidth: 280,
    borderRadius: 16,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  menuScroll: {
    maxHeight: 300,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  optionPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  optionText: {
    color: "rgba(249,249,249,0.82)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  optionTextSelected: {
    color: "#F9F9F9",
    fontFamily: "Inter_600SemiBold",
  },
});
