import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
}: {
  marginTop?: number;
  marginBottom?: number;
}) {
  const { openCategory } = useCategoryOverlay();
  const { openMixer } = useMixerPanel();
  const { openGeometrix } = useGeometrixPanel();
  const { activeSceneId } = useSceneTheme();
  const catBlockBg = activeSceneId === "indigo" ? "rgba(255,255,255,0.04)" : CARD_BG;

  return (
    <View
      style={[styles.section, { marginBottom, marginTop }]}
      testID="content-category-grid"
    >
      <View style={styles.grid}>
        {([
          {
            id: "meditaciones-guiadas",
            label: "Meditaciones",
            color: "#C8A6FF",
            icon: () => (
              <ExpoImage
                source={require("@/assets/images/cat-meditaciones.png")}
                style={{ width: 22, height: 22 }}
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
                style={{ width: 26, height: 26 }}
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
                style={{ width: 26, height: 26 }}
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
                style={{ width: 22, height: 22 }}
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
        ] as const).map((category, index) => {
          const radius = 27;
          const corners = [
            {
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: 0,
            },
            {
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: radius,
            },
            {
              borderTopLeftRadius: radius,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: 0,
            },
            {
              borderTopLeftRadius: 0,
              borderTopRightRadius: radius,
              borderBottomLeftRadius: 0,
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
                corners[index],
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <View style={[StyleSheet.absoluteFill, { backgroundColor: catBlockBg }]} />
              <View style={styles.iconWrap}>{category.icon(category.color)}</View>
              <Text style={styles.label}>{category.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SECTION_GAP - 20,
    paddingHorizontal: GRID_PAD,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 20,
    justifyContent: "center",
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
});