import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useRef } from "react";
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
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useColors } from "@/hooks/useColors";

const PILLS_PAD = 19;
const PILLS_GAP = 8;

const TOOLS = [
  { id: "mood-register", label: "Registro de ánimo", icon: "emoticon-happy-outline", color: "#8ED9FF" },
  { id: "favorites", label: "Favoritos", icon: "heart-outline", color: "#E6BE67" },
  { id: "library", label: "Biblioteca", icon: "bookshelf", color: "#E6BE67" },
  { id: "mixer", label: "Mezclador", icon: "tune-vertical", color: "#8ED9FF" },
  { id: "notes", label: "Mis Notas", icon: "notebook-outline", color: "#C8A6FF" },
  { id: "breathing", label: "Ejercicios de respiración", icon: "weather-windy", color: "#8ED9FF" },
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

  const handlePressIn = () => {
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: 0.97,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
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
            backgroundColor: pillBackground,
            transform: [{ scale }],
          },
        ]}
      >
        <Animated.View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={tool.icon}
            size={22}
            color="#FFFFFF"
          />
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
  onOpenMoodPicker,
}: {
  style?: StyleProp<ViewStyle>;
  onOpenMoodPicker?: () => void;
}) {
  const colors = useColors();
  const { openOverlay } = useDrawer();
  const { openMixer } = useMixerPanel();

  const pillBackground = "rgba(18,10,33,0.37)";
  const handlePress = useCallback((id: ToolId) => {
    switch (id) {
      case "mood-register":
        onOpenMoodPicker?.();
        break;
      case "favorites":
        openOverlay("/favoritos-todos");
        break;
      case "library":
        router.push("/(tabs)/biblioteca" as never);
        break;
      case "mixer":
        openMixer();
        break;
      case "notes":
        openOverlay("/diario");
        break;
      case "breathing":
        router.push("/respiracion" as never);
        break;
      case "mood-history":
        router.push("/historial-emociones" as never);
        break;
    }
  }, [onOpenMoodPicker, openMixer, openOverlay]);

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