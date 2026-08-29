import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useDrawer } from "@/context/DrawerContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

const PILLS_PAD = 19;
const PILLS_GAP = 8;

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
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const { openCategory } = useCategoryOverlay();
  const { openMixer } = useMixerPanel();
  const { openGeometrix } = useGeometrixPanel();
  const { openLib, openOverlay } = useDrawer();

  const pillBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : activeSceneId === "indigo"
      ? "rgba(42,40,64,0.65)"
      : "rgba(255,255,255,0.05)";
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.row, style]}
      contentContainerStyle={styles.rowContent}
      testID="tools-grid"
    >
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
              backgroundColor: pillBackground,
              borderWidth: 0,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={tool.icon}
            size={22}
            color="#F4F4F4"
          />
          <Text
            style={[styles.label, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {tool.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: -PILLS_PAD,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: PILLS_GAP,
    paddingHorizontal: PILLS_PAD,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 27,
    height: 46,
    gap: 12,
    paddingHorizontal: 16,
  },
  label: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});