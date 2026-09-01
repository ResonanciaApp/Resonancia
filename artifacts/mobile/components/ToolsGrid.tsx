import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useDrawer } from "@/context/DrawerContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";

const PILLS_PAD = 19;
const PILLS_GAP = 8;

const TOOLS = [
  { id: "favoritos", label: "Favoritos", icon: "heart-outline", color: "#F29BB7" },
  { id: "biblioteca", label: "Biblioteca", icon: "book-open-variant", color: "#8ED9FF" },
  { id: "mezclador", label: "Mezclador", icon: "tune-variant", color: "#E6BE67" },
  { id: "videos", label: "Videos", icon: "video-outline", color: "#D5A4E8" },
  { id: "respiracion", label: "Ejercicios de respiración", icon: "weather-windy", color: "#C8A6FF" },
  { id: "diario", label: "Diario", icon: "book-open-page-variant-outline", color: "#E7A36E" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];
type Tool = (typeof TOOLS)[number];

function ToolCard({
  tool,
  foregroundColor,
  pillBackground,
  onPress,
}: {
  tool: Tool;
  foregroundColor: string;
  pillBackground: string;
  onPress: (id: ToolId) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const iconTintOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    scale.stopAnimation();
    iconTintOpacity.stopAnimation();
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 90,
      useNativeDriver: true,
    }).start();
    Animated.timing(iconTintOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    scale.stopAnimation();
    iconTintOpacity.stopAnimation();
    Animated.spring(scale, {
      toValue: 1,
      tension: 180,
      friction: 14,
      useNativeDriver: true,
    }).start();
    Animated.timing(iconTintOpacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      testID={`tool-${tool.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${tool.label}`}
      onPress={() => onPress(tool.id)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          tool.id === "favoritos" && styles.firstCard,
          tool.id === "diario" && styles.lastCard,
          {
            backgroundColor: tool.id === "diario" ? WIDGET_GREEN_SOLID : pillBackground,
            borderWidth: 0,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={tool.icon}
            size={22}
            color="#F9F9F9"
          />
          <Animated.View pointerEvents="none" style={[styles.iconTint, { opacity: iconTintOpacity }]}>
            <MaterialCommunityIcons
              name={tool.icon}
              size={22}
              color={WIDGET_GREEN_SOLID}
            />
          </Animated.View>
        </Animated.View>
        <Text
          style={[styles.label, { color: foregroundColor }]}
          numberOfLines={1}
        >
          {tool.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function ToolsGrid({
  style,
}: {
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const { openCategory } = useCategoryOverlay();
  const { openMixer } = useMixerPanel();
  const { openOverlay } = useDrawer();

  const pillBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : activeSceneId === "indigo"
      ? "rgba(42,40,64,0.65)"
      : "rgba(255,255,255,0.05)";
  const handlePress = useCallback((id: ToolId) => {
    switch (id) {
      case "favoritos":
        openCategory("/favoritos-todos");
        break;
      case "biblioteca":
        router.push("/(tabs)/biblioteca" as never);
        break;
      case "mezclador":
        openMixer();
        break;
      case "videos":
        openCategory("/videos");
        break;
      case "respiracion":
        openCategory("/respiracion");
        break;
      case "diario":
        openOverlay("/diario");
        break;
    }
  }, [openCategory, openMixer, openOverlay]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.row, style]}
      contentContainerStyle={styles.rowContent}
      testID="tools-grid"
    >
      {TOOLS.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          foregroundColor={colors.foreground}
          pillBackground={pillBackground}
          onPress={handlePress}
        />
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
    borderRadius: 13,
    height: 46,
    gap: 12,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 22,
    height: 22,
    position: "relative",
  },
  iconTint: {
    ...StyleSheet.absoluteFillObject,
  },
  firstCard: {
    borderTopLeftRadius: 100,
    borderBottomLeftRadius: 100,
  },
  lastCard: {
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
  },
  label: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});