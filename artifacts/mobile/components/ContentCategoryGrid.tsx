import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  CONTENT_CAROUSEL_GAP,
  CONTENT_CAROUSEL_HEIGHT_SCALE,
} from "@/constants/carousel";
import { SESSION_CARD_METADATA_HEIGHT_SCALE } from "@/components/SessionCardMetadataOverlay";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  CONTENT_CATEGORIES,
  type ContentCategoryDefinition,
} from "@/data/content-categories";

const GRID_PAD = 14;
const SECTION_GAP = 60;
const CARD_BG = "rgba(255,255,255,0.05)";
const CATEGORY_ICON_COLOR = "#F9F9F9";
const DISCOVER_GRID_GAP = 9;
const DISCOVER_PRIMARY_CARD_SIZE = Math.floor(
  (Dimensions.get("window").width - GRID_PAD * 2 - DISCOVER_GRID_GAP) / 2,
);
const DISCOVER_SECONDARY_CARD_SIZE = Math.floor(
  (Dimensions.get("window").width - GRID_PAD * 2 - DISCOVER_GRID_GAP * 3) / 3.2,
);
const WATERCOLOR_TRAILING_PEEK = 25;
export const WATERCOLOR_CARD_SIZE = Math.max(
  120,
  Math.round(
    (
      Dimensions.get("window").width
      - GRID_PAD
      - CONTENT_CAROUSEL_GAP * 2
      - WATERCOLOR_TRAILING_PEEK
    ) / 2,
  ),
);
export const WATERCOLOR_CARD_HEIGHT = Math.round(
  (WATERCOLOR_CARD_SIZE + 50) *
    SESSION_CARD_METADATA_HEIGHT_SCALE *
    CONTENT_CAROUSEL_HEIGHT_SCALE,
);
export const WATERCOLOR_CARD_RADIUS = 19;
export const WATERCOLOR_CARD_GAP = CONTENT_CAROUSEL_GAP;

const WATERCOLOR_CATEGORY_IMAGES: Partial<
  Record<ContentCategoryDefinition["id"], number>
> = {
  "meditaciones-guiadas": require("@/assets/images/discover2-category-meditaciones.jpg"),
  "sonidos-ancestrales": require("@/assets/images/discover2-category-sonoterapia.jpg"),
  "musica-sonidos": require("@/assets/images/discover2-category-musica.jpg"),
  ambientales: require("@/assets/images/discover2-category-ambientales.jpg"),
  historias: require("@/assets/images/discover2-category-historias.jpg"),
  charlas: require("@/assets/images/discover2-category-charlas.jpg"),
};

function renderCategoryIcon(
  category: ContentCategoryDefinition,
  horizontal: boolean,
  forceWhite: boolean,
) {
  const color = forceWhite ? CATEGORY_ICON_COLOR : undefined;
  switch (category.id) {
    case "meditaciones-guiadas":
      return (
        <ExpoImage
          source={require("@/assets/images/cat-meditaciones.png")}
          style={{ width: horizontal ? 11 : 22, height: horizontal ? 11 : 22 }}
          contentFit="contain"
          tintColor={color}
        />
      );
    case "sonidos-ancestrales":
      return (
        <ExpoImage
          source={require("@/assets/images/cat-sesiones.png")}
          style={{ width: horizontal ? 15 : 26, height: horizontal ? 15 : 26 }}
          contentFit="contain"
          tintColor={color}
        />
      );
    case "musica-sonidos":
      return (
        <ExpoImage
          source={require("@/assets/images/cat-musica.png")}
          style={{ width: horizontal ? 15 : 26, height: horizontal ? 15 : 26 }}
          contentFit="contain"
          tintColor={color}
        />
      );
    case "__descanzo__":
      return (
        <ExpoImage
          source={require("@/assets/images/cat-luna.png")}
          style={{ width: horizontal ? 11 : 22, height: horizontal ? 11 : 22 }}
          contentFit="contain"
          tintColor={color ?? CATEGORY_ICON_COLOR}
        />
      );
    case "ambientales":
      return (
        <MaterialCommunityIcons
          name="leaf"
          size={horizontal ? 15 : 24}
          color={color ?? category.color}
        />
      );
    case "historias":
      return (
        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={horizontal ? 14 : 24}
          color={color ?? category.color}
        />
      );
    case "charlas":
      return (
        <MaterialCommunityIcons
          name="message-text-outline"
          size={horizontal ? 14 : 24}
          color={color ?? category.color}
        />
      );
    case "__mezcla__":
      return (
        <MaterialCommunityIcons
          name="tune-variant"
          size={horizontal ? 15 : 24}
          color={color ?? category.color}
        />
      );
    case "__geometrix__":
      return (
        <MaterialCommunityIcons
          name="cube-outline"
          size={horizontal ? 15 : 29}
          color={color ?? category.color}
        />
      );
  }
}

