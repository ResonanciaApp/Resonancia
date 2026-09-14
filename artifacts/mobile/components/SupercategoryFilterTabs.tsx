import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { SupercategoryFilter } from "@/data/supercategory-editorial-tags";

export function SupercategoryFilterTabs({
  editorialTags,
  active,
  onSelect,
}: {
  editorialTags: string[];
  active: SupercategoryFilter;
  onSelect: (filter: SupercategoryFilter) => void;
}) {
  const tabs: { id: SupercategoryFilter; label: string }[] = [
    { id: "all", label: "Ver todo" },
    { id: "duration-5", label: "5 min" },
    { id: "duration-10", label: "10 min" },
    { id: "duration-11", label: "11+ min" },
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
    marginBottom: 18,
  },
  content: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(249,249,249,0.22)",
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    borderColor: "#BE9650",
    backgroundColor: "rgba(190,150,80,0.18)",
  },
  label: {
    color: "rgba(249,249,249,0.72)",
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "500",
  },
  labelSelected: {
    color: "#F9F9F9",
  },
});