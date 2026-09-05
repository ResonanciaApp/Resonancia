import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import { useDrawer } from "@/context/DrawerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useColors } from "@/hooks/useColors";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";

const PILLS_PAD = 19;
const PILLS_GAP = 8;

const TOOLS = [
  { id: "mood-register", label: "Registro de ánimo", icon: "emoticon-happy-outline", color: "#8ED9FF" },
  { id: "favorites", label: "Favoritos", icon: "heart-outline", color: "#E6BE67" },
  { id: "history", label: "Historial", icon: "history", color: "#C8A6FF" },
  { id: "downloads", label: "Descargas", icon: "download-outline", color: "#E7A36E" },
  { id: "mood-history", label: "Historial de estado de ánimo", icon: "chart-timeline-variant", color: "#8ED9FF" },
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
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    scale.stopAnimation();
    Animated.spring(scale, {
      toValue: 1,
      tension: 180,
      friction: 14,
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
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.card,
          tool.id === "mood-register" && styles.firstCard,
          tool.id === "mood-history" && styles.lastCard,
          {
            backgroundColor: isPressed ? WIDGET_GREEN_SOLID : pillBackground,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={tool.icon}
            size={22}
            color={isPressed ? "#0E0E17" : "#FFFFFF"}
          />
        </Animated.View>
        <Text
          style={[styles.label, { color: isPressed ? "#0E0E17" : foregroundColor }]}
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
  onOpenMoodPicker,
}: {
  style?: StyleProp<ViewStyle>;
  onOpenMoodPicker?: () => void;
}) {
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const { openOverlay } = useDrawer();

  const pillBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : isIndigoThemeId(activeSceneId)
      ? "rgba(181,211,255,0.057)"
      : activeSceneId === "indigo2"
        ? "rgba(191,207,255,0.096)"
      : "rgba(181,211,255,0.057)";
  const handlePress = useCallback((id: ToolId) => {
    switch (id) {
      case "mood-register":
        onOpenMoodPicker?.();
        break;
      case "favorites":
        openOverlay("/favoritos-todos");
        break;
      case "history":
        openOverlay("/historial");
        break;
      case "downloads":
        Alert.alert("Descargas", "La descarga estará disponible próximamente.");
        break;
      case "mood-history":
        openOverlay("/historial-emociones");
        break;
    }
  }, [onOpenMoodPicker, openOverlay]);

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
    height: 52,
    gap: 12,
    paddingHorizontal: 16,
  },
  pressable: {
    borderRadius: 13,
  },
  iconWrap: {
    width: 22,
    height: 22,
    position: "relative",
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
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});