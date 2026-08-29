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

export function ResonadoresSection({ marginTop = 0, marginBottom = 32 }: Props) {
  const { resonadores } = useResonadores();
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const cardGap = 15;
  const cardWidth = Math.round((screenWidth - 40 - cardGap) / 1.8);

  return (
    <View style={[styles.root, { marginTop, marginBottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Los Resonadores</Text>
        <Pressable
          onPress={() => router.push("/equipo" as never)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={[styles.viewAll, { color: colors.primary }]}>Ver todos</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
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
            <View style={[styles.photoFrame, { width: cardWidth, height: cardWidth }]}>
              <ExpoImage
                source={resonador.photo}
                style={[styles.photo, { width: cardWidth, height: cardWidth }]}
                contentFit="cover"
              />
            </View>
            <Text numberOfLines={2} style={styles.name}>
              {resonador.name}
            </Text>
            <Text numberOfLines={1} style={styles.subtype}>
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
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    flex: 1,
    marginBottom: 0,
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    color: "#F4F4F4",
  },
  viewAll: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  carousel: {
    marginTop: 8,
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  resonador: {
    alignItems: "center",
  },
  photoFrame: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 12,
  },
  photo: {
  },
  name: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#F4F4F4",
    textAlign: "center",
    lineHeight: 19,
  },
  subtype: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "transparent",
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    color: "#F4F4F4",
    textAlign: "center",
    lineHeight: 14,
    overflow: "hidden",
  },
});