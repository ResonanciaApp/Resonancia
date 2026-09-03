import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { MixCover } from "@/app/mi-mezcla/[id]";
import { getTwoCardCarouselCardWidth } from "@/constants/carousel";
import { useMixer } from "@/context/MixerContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { useRoutineTheme } from "@/hooks/useRoutineTheme";
import { PressScale } from "@/components/PressScale";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";

const GRID_PAD = 14;
const CARD_GAP = 14;

export function ProfileMixCarousel({
  marginBottom = 32,
}: {
  marginBottom?: number;
}) {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const routineTheme = useRoutineTheme();
  const { theme } = useSceneTheme();
  const { presets, stopAll } = useMixer();
  const { openMixer } = useMixerPanel();
  const cardWidth = getTwoCardCarouselCardWidth(width, GRID_PAD);
  const accent = theme.accent ?? colors.accent;
  const cardBackground = theme.id === "tibet"
    ? "rgba(0,0,0,0.15)"
    : theme.id === "indigo"
      ? "rgba(42,40,64,0.65)"
      : theme.id === "indigo2"
        ? "rgba(255,255,255,0.025)"
        : "rgba(255,255,255,0.05)";

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
    <View style={[styles.section, { marginBottom }]}>
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
                borderColor: routineTheme.completion,
              },
            ]}
          >
            <Feather name="plus" size={23} color={routineTheme.completion} />
            <Text style={[styles.addLabel, { color: routineTheme.completion }]}>
              Crear una mezcla
            </Text>
          </View>
        </PressScale>

        {newestPresets.length === 0 &&
          ["empty-left", "empty-right"].map((placeholderId) => (
            <View
              key={placeholderId}
              style={[
                styles.placeholderCard,
                {
                  width: cardWidth,
                  height: cardWidth,
                  backgroundColor: cardBackground,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="tune-variant"
                size={44}
                color={WIDGET_GREEN_SOLID}
                style={styles.emptyPlaceholderIcon}
              />
            </View>
          ))}

        {newestPresets.map((mix) => {
          const hasCover = Boolean(
            mix.image ||
            mix.coverUri ||
            mix.coverGeometryId ||
            mix.coverCreationId,
          );
          return (
            <PressScale
              key={mix.id}
              onPress={() => router.push(`/mi-mezcla/${encodeURIComponent(mix.id)}` as never)}
              style={{ width: cardWidth }}
            >
              {hasCover ? (
                <MixCover mix={mix} size={cardWidth} radius={13} />
              ) : (
                <View
                  style={[
                    styles.placeholderCard,
                    {
                      width: cardWidth,
                      height: cardWidth,
                      backgroundColor: cardBackground,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="tune-variant"
                    size={44}
                    color={WIDGET_GREEN_SOLID}
                    style={styles.placeholderIcon}
                  />
                </View>
              )}
              <Text style={styles.mixName} numberOfLines={2}>
                {mix.name}
              </Text>
              <Text style={[styles.soundCount, { color: accent }]} numberOfLines={1}>
                {mix.sounds.length} sonido{mix.sounds.length === 1 ? "" : "s"}
              </Text>
            </PressScale>
          );
        })}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: GRID_PAD,
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
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  placeholderCard: {
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholderIcon: {
    opacity: 0.5,
  },
  emptyPlaceholderIcon: {
    opacity: 0.3,
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