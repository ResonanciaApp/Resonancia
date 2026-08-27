import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { AstralGuidanceSection } from "@/components/AstralGuidanceSection";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useDrawer } from "@/context/DrawerContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

const GRID_PAD = 19;
const GRID_GAP = 7;

const TOOLS = [
  { id: "mezclador", label: "Mezclador", icon: "tune-variant", color: "#E6BE67" },
  { id: "geometrix", label: "Geometrix", icon: "cube-outline", color: "#C4C8D4" },
  { id: "videos", label: "Videos", icon: "video-outline", color: "#8ED9FF" },
  { id: "respiracion", label: "Respiración", icon: "weather-windy", color: "#C8A6FF" },
  { id: "biblioteca", label: "Biblioteca", icon: "bookmark-outline", color: "#D4B7FF" },
  { id: "diario", label: "Diario", icon: "book-open-page-variant-outline", color: "#E7A36E" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

const ACCESS_CARDS = [
  { id: "premium", label: "Tu Premium", icon: "star-outline", route: "/membresia" },
  { id: "sessions", label: "Mis sesiones", icon: "calendar-month-outline", route: "/mis-sesiones" },
  { id: "favorites", label: "Mis favoritos", icon: "heart-outline", route: "/favoritos-todos" },
  { id: "history", label: "Historial", icon: "history", route: "/historial" },
  { id: "friends", label: "Amigos", icon: "account-multiple-outline", route: "/amigos" },
  { id: "groups", label: "Grupos", icon: "account-group-outline", route: "/grupos" },
] as const;

type AccessId = (typeof ACCESS_CARDS)[number]["id"];

export default function HerramientasScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme, activeSceneId } = useSceneTheme();
  const { openCategory } = useCategoryOverlay();
  const { openMixer } = useMixerPanel();
  const { openGeometrix } = useGeometrixPanel();
  const { openLib, openOverlay } = useDrawer();

  const cardWidth = Math.max(0, Math.floor((width - GRID_PAD * 2 - GRID_GAP) / 2));
  const cardHeight = Math.max(100, Math.min(132, Math.round(cardWidth * 0.96)));
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const cardBackground = activeSceneId === "indigo"
    ? "rgba(255,255,255,0.04)"
    : "rgba(255,255,255,0.05)";

  const handlePress = useCallback((id: ToolId) => {
    switch (id) {
      case "mezclador":
        openMixer();
        break;
      case "geometrix":
        openGeometrix();
        break;
      case "videos":
        openCategory("/videos");
        break;
      case "respiracion":
        openCategory("/respiracion");
        break;
      case "biblioteca":
        openLib();
        break;
      case "diario":
        openOverlay("/diario");
        break;
    }
  }, [openCategory, openMixer, openGeometrix, openLib, openOverlay]);

  const handleAccessPress = useCallback((id: AccessId) => {
    const access = ACCESS_CARDS.find((item) => item.id === id);
    if (!access) return;
    if (id === "premium") {
      router.push(access.route as never);
      return;
    }
    openOverlay(access.route);
  }, [openOverlay]);

  return (
    <View style={[styles.root, { backgroundColor: theme.gradient[0] as string }]}>
      <SacredBackground variant="gradient" />
      <StatusBar hidden />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad + 8,
            paddingBottom: 160 + bottomPad,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Recursos</Text>

        <View style={styles.grid} testID="tools-grid">
          {TOOLS.map((tool) => (
            <Pressable
              key={tool.id}
              testID={`tool-${tool.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${tool.label}`}
              onPress={() => handlePress(tool.id)}
              style={({ pressed }) => [
                styles.card,
                {
                  width: cardWidth,
                  height: cardHeight,
                  backgroundColor: cardBackground,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={tool.icon}
                size={33}
                color={tool.color}
              />
              <Text
                style={[styles.label, { color: colors.foreground }]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.86}
              >
                {tool.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.accessSection}>
          <Text style={[styles.accessTitle, { color: colors.foreground }]}>Mis accesos</Text>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accessScrollContent}
          >
            {Array.from({ length: Math.ceil(ACCESS_CARDS.length / 2) }, (_, columnIndex) => (
              <View key={`access-column-${columnIndex}`} style={[styles.accessColumn, { width: cardWidth }]}>
                {ACCESS_CARDS.slice(columnIndex * 2, columnIndex * 2 + 2).map((access) => (
                  <Pressable
                    key={access.id}
                    testID={`access-${access.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir ${access.label}`}
                    onPress={() => handleAccessPress(access.id)}
                    style={({ pressed }) => [
                      styles.accessCard,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={access.icon}
                      size={22}
                      color={colors.foreground}
                    />
                    <Text style={[styles.accessLabel, { color: colors.foreground }]} numberOfLines={1}>
                      {access.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>

        <AstralGuidanceSection
          backgroundColor={
            activeSceneId === "tibet"
              ? "rgba(0,0,0,0.15)"
              : "rgba(38,3,84,0.15)"
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: GRID_PAD,
  },
  title: {
    marginBottom: 24,
    fontFamily: "Manrope",
    fontSize: 31,
    fontWeight: "700",
    letterSpacing: -0.3,
    textAlign: "left",
    transform: [{ translateY: 1 }],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    justifyContent: "center",
    marginTop: -6,
  },
  card: {
    alignItems: "center",
    borderRadius: 27,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  label: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
    marginTop: 11,
    textAlign: "center",
  },
  accessSection: {
    marginTop: 30,
  },
  accessTitle: {
    marginBottom: 16,
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  accessScrollContent: {
    gap: GRID_GAP,
    paddingRight: 24,
  },
  accessColumn: {
    gap: GRID_GAP,
  },
  accessCard: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
  },
  accessLabel: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
  },
});
