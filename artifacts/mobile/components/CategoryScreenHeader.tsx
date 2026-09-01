import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { SessionCategoryIcon } from "@/components/SessionCardMetadataOverlay";
import { CATEGORIES } from "@/data/categories";

type Props = {
  categoryId: string;
  title?: string;
  description?: string;
};

export function CategoryScreenHeader({ categoryId, title, description }: Props) {
  const category = CATEGORIES.find((candidate) => candidate.id === categoryId);
  const resolvedTitle = title ?? category?.title ?? "Categoría";
  const resolvedDescription = description ?? category?.subtitle;

  return (
    <View style={styles.container}>
      <SessionCategoryIcon categoryId={categoryId} size={42} />
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {resolvedTitle}
      </Text>
      {resolvedDescription ? (
        <Text style={styles.description} numberOfLines={2}>
          {resolvedDescription}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    maxWidth: 320,
  },
  title: {
    marginTop: 8,
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: "#FBFBFB",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  description: {
    marginTop: 4,
    maxWidth: 300,
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.84)",
    textAlign: "center",
  },
});