/**
 * Accesos de exploración compartidos por Inicio y Descubrir.
 * Las acciones de Mezclador y Geometrix abren sus paneles, no rutas.
 */
export function ContentCategoryGrid({
  marginTop = 22,
  marginBottom = SECTION_GAP - 20,
  hiddenIds = [],
  horizontal = false,
  visualVariant = "default",
  squareWatercolorCards = false,
  discoverTieredLayout = false,
}: {
  marginTop?: number;
  marginBottom?: number;
  hiddenIds?: readonly string[];
  horizontal?: boolean;
  visualVariant?: "default" | "watercolor";
  squareWatercolorCards?: boolean;
  discoverTieredLayout?: boolean;
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
      : activeSceneId === "indigo2" && isDiscoverGrid
        ? "rgba(255,255,255,0.025)"
      : activeSceneId === "indigo"
        ? "rgba(255,255,255,0.04)"
        : CARD_BG;
  const visibleCategories = CONTENT_CATEGORIES.filter(
    (category) => !hiddenIds.includes(category.id),
  );
  const openContentCategory = (category: ContentCategoryDefinition) => {
    if (category.id === "__descanzo__") openCategory("/(tabs)/descanzo");
    else if (category.id === "__mezcla__") openMixer();
    else if (category.id === "__geometrix__") openGeometrix();
    else openCategory(`/category/${category.id}`);
  };

  if (discoverTieredLayout) {
    const primaryCategories = visibleCategories.filter(
      (category) =>
        category.id === "meditaciones-guiadas" ||
        category.id === "sonidos-ancestrales",
    );
    const secondaryCategories = visibleCategories.filter(
      (category) =>
        category.id === "musica-sonidos" ||
        category.id === "ambientales" ||
        category.id === "historias" ||
        category.id === "charlas",
    );

    const renderDiscoverCard = (
      category: ContentCategoryDefinition,
      width: number,
      secondary: boolean,
      height = width,
    ) => {
      return (
        <Pressable
          key={category.id}
          testID={`content-category-${category.id}`}
          onPress={() => openContentCategory(category)}
          style={({ pressed }) => [
            styles.discoverCard,
            {
              width,
              height,
              backgroundColor: catBlockBg,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <View style={styles.discoverCardIcon}>
            {renderCategoryIcon(category, false, false)}
          </View>
          <Text
            style={[
              styles.discoverCardLabel,
              secondary && styles.discoverSecondaryCardLabel,
            ]}
            numberOfLines={2}
          >
            {category.label}
          </Text>
        </Pressable>
      );
    };

    return (
      <View
        style={{ marginTop, marginBottom }}
        testID="content-category-grid"
      >
        <View style={styles.discoverPrimaryRow}>
          {primaryCategories.map((category) =>
            renderDiscoverCard(
              category,
              DISCOVER_PRIMARY_CARD_SIZE,
              false,
              DISCOVER_PRIMARY_CARD_SIZE - 40,
            ),
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.discoverSecondaryRow}
        >
          {secondaryCategories.map((category) =>
            renderDiscoverCard(category, DISCOVER_SECONDARY_CARD_SIZE, true),
          )}
        </ScrollView>
      </View>
    );
  }

  const categoryCards = (
      <>
        {visibleCategories
          .map((category, index) => {
          const watercolorImage = WATERCOLOR_CATEGORY_IMAGES[category.id];
          const isWatercolorCard =
            horizontal && visualVariant === "watercolor" && watercolorImage !== undefined;
          const radius = 27;
          const corners = [
            {
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: 10,
            },
            {
              borderTopLeftRadius: radius,
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
                onPress={() => openContentCategory(category)}
                style={({ pressed }) => [
                  styles.card,
                  horizontal
                    ? isWatercolorCard
                      ? styles.watercolorCard
                      : [
                        styles.horizontalCard,
                        { width: category.horizontalWidth },
                        (category.id === "sonidos-ancestrales" || category.id === "musica-sonidos") &&
                          styles.horizontalSmallRadiusCard,
                        category.id === "meditaciones-guiadas" && styles.horizontalRightSmallRadiusCard,
                        category.id === "__descanzo__" && styles.horizontalLeftSmallRadiusCard,
                      ]
                    : isDiscoverGrid
                      ? { borderRadius: 18 }
                      : corners[index] ?? { borderRadius: radius },
                  isWatercolorCard && squareWatercolorCards && {
                    height: WATERCOLOR_CARD_SIZE,
                  },
                  isWatercolorCard
                    ? { transform: [{ scale: pressed ? 0.96 : 1 }] }
                    : { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                {({ pressed }) =>
                  isWatercolorCard ? (
                    <>
                      <ExpoImage
                        source={watercolorImage}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={180}
                      />
                      <View
                        pointerEvents="none"
                        style={[
                          StyleSheet.absoluteFill,
                          styles.watercolorOverlay,
                          pressed && styles.watercolorOverlayPressed,
                        ]}
                      />
                      <Text style={styles.watercolorLabel}>{category.label}</Text>
                    </>
                  ) : (
                    <>
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: catBlockBg }]} />
                      <View
                        style={[
                          styles.iconWrap,
                          horizontal && styles.horizontalIconCircle,
                          horizontal && {
                            backgroundColor: category.cardColor,
                          },
                        ]}
                      >
                        {renderCategoryIcon(category, horizontal, horizontal)}
                      </View>
                      <Text style={[styles.label, horizontal && styles.horizontalLabel]}>{category.label}</Text>
                    </>
                  )
                }
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
          contentContainerStyle={[
            styles.horizontalContent,
            visualVariant === "watercolor" && styles.watercolorHorizontalContent,
          ]}
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
  discoverPrimaryRow: {
    flexDirection: "row",
    gap: DISCOVER_GRID_GAP,
    paddingHorizontal: GRID_PAD,
    marginBottom: DISCOVER_GRID_GAP,
  },
  discoverSecondaryRow: {
    gap: DISCOVER_GRID_GAP,
    paddingHorizontal: GRID_PAD,
    paddingRight: GRID_PAD + 18,
  },
  discoverCard: {
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 12,
  },
  discoverCardIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  discoverCardLabel: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  discoverSecondaryCardLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  watercolorHorizontalContent: {
    gap: WATERCOLOR_CARD_GAP,
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
  },
  watercolorCard: {
    width: WATERCOLOR_CARD_SIZE,
    height: WATERCOLOR_CARD_HEIGHT,
    borderRadius: WATERCOLOR_CARD_RADIUS,
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  watercolorOverlay: {
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  watercolorOverlayPressed: {
    backgroundColor: "transparent",
  },
  watercolorLabel: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: "700",
    marginTop: 12,
    marginLeft: 12,
    maxWidth: WATERCOLOR_CARD_SIZE - 24,
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
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
    height: 25,
    width: 25,
    borderRadius: 12.5,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FBFBFB",
  },
  horizontalLabel: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    flexShrink: 0,
  },
});