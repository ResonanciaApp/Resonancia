import { router } from "expo-router";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { useColors } from "@/hooks/useColors";
import { CHAKRAS } from "@/data/chakras";

type ChakraSectionProps = {
  backgroundColor?: string;
};

export function ChakraSection({ backgroundColor = "rgba(255,255,255,0.05)" }: ChakraSectionProps) {
  const colors = useColors();
  const categoryOverlay = useCategoryOverlayOptional();

  const openChakra = (id: string) => {
    const route = `/chakra/${id}`;
    if (categoryOverlay) {
      categoryOverlay.openCategory(route);
    } else {
      router.push(route as never);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Armoniza tus chakras</Text>
      <View style={[styles.cardList, { backgroundColor }]}>
        {CHAKRAS.map((chakra) => (
          <Pressable
            key={chakra.id}
            onPress={() => openChakra(chakra.id)}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.78 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${chakra.name}`}
          >
            <Image source={chakra.image} style={[styles.image, { backgroundColor: `${chakra.color}22` }]} contentFit="cover" />
            <View style={styles.copy}>
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                {chakra.name}
              </Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
                {chakra.description}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: colors.mutedForeground }]}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  cardList: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  card: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  name: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  description: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 17,
  },
  chevron: {
    fontFamily: "Manrope",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 30,
    paddingHorizontal: 3,
  },
});