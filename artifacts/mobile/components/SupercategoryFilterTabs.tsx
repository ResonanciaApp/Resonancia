import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  getSupercategoryFilterTabs,
  shouldShowSupercategoryFilterTabs,
  type SupercategoryFilter,
} from "@/data/supercategory-editorial-tags";

export function SupercategoryFilterTabs({
  editorialTags,
  active,
  onSelect,
  includeDurationFilters = true,
  hideWithoutEditorialTags = false,
}: {
  editorialTags: string[];
  active: SupercategoryFilter;
  onSelect: (filter: SupercategoryFilter) => void;
  includeDurationFilters?: boolean;
  hideWithoutEditorialTags?: boolean;
}) {
  if (!shouldShowSupercategoryFilterTabs(editorialTags, hideWithoutEditorialTags)) return null;

  const tabs = getSupercategoryFilterTabs(editorialTags, includeDurationFilters);

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
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.28)",
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