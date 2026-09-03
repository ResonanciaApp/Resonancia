import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useResonadores } from "@/hooks/useResonadores";
import { useColors } from "@/hooks/useColors";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";

type Props = {
  marginTop?: number;
  marginBottom?: number;
};

const SECTION_PADDING = 14;
const CARD_GAP = 10;
const TRAILING_CARD_FRACTION = 0.2;

export function ResonadoresSection({ marginTop = 0, marginBottom = 32 }: Props) {
  const { resonadores } = useResonadores();
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor(
    (screenWidth - SECTION_PADDING - CARD_GAP * 2) / (2 + TRAILING_CARD_FRACTION),
  );
  const photoSize = cardWidth;

  return (
    <View style={[styles.root, { marginTop, marginBottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Los Resonadores</Text>
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
                    width: photoSize,
                    height: photoSize,
                    borderRadius: photoSize / 2,
                  },
                ]}
              >
                <ExpoImage
                  source={resonador.photo}
                  style={[styles.photo, { width: photoSize, height: photoSize }]}
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
      <Pressable
        onPress={() => router.push("/equipo" as never)}
        accessibilityRole="button"
        accessibilityLabel="Ver todos los Resonadores"
        style={({ pressed }) => [
          styles.allResonadoresButton,
          {
            backgroundColor: WIDGET_GREEN_SOLID,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <Text style={styles.allResonadoresButtonText}>Ver todos los Resonadores</Text>
        <Feather name="chevron-right" size={16} color="#F9F9F9" />
      </Pressable>
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
  allResonadoresButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    overflow: "hidden",
    paddingHorizontal: 28,
    paddingVertical: 9,
    gap: 6,
    marginTop: 29,
    marginBottom: 16,
  },
  allResonadoresButtonText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F9F9F9",
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