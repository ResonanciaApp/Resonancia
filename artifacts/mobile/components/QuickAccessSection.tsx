import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useDrawer } from "@/context/DrawerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

const GRID_PAD = 19;
const GRID_GAP = 7;

const ACCESS_CARDS = [
  { id: "saved", label: "Guardados", icon: "bookmark-outline", route: "/intencion?tab=guardados" },
  { id: "favorites", label: "Favoritos", icon: "heart-outline", route: "/favoritos-todos" },
  { id: "history", label: "Historial", icon: "history", route: "/historial" },
] as const;

type AccessId = (typeof ACCESS_CARDS)[number]["id"];

export function QuickAccessSection() {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const { openOverlay } = useDrawer();
  const cardWidth = Math.max(0, Math.floor((width - GRID_PAD * 2 - GRID_GAP * 2) / 3));
  const cardBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : activeSceneId === "indigo"
      ? "rgba(42,40,64,0.40)"
      : "rgba(255,255,255,0.05)";

  const handlePress = useCallback((id: AccessId) => {
    const access = ACCESS_CARDS.find((item) => item.id === id);
    if (!access) return;
    if (id === "saved") {
      router.push(access.route as never);
      return;
    }
    openOverlay(access.route);
  }, [openOverlay]);

  return (
    <View style={styles.section} testID="quick-access-section">
      <Text style={[styles.title, { color: colors.foreground }]}>Mis accesos</Text>
      <View style={styles.accessRow}>
        {ACCESS_CARDS.map((access) => (
          <Pressable
            key={access.id}
            testID={`access-${access.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${access.label}`}
            onPress={() => handlePress(access.id)}
            style={({ pressed }) => [
              styles.card,
              {
                width: cardWidth,
                backgroundColor: cardBackground,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={access.icon}
              size={22}
              color={colors.foreground}
            />
            <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1}>
              {access.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 35,
    marginBottom: 35,
  },
  title: {
    marginBottom: 16,
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  accessRow: {
    flexDirection: "row",
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  card: {
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});