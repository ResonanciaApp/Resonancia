import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { CATEGORIES } from "@/data/categories";

type Props = {
  categoryId: string;
  title?: string;
  description?: string;
};

export function CategoryScreenHeader({ categoryId, title }: Props) {
  const category = CATEGORIES.find((candidate) => candidate.id === categoryId);
  const resolvedTitle = title ?? category?.title ?? "Categoría";

  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {resolvedTitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    maxWidth: 340,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#FBFBFB",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});