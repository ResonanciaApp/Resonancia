import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
            style={({ pressed }) => [styles.resonador, { opacity: pressed ? 0.75 : 1 }]}
          >
            <View style={styles.photoFrame}>
              <ExpoImage source={resonador.photo} style={styles.photo} contentFit="cover" />
            </View>
            <Text numberOfLines={2} style={styles.name}>
              {resonador.name}
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
    color: "#F9F9F9",
  },
  viewAll: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  carousel: {
    marginTop: 20,
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  resonador: {
    alignItems: "center",
    width: 120,
  },
  photoFrame: {
    width: 102,
    height: 142,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(218,212,236,0.35)",
    marginBottom: 12,
  },
  photo: {
    width: 102,
    height: 142,
  },
  name: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#F9F9F9",
    textAlign: "center",
    lineHeight: 19,
  },
});