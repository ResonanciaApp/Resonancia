import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

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
  { id: "bitacora", label: "Bitácora", icon: "history", color: "#B8C5F4" },
  { id: "respiracion", label: "Ejercicios Respiración", icon: "weather-windy", color: "#C8A6FF" },
  { id: "diario", label: "Diario", icon: "book-open-page-variant-outline", color: "#E7A36E" },
] as const;

const LIBRARY_TOOL = {
  id: "biblioteca",
  label: "Biblioteca",
  icon: "book-open-variant",
  color: "#E7C978",
} as const;

type ToolId = (typeof TOOLS)[number]["id"] | typeof LIBRARY_TOOL["id"];
type Tool = (typeof TOOLS)[number] | typeof LIBRARY_TOOL;

export function ToolsGrid({
  style,
  replaceVideosWithLibrary = false,
}: {
  style?: StyleProp<ViewStyle>;
  replaceVideosWithLibrary?: boolean;
}) {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const { openCategory } = useCategoryOverlay();
  const { openMixer } = useMixerPanel();
  const { openGeometrix } = useGeometrixPanel();
  const { openLib, openOverlay } = useDrawer();

  const cardWidth = Math.max(
    0,
    Math.floor((width - GRID_PAD * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS),
  );
  const cardHeight = Math.max(100, Math.min(132, Math.round(cardWidth * 0.96)));
  const cardBackground = "rgba(42,40,64,0.40)";
  const cardBorderWidth = activeSceneId === "tibet" || activeSceneId === "indigo" ? 1 : 0;
  const tools: readonly Tool[] = replaceVideosWithLibrary
    ? TOOLS.map((tool) =>
        tool.id === "videos"
          ? LIBRARY_TOOL
          : tool,
      )
    : TOOLS;

  const handlePress = useCallback((id: ToolId) => {
    switch (id) {
      case "mezclador":
        openMixer();
        break;
      case "geometrix":
        openGeometrix();
        break;
      case "biblioteca":
        openLib();
        break;
      case "videos":
        openCategory("/videos");
        break;
      case "bitacora":
        openOverlay("/historial");
        break;
      case "respiracion":
        openCategory("/respiracion");
        break;
      case "diario":
        openOverlay("/diario");
        break;
    }
  }, [openCategory, openMixer, openGeometrix, openLib, openOverlay]);

  return (
    <View style={[styles.grid, style]} testID="tools-grid">
      {tools.map((tool) => (
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
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    justifyContent: "center",
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