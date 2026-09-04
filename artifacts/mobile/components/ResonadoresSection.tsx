import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";

import { useResonadores } from "@/hooks/useResonadores";
import { useColors } from "@/hooks/useColors";

type Props = {
  marginTop?: number;
  marginBottom?: number;
};

const SECTION_PADDING = 14;
const CARD_GAP = 11;
const TRAILING_CARD_PEEK = 5;
const VISIBLE_CARD_COUNT = 3;
const PHOTO_ASPECT_RATIO = 1.2;

export function ResonadoresSection({ marginTop = 0, marginBottom = 32 }: Props) {
  const { resonadores } = useResonadores();
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor(
    (
      screenWidth
      - SECTION_PADDING
      - CARD_GAP * VISIBLE_CARD_COUNT
      - TRAILING_CARD_PEEK
    ) / VISIBLE_CARD_COUNT,
  );
  const photoHeight = Math.round(cardWidth * PHOTO_ASPECT_RATIO);

  return (
    <View style={[styles.root, { marginTop, marginBottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Los Resonadores</Text>
        <Pressable
          onPress={() => router.push("/equipo" as never)}
          accessibilityRole="button"
          accessibilityLabel="Ver todos los Resonadores"
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
        >
          <Text style={[styles.viewAllText, { color: colors.accent }]}>Ver todos</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
      >
          {resonadores.map((resonador) => (
            <Pressable
              key={resonador.id}
              onPress={() => router.push(`/resonador/${resonador.id}` as never)}
              style={({ pressed }) => [
                styles.resonador,
                { width: cardWidth, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <View
                style={[
                  styles.photoFrame,
                  {
                    width: cardWidth,
                    height: photoHeight,
                  },
                ]}
              >
                <ExpoImage
                  source={resonador.photo}
                  style={[styles.photo, { width: cardWidth, height: photoHeight }]}
                  contentFit="cover"
                />
              </View>
              <Text numberOfLines={1} style={styles.name}>
                {resonador.name}
              </Text>
              <Text numberOfLines={1} style={[styles.subtype, { color: colors.accent }]}>
                {resonador.subtipo}
              </Text>
            </Pressable>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: SECTION_PADDING,
  },
  title: {
    flex: 1,
    marginBottom: 0,
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    color: "#F4F4F4",
  },
  viewAllText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  carouselContent: {
    gap: CARD_GAP,
    paddingHorizontal: SECTION_PADDING,
  },
  resonador: {
    alignItems: "center",
    paddingBottom: 4,
  },
  photoFrame: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 11,
  },
  photo: {
  },
  name: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    color: "#F9F9F9",
    textAlign: "center",
    lineHeight: 19,
  },
  subtype: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "transparent",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "#BE9650",
    textAlign: "center",
    lineHeight: 15,
    overflow: "hidden",
  },
});