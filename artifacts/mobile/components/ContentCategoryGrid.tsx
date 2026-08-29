import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";

const GRID_PAD = 19;
const SECTION_GAP = 60;
const CARD_BG = "rgba(255,255,255,0.05)";
const CATEGORY_ICON_COLOR = "#F9F9F9";
const CARD_CATEGORY_COLORS: Record<string, string> = {
  "meditaciones-guiadas": "#7251A3",
  "sonidos-ancestrales": "#9A5A2C",
  "musica-sonidos": "#287F83",
  "ambientales": "#3F704D",
  "__descanzo__": "#32708E",
  "historias": "#691E5E",
  "charlas": "#78221E",
};
const HORIZONTAL_CARD_WIDTHS: Record<string, number> = {
  "meditaciones-guiadas": 164,
  "sonidos-ancestrales": 158,
  "musica-sonidos": 126,
  "ambientales": 144,
  "__descanzo__": 120,
  "historias": 130,
  "charlas": 118,
};

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
  const isDiscoverGrid = hiddenIds.includes("__mezcla__") && hiddenIds.includes("__geometrix__");
  const catBlockBg = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : activeSceneId === "indigo" && isDiscoverGrid
      ? "rgba(42,40,64,0.65)"
      : activeSceneId === "indigo"
        ? "rgba(255,255,255,0.04)"
        : CARD_BG;

  const categoryCards = (
      <>
        {([
          {
            id: "meditaciones-guiadas",
            label: "Meditaciones",
            color: "#C8A6FF",
            icon: (color?: string) => (
              <ExpoImage
                source={require("@/assets/images/cat-meditaciones.png")}
                style={{ width: horizontal ? 14 : 22, height: horizontal ? 14 : 22 }}
                contentFit="contain"
                tintColor={color}
              />
            ),
          },
          {
            id: "sonidos-ancestrales",
            label: "Sonoterapia",
            color: "#E7A36E",
            icon: (color?: string) => (
              <ExpoImage
                source={require("@/assets/images/cat-sesiones.png")}
                style={{ width: horizontal ? 18 : 26, height: horizontal ? 18 : 26 }}
                contentFit="contain"
                tintColor={color}
              />
            ),
          },
          {
            id: "musica-sonidos",
            label: "Música",
            color: "#6FD7D8",
            icon: (color?: string) => (
              <ExpoImage
                source={require("@/assets/images/cat-musica.png")}
                style={{ width: horizontal ? 18 : 26, height: horizontal ? 18 : 26 }}
                contentFit="contain"
                tintColor={color}
              />
            ),
          },
          {
            id: "ambientales",
            label: "Ambientales",
            color: "#86C49A",
            icon: (color?: string) => (
              <MaterialCommunityIcons
                name="leaf"
                size={horizontal ? 18 : 24}
                color={color ?? "#86C49A"}
              />
            ),
          },
          {
            id: "__descanzo__",
            label: "Dormir",
            color: "#8ED9FF",
            icon: (color?: string) => (
              <ExpoImage
                source={require("@/assets/images/cat-luna.png")}
                style={{ width: horizontal ? 14 : 22, height: horizontal ? 14 : 22 }}
                contentFit="contain"
                tintColor={color ?? CATEGORY_ICON_COLOR}
              />
            ),
          },
          {
            id: "historias",
            label: "Historias",
            color: "#D5A4E8",
            icon: (color?: string) => (
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={horizontal ? 17 : 24}
                color={color ?? "#D5A4E8"}
              />
            ),
          },
          {
            id: "charlas",
            label: "Charlas",
            color: "#F0B17A",
            icon: (color?: string) => (
              <MaterialCommunityIcons
                name="message-text-outline"
                size={horizontal ? 17 : 24}
                color={color ?? "#F0B17A"}
              />
            ),
          },
          {
            id: "__mezcla__",
            label: "Mezclador",
            color: "#E6BE67",
            icon: (color?: string) => (
              <MaterialCommunityIcons name="tune-variant" size={horizontal ? 18 : 24} color={color ?? "#E6BE67"} />
            ),
          },
          {
            id: "__geometrix__",
            label: "Geometrix",
            color: "#C4C8D4",
            icon: (color?: string) => (
              <MaterialCommunityIcons
                name="cube-outline"
                size={horizontal ? 18 : 29}
                color={color ?? "#C4C8D4"}
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
                        { width: HORIZONTAL_CARD_WIDTHS[category.id] ?? 140 },
                        (category.id === "sonidos-ancestrales" || category.id === "musica-sonidos") &&
                          styles.horizontalSmallRadiusCard,
                        category.id === "meditaciones-guiadas" && styles.horizontalRightSmallRadiusCard,
                        category.id === "__descanzo__" && styles.horizontalLeftSmallRadiusCard,
                      ]
                    : corners[index] ?? { borderRadius: radius },
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <View style={[StyleSheet.absoluteFill, { backgroundColor: catBlockBg }]} />
                <View
                  style={[
                    styles.iconWrap,
                    horizontal && styles.horizontalIconCircle,
                    horizontal && {
                      backgroundColor: CARD_CATEGORY_COLORS[category.id] ?? category.color,
                    },
                  ]}
                >
                  {category.icon(horizontal || isDiscoverGrid ? CATEGORY_ICON_COLOR : undefined)}
                </View>
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
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 0,
    paddingHorizontal: 12,
    borderWidth: 0,
  },
  horizontalSmallRadiusCard: {
    borderRadius: 23,
  },
  horizontalRightSmallRadiusCard: {
    borderTopRightRadius: 23,
    borderBottomRightRadius: 23,
  },
  horizontalLeftSmallRadiusCard: {
    borderTopLeftRadius: 23,
    borderBottomLeftRadius: 23,
  },
  iconWrap: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalIconCircle: {
    height: 28,
    width: 28,
    borderRadius: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FBFBFB",
  },
  horizontalLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 0,
  },
});