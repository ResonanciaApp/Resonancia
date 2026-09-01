import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import {
  WATERCOLOR_CARD_GAP,
  WATERCOLOR_CARD_RADIUS,
  WATERCOLOR_CARD_SIZE,
} from "@/components/ContentCategoryGrid";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { CHAKRAS } from "@/data/chakras";

const H_PAD = 14;
const SECTION_GAP = 53;

export function ChakraCarouselSection() {
  const { openCategory } = useCategoryOverlay();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Armoniza tus chakras</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -H_PAD }}
        contentContainerStyle={styles.carouselContent}
      >
        {CHAKRAS.map((chakra) => (
          <Pressable
            key={chakra.id}
            onPress={() => openCategory(`/chakra/${chakra.id}`)}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.82 : 1 }]}
          >
            <View style={styles.imageWrap}>
              <Image
                source={chakra.image}
                style={styles.image}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
              />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {chakra.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: H_PAD,
    marginBottom: SECTION_GAP,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FBFBFB",
    marginBottom: 17,
  },
  carouselContent: {
    paddingHorizontal: H_PAD,
    gap: WATERCOLOR_CARD_GAP,
    paddingBottom: 4,
  },
  card: {
    width: WATERCOLOR_CARD_SIZE,
  },
  imageWrap: {
    width: WATERCOLOR_CARD_SIZE,
    height: WATERCOLOR_CARD_SIZE,
    borderRadius: WATERCOLOR_CARD_RADIUS,
    overflow: "hidden",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontFamily: "Manrope",
    fontSize: 14.5,
    fontWeight: "700",
    lineHeight: 19,
    color: "#FBFBFB",
  },
});