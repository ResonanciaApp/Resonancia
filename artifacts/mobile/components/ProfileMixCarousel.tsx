import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { MixCover } from "@/app/mi-mezcla/[id]";
import { getTwoCardCarouselCardWidth } from "@/constants/carousel";
import { useMixer } from "@/context/MixerContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { PressScale } from "@/components/PressScale";

const GRID_PAD = 14;
const CARD_GAP = 14;

export function ProfileMixCarousel() {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { presets, stopAll } = useMixer();
  const { openMixer } = useMixerPanel();
  const cardWidth = getTwoCardCarouselCardWidth(width, GRID_PAD);
  const accent = theme.accent ?? colors.accent;

  const newestPresets = useMemo(
    () =>
      presets
        .map((preset, index) => ({
          preset,
          index,
          createdAt: Date.parse(preset.createdAt),
        }))
        .sort((a, b) => {
          const aTime = Number.isFinite(a.createdAt) ? a.createdAt : 0;
          const bTime = Number.isFinite(b.createdAt) ? b.createdAt : 0;
          return bTime - aTime || a.index - b.index;
        })
        .map(({ preset }) => preset),
    [presets],
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Mis mezclas</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        <PressScale
          onPress={() => {
            stopAll();
            openMixer();
          }}
          style={{ width: cardWidth }}
        >
          <View
            style={[
              styles.addCard,
              {
                width: cardWidth,
                height: cardWidth,
                borderColor: accent,
              },
            ]}
          >
            <Feather name="plus" size={23} color={accent} />
            <Text style={[styles.addLabel, { color: accent }]}>Añadir una mezcla</Text>
          </View>
        </PressScale>

        {newestPresets.map((mix) => (
          <PressScale
            key={mix.id}
            onPress={() => router.push(`/mi-mezcla/${encodeURIComponent(mix.id)}` as never)}
            style={{ width: cardWidth }}
          >
            <MixCover mix={mix} size={cardWidth} radius={15} />
            <Text style={styles.mixName} numberOfLines={2}>
              {mix.name}
            </Text>
            <Text style={[styles.soundCount, { color: accent }]} numberOfLines={1}>
              {mix.sounds.length} sonido{mix.sounds.length === 1 ? "" : "s"}
            </Text>
          </PressScale>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 17,
  },
  scroll: {
    marginHorizontal: -GRID_PAD,
  },
  content: {
    paddingHorizontal: GRID_PAD,
    gap: CARD_GAP,
  },
  addCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  addLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  mixName: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  soundCount: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    marginTop: 2,
  },
});