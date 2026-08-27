import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";

const GRID_PAD = 19;
const SECTION_GAP = 60;
const CARD_BG = "rgba(255,255,255,0.05)";

/**
 * Accesos de exploración compartidos por Inicio y Descubrir.
 * Las acciones de Mezclador y Geometrix abren sus paneles, no rutas.
 */
export function ContentCategoryGrid({
  marginTop = 22,
  marginBottom = SECTION_GAP - 20,
  hiddenIds = [],
  horizontal = false,
}: {
  marginTop?: number;
  marginBottom?: number;
  hiddenIds?: readonly string[];
  horizontal?: boolean;
}) {
  const { openCategory } = useCategoryOverlay();
  const { openMixer } = useMixerPanel();
  const { openGeometrix } = useGeometrixPanel();
  const { activeSceneId } = useSceneTheme();
  const { width: windowWidth } = useWindowDimensions();
  const catBlockBg = activeSceneId === "indigo" ? "rgba(255,255,255,0.04)" : CARD_BG;
  const isDiscoverGrid = hiddenIds.includes("__mezcla__") && hiddenIds.includes("__geometrix__");
  const horizontalCardWidth = Math.max(
    1,
    Math.min(185, Math.floor((windowWidth - GRID_PAD * 2 - 8) / 2)),
  );

  const categoryCards = (
      <>
        {([
          {
            id: "meditaciones-guiadas",
            label: "Meditaciones",
            color: "#C8A6FF",
            icon: () => (
              <ExpoImage
                source={require("@/assets/images/cat-meditaciones.png")}
                style={{ width: horizontal ? 20 : 22, height: horizontal ? 20 : 22 }}
                contentFit="contain"
              />
            ),
          },
          {
            id: "sonidos-ancestrales",
            label: "Sonoterapia",
            color: "#E7A36E",
            icon: () => (
              <ExpoImage
                source={require("@/assets/images/cat-sesiones.png")}
                style={{ width: horizontal ? 24 : 26, height: horizontal ? 24 : 26 }}
                contentFit="contain"
              />
            ),
          },
          {
            id: "musica-sonidos",
            label: "Música",
            color: "#6FD7D8",
            icon: () => (
              <ExpoImage
                source={require("@/assets/images/cat-musica.png")}
                style={{ width: horizontal ? 24 : 26, height: horizontal ? 24 : 26 }}
                contentFit="contain"
              />
            ),
          },
          {
            id: "__descanzo__",
            label: "Dormir",
            color: "#8ED9FF",
            icon: () => (
              <ExpoImage
                source={require("@/assets/images/cat-luna.png")}
                style={{ width: horizontal ? 20 : 22, height: horizontal ? 20 : 22 }}
                contentFit="contain"
                tintColor="#f9f9f9"
              />
            ),
          },
          {
            id: "__mezcla__",
            label: "Mezclador",
            color: "#E6BE67",
            icon: (color: string) => (
              <MaterialCommunityIcons name="tune-variant" size={24} color={color} />
            ),
          },
          {
            id: "__geometrix__",
            label: "Geometrix",
            color: "#C4C8D4",
            icon: () => (
              <ExpoImage
                source={require("@/assets/images/cubo-4.png")}
                style={{ width: 26, height: 26 }}
                contentFit="contain"
              />
            ),
          },
        ] as const)
          .filter((category) => !hiddenIds.includes(category.id))
          .map((category, index) => {
          const radius = 27;
          const corners = [
            {
              borderTopLeftRadius: radius,
              borderTopRightRadius: isDiscoverGrid ? 10 : radius,
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: 10,
            },
            {
              borderTopLeftRadius: isDiscoverGrid ? 10 : radius,
              borderTopRightRadius: radius,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: radius,
            },
            {
              borderTopLeftRadius: radius,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: isDiscoverGrid ? 10 : 0,
            },
            {
              borderTopLeftRadius: 10,
              borderTopRightRadius: radius,
              borderBottomLeftRadius: isDiscoverGrid ? 10 : 0,
              borderBottomRightRadius: radius,
            },
            {
              borderTopLeftRadius: radius,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: radius,
            },
            {
              borderTopLeftRadius: 0,
              borderTopRightRadius: radius,
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: radius,
            },
          ] as const;

            return (
              <Pressable
                key={category.id}
                testID={`content-category-${category.id}`}
                onPress={() => {
                  if (category.id === "__descanzo__") openCategory("/(tabs)/descanzo");
                  else if (category.id === "__mezcla__") openMixer();
                  else if (category.id === "__geometrix__") openGeometrix();
                  else openCategory(`/category/${category.id}`);
                }}
                style={({ pressed }) => [
                  styles.card,
                  horizontal
                    ? [
                        styles.horizontalCard,
                        { width: horizontalCardWidth },
                        (category.id === "sonidos-ancestrales" || category.id === "musica-sonidos") &&
                          styles.horizontalSmallRadiusCard,
                        category.id === "meditaciones-guiadas" && styles.horizontalRightSmallRadiusCard,
                        category.id === "__descanzo__" && styles.horizontalLeftSmallRadiusCard,
                      ]
                    : corners[index],
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <View style={[StyleSheet.absoluteFill, { backgroundColor: catBlockBg }]} />
                <View style={styles.iconWrap}>{category.icon(category.color)}</View>
                <Text style={[styles.label, horizontal && styles.horizontalLabel]}>{category.label}</Text>
              </Pressable>
            );
          })}
      </>
  );

  return (
    <View
      style={[styles.section, horizontal && styles.horizontalSection, { marginBottom, marginTop }]}
      testID="content-category-grid"
    >
      {horizontal ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          {categoryCards}
        </ScrollView>
      ) : (
        <View style={styles.grid}>{categoryCards}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SECTION_GAP - 20,
    paddingHorizontal: GRID_PAD,
  },
  horizontalSection: {
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 20,
    justifyContent: "center",
  },
  horizontalContent: {
    flexDirection: "row",
    paddingHorizontal: GRID_PAD,
    paddingRight: GRID_PAD + 24,
    gap: 8,
    marginTop: 5,
  },
  card: {
    width: "48%",
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
    borderWidth: 0,
  },
  horizontalCard: {
    borderRadius: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 15.5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  horizontalSmallRadiusCard: {
    borderRadius: 10,
  },
  horizontalRightSmallRadiusCard: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  horizontalLeftSmallRadiusCard: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  iconWrap: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FBFBFB",
  },
  horizontalLabel: {
    textAlign: "center",
    flexShrink: 0,
  },
});