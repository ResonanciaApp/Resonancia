import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
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
  { id: "premium", label: "Premium", icon: "star-outline", route: "/membresia" },
  { id: "sessions", label: "Sesiones", icon: "calendar-month-outline", route: "/mis-sesiones" },
  { id: "favorites", label: "Favoritos", icon: "heart-outline", route: "/favoritos-todos" },
  { id: "history", label: "Historial", icon: "history", route: "/historial" },
  { id: "friends", label: "Amigos", icon: "account-multiple-outline", route: "/amigos" },
  { id: "groups", label: "Grupos", icon: "account-group-outline", route: "/grupos" },
] as const;

type AccessId = (typeof ACCESS_CARDS)[number]["id"];

export function QuickAccessSection() {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const { openOverlay } = useDrawer();
  const cardWidth = Math.max(0, Math.floor((width - GRID_PAD * 2 - GRID_GAP) / 2));
  const cardBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : "rgba(255,255,255,0.05)";

  const handlePress = useCallback((id: AccessId) => {
    const access = ACCESS_CARDS.find((item) => item.id === id);
    if (!access) return;
    if (id === "premium") {
      router.push(access.route as never);
      return;
    }
    openOverlay(access.route);
  }, [openOverlay]);

  return (
    <View style={styles.section} testID="quick-access-section">
      <Text style={[styles.title, { color: colors.foreground }]}>Mis accesos</Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {Array.from({ length: Math.ceil(ACCESS_CARDS.length / 2) }, (_, columnIndex) => (
          <View key={`access-column-${columnIndex}`} style={[styles.column, { width: cardWidth }]}>
            {ACCESS_CARDS.slice(columnIndex * 2, columnIndex * 2 + 2).map((access) => (
              <Pressable
                key={access.id}
                testID={`access-${access.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${access.label}`}
                onPress={() => handlePress(access.id)}
                style={({ pressed }) => [
                  styles.card,
                  {
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
        ))}
      </ScrollView>
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
  scroll: {
    marginHorizontal: -GRID_PAD,
  },
  scrollContent: {
    flexDirection: "row",
    gap: GRID_GAP,
    paddingHorizontal: GRID_PAD,
    paddingRight: GRID_PAD + 24,
  },
  column: {
    gap: GRID_GAP,
  },
  card: {
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
  label: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
  },
});