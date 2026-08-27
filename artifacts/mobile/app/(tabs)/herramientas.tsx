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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { AstralGuidanceSection } from "@/components/AstralGuidanceSection";
import { QuickAccessSection } from "@/components/QuickAccessSection";
import { EncuentrosResonadoresSection } from "@/components/EncuentrosResonadoresSection";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useDrawer } from "@/context/DrawerContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

const GRID_PAD = 19;
const GRID_GAP = 7;
const GRID_COLUMNS = 3;

const TOOLS = [
  { id: "mezclador", label: "Mezclador", icon: "tune-variant", color: "#E6BE67" },
  { id: "geometrix", label: "Geometrix", icon: "cube-outline", color: "#C4C8D4" },
  { id: "videos", label: "Videos", icon: "video-outline", color: "#8ED9FF" },
  { id: "respiracion", label: "Respiración", icon: "weather-windy", color: "#C8A6FF" },
  { id: "biblioteca", label: "Biblioteca", icon: "bookmark-outline", color: "#D4B7FF" },
  { id: "diario", label: "Diario", icon: "book-open-page-variant-outline", color: "#E7A36E" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

export default function HerramientasScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme, activeSceneId } = useSceneTheme();
  const { openCategory } = useCategoryOverlay();
  const { openMixer } = useMixerPanel();
  const { openGeometrix } = useGeometrixPanel();
  const { openLib, openOverlay } = useDrawer();

  const cardWidth = Math.max(
    0,
    Math.floor((width - GRID_PAD * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS),
  );
  const cardHeight = Math.max(100, Math.min(132, Math.round(cardWidth * 0.96)));
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const cardBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : activeSceneId === "indigo"
      ? "rgba(255,255,255,0.05)"
      : "rgba(0,0,0,0.2)";
  const cardBorderWidth = activeSceneId === "tibet" || activeSceneId === "indigo" ? 1 : 0;

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

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Herramientas</Text>
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
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: cardBorderWidth,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={tool.icon}
                size={29}
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

        <QuickAccessSection />

        <View style={styles.fullBleedSection}>
          <EncuentrosResonadoresSection titleMarginTop={0} />
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
  sectionTitle: {
    marginBottom: 16,
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    justifyContent: "center",
    marginTop: -6,
  },
  fullBleedSection: {
    marginHorizontal: -GRID_PAD,
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
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.1,
    marginTop: 11,
    textAlign: "center",
  },
});
