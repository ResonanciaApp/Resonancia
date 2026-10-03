import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type CategoryEditorialFilter = "all" | `editorial:${string}`;

export function CategoryEditorialFilterTabs({
  editorialTags,
  active,
  onSelect,
}: {
  editorialTags: readonly string[];
  active: CategoryEditorialFilter;
  onSelect: (filter: CategoryEditorialFilter) => void;
}) {
  if (editorialTags.length === 0) return null;

  const tabs: { id: CategoryEditorialFilter; label: string }[] = [
    { id: "all", label: "Ver todo" },
    ...editorialTags.map((tag) => ({
      id: `editorial:${tag}` as const,
      label: tag,
    })),
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {tabs.map((tab) => {
          const selected = active === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelect(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.label, selected && styles.labelSelected]}>
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 9,
    paddingBottom: 6,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
  },
  chip: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 27,
    borderWidth: 1.2,
    borderColor: "rgba(241,224,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    borderWidth: 0,
    backgroundColor: "#F9F9F9",
  },
  label: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  labelSelected: {
    color: "#060A0F",
  },
});