import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useDrawer } from "@/context/DrawerContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

const GRID_PAD = 14;
const GRID_GAP = 7;

const ACCESS_CARDS = [
  { id: "saved", label: "Guardados", icon: "bookmark-outline", route: "/intencion?tab=guardados" },
  { id: "favorites", label: "Favoritos", icon: "heart-outline", route: "/favoritos-todos" },
  { id: "history", label: "Historial", icon: "history", route: "/historial" },
] as const;

const EXTRA_ACCESS_CARDS = [
  { id: "downloads", label: "Descargas", icon: "download-outline", route: "" },
  { id: "sessions", label: "Sesiones", icon: "calendar-outline", route: "/mis-sesiones" },
  { id: "encounters", label: "Encuentros", icon: "account-group-outline", route: "/explore" },
  { id: "library", label: "Biblioteca", icon: "book-open-variant", route: "__biblioteca_overlay" },
] as const;

const ACCESS_CARDS_WITH_EXTRAS = [
  EXTRA_ACCESS_CARDS[2],
  ACCESS_CARDS[1],
  ACCESS_CARDS[2],
  EXTRA_ACCESS_CARDS[0],
  EXTRA_ACCESS_CARDS[1],
  ACCESS_CARDS[0],
] as const;

const ACCESS_CARDS_WITH_VIDEOS = [
  { id: "videos", label: "Videos", icon: "video-outline", route: "/videos" },
  ACCESS_CARDS[1],
  ACCESS_CARDS[2],
  EXTRA_ACCESS_CARDS[0],
  EXTRA_ACCESS_CARDS[1],
  ACCESS_CARDS[0],
] as const;

const PROFILE_ACCESS_CARDS = [
  EXTRA_ACCESS_CARDS[2],
  ACCESS_CARDS[1],
  ACCESS_CARDS[2],
  EXTRA_ACCESS_CARDS[0],
  EXTRA_ACCESS_CARDS[1],
] as const;

type AccessId =
  | (typeof ACCESS_CARDS)[number]["id"]
  | (typeof EXTRA_ACCESS_CARDS)[number]["id"]
  | (typeof ACCESS_CARDS_WITH_VIDEOS)[number]["id"];

export function QuickAccessSection({
  includeExtras = false,
  replaceLibraryWithVideos = false,
  profileLayout = false,
  accessIds,
  horizontalIds,
  cardGap = GRID_GAP,
  showTitle = true,
  title = "Mis accesos",
  showCardBorders = true,
  cardBackgroundColor,
  cardOpacity = 1,
  style,
}: {
  includeExtras?: boolean;
  replaceLibraryWithVideos?: boolean;
  profileLayout?: boolean;
  accessIds?: AccessId[];
  horizontalIds?: AccessId[];
  cardGap?: number;
  showTitle?: boolean;
  title?: string;
  showCardBorders?: boolean;
  cardBackgroundColor?: string;
  cardOpacity?: number;
  style?: object;
}) {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const { openOverlay } = useDrawer();
  const { openCategory } = useCategoryOverlay();
  const cardWidth = Math.max(0, Math.floor((width - GRID_PAD * 2 - cardGap * 2) / 3));
  const profileWideCardWidth = Math.max(0, Math.floor((width - GRID_PAD * 2 - cardGap) / 2));
  const cardBackground = cardBackgroundColor ?? (
    activeSceneId === "tibet"
      ? "rgba(0,0,0,0.15)"
      : activeSceneId === "indigo"
        ? "rgba(42,40,64,0.65)"
        : "rgba(255,255,255,0.05)"
  );

  const handlePress = useCallback((id: AccessId) => {
    const access = [...ACCESS_CARDS, ...EXTRA_ACCESS_CARDS].find((item) => item.id === id);
    if (!access) return;
    if (id === "downloads") {
      Alert.alert("Descargas", "La descarga estará disponible próximamente.");
      return;
    }
    if (id === "library") {
      router.push("/(tabs)/biblioteca" as never);
      return;
    }
    if (id === "videos") {
      openCategory("/videos");
      return;
    }
    if (id === "encounters") {
      openCategory(access.route);
      return;
    }
    if (id === "saved") {
      router.push(access.route as never);
      return;
    }
    openOverlay(access.route);
  }, [openCategory, openOverlay]);

  const accessCards = profileLayout
    ? PROFILE_ACCESS_CARDS
    : replaceLibraryWithVideos
      ? ACCESS_CARDS_WITH_VIDEOS
      : ACCESS_CARDS_WITH_EXTRAS;
  const allAccessCards = [...ACCESS_CARDS, ...EXTRA_ACCESS_CARDS];
  const visibleAccessCards = accessIds
    ? accessIds
        .map((id) => allAccessCards.find((access) => access.id === id))
        .filter((access): access is (typeof allAccessCards)[number] => Boolean(access))
    : includeExtras
      ? accessCards
      : ACCESS_CARDS;
  return (
    <View style={[styles.section, style]} testID="quick-access-section">
      {showTitle && <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>}
      <View style={[styles.accessRow, { gap: cardGap }]}>
        {visibleAccessCards.map((access) => (
          <Pressable
            key={access.id}
            testID={`access-${access.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${access.label}`}
            onPress={() => handlePress(access.id)}
            style={({ pressed }) => [
              styles.card,
              horizontalIds?.includes(access.id) && styles.horizontalCard,
              profileLayout && styles.profileCard,
              profileLayout && access.id !== "saved" && access.id !== "library" &&
                access.id !== "favorites" &&
                access.id !== "history" && styles.profileWideCard,
              {
                width: profileLayout && access.id !== "saved" && access.id !== "library" &&
                  access.id !== "favorites" &&
                  access.id !== "history"
                  ? profileWideCardWidth
                  : horizontalIds?.includes(access.id)
                    ? profileWideCardWidth
                    : cardWidth,
                backgroundColor: cardBackground,
                borderWidth: showCardBorders ? 1 : 0,
                opacity: pressed ? cardOpacity * 0.75 : cardOpacity,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={access.icon}
              size={22}
              color={colors.foreground}
            />
            <Text
              style={[
                styles.label,
                horizontalIds?.includes(access.id) && styles.horizontalLabel,
                profileLayout && styles.profileLabel,
                profileLayout && access.id !== "saved" && access.id !== "library" &&
                  access.id !== "favorites" &&
                  access.id !== "history" && styles.profileWideLabel,
                { color: colors.foreground },
              ]}
              numberOfLines={1}
            >
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
    flexWrap: "wrap",
    gap: GRID_GAP,
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
  horizontalCard: {
    flexDirection: "row",
    height: 56,
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  profileCard: {
    // La primera fila conserva el formato compacto de tres accesos.
  },
  profileWideCard: {
    flexDirection: "row",
    height: 44,
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  label: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  horizontalLabel: {
    textAlign: "center",
    fontSize: 14,
  },
  profileLabel: {
    fontSize: 15,
  },
  profileWideLabel: {
    textAlign: "center",
  },
});