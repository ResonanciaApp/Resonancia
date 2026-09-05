import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useDrawer } from "@/context/DrawerContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useColors } from "@/hooks/useColors";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";

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
  { id: "mixer", label: "Mezclador", icon: "tune-variant", route: "__mixer_panel" },
  { id: "breathing", label: "Respiración", icon: "weather-windy", route: "/respiracion" },
  { id: "journal", label: "Diario", icon: "book-open-page-variant-outline", route: "/diario" },
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

type AccessCardItem =
  | (typeof ACCESS_CARDS)[number]
  | (typeof EXTRA_ACCESS_CARDS)[number]
  | (typeof ACCESS_CARDS_WITH_VIDEOS)[number];

function QuickAccessCard({
  access,
  width,
  cardBackground,
  cardOpacity,
  showCardBorders,
  cardBorderWidth,
  cardBorderColor,
  cardCornerRadius,
  roundedSide,
  joinedContentCorners,
  horizontal,
  largeLabel,
  profile,
  profileWide,
  cardHeightOffset,
  foregroundColor,
  onPress,
}: {
  access: AccessCardItem;
  width: number;
  cardBackground: string;
  cardOpacity: number;
  showCardBorders: boolean;
  cardBorderWidth: number;
  cardBorderColor: string;
  cardCornerRadius: number;
  roundedSide?: "left" | "right";
  joinedContentCorners: boolean;
  horizontal: boolean;
  largeLabel: boolean;
  profile: boolean;
  profileWide: boolean;
  cardHeightOffset: number;
  foregroundColor: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);
  const cardHeight = (profileWide ? 44 : horizontal ? 56 : 76) + cardHeightOffset;

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
      testID={`access-${access.id}`}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${access.label}`}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.card,
          horizontal && styles.horizontalCard,
          profile && styles.profileCard,
          profileWide && styles.profileWideCard,
          {
            width,
            height: cardHeight,
            backgroundColor: isPressed ? WIDGET_GREEN_SOLID : cardBackground,
            borderWidth: showCardBorders ? cardBorderWidth : 0,
            borderColor: cardBorderColor,
            borderRadius: cardCornerRadius,
            ...(roundedSide === "left"
              ? {
                  borderTopLeftRadius: cardHeight / 2,
                  borderBottomLeftRadius: cardHeight / 2,
                  borderTopRightRadius: cardCornerRadius,
                  borderBottomRightRadius: cardCornerRadius,
                }
              : roundedSide === "right"
                ? {
                    borderTopLeftRadius: cardCornerRadius,
                    borderBottomLeftRadius: cardCornerRadius,
                    borderTopRightRadius: cardHeight / 2,
                    borderBottomRightRadius: cardHeight / 2,
                  }
                : null),
            ...(joinedContentCorners
              ? {
                  borderTopLeftRadius: access.id === "encounters" ? 0 : 25,
                  borderTopRightRadius: access.id === "sessions" ? 0 : 25,
                  borderBottomLeftRadius:
                    access.id === "favorites" || access.id === "downloads" ? 0 : 25,
                  borderBottomRightRadius:
                    access.id === "history" || access.id === "favorites" ? 0 : 25,
                }
              : null),
            opacity: isPressed ? cardOpacity * 0.75 : cardOpacity,
            transform: [{ scale }],
          },
        ]}
      >
        <MaterialCommunityIcons
          name={access.icon}
          size={22}
          color={isPressed ? "#FFFFFF" : foregroundColor}
        />
        <Text
          style={[
            styles.label,
            horizontal && styles.horizontalLabel,
            largeLabel && styles.largeLabel,
            profile && styles.profileLabel,
            profileWide && styles.profileWideLabel,
            { color: isPressed ? "#FFFFFF" : foregroundColor },
          ]}
          numberOfLines={1}
        >
          {access.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function QuickAccessSection({
  includeExtras = false,
  replaceLibraryWithVideos = false,
  profileLayout = false,
  accessIds,
  horizontalIds,
  largeLabelIds,
  cardGap = GRID_GAP,
  showTitle = true,
  title = "Mis accesos",
  showCardBorders = true,
  cardBorderWidth = 1,
  cardBorderColor = "rgba(255,255,255,0.1)",
  cardCornerRadius = 16,
  leftPillIds,
  rightPillIds,
  joinedContentCorners = false,
  cardBackgroundColor,
  cardOpacity = 1,
  cardHeightOffset = 0,
  horizontalPadding = GRID_PAD,
  twoRowCarousel = false,
  style,
}: {
  includeExtras?: boolean;
  replaceLibraryWithVideos?: boolean;
  profileLayout?: boolean;
  accessIds?: AccessId[];
  horizontalIds?: AccessId[];
  largeLabelIds?: AccessId[];
  cardGap?: number;
  showTitle?: boolean;
  title?: string;
  showCardBorders?: boolean;
  cardBorderWidth?: number;
  cardBorderColor?: string;
  cardCornerRadius?: number;
  leftPillIds?: AccessId[];
  rightPillIds?: AccessId[];
  joinedContentCorners?: boolean;
  cardBackgroundColor?: string;
  cardOpacity?: number;
  cardHeightOffset?: number;
  horizontalPadding?: number;
  twoRowCarousel?: boolean;
  style?: object;
}) {
  const { width } = useWindowDimensions();
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const { openOverlay } = useDrawer();
  const { openCategory } = useCategoryOverlay();
  const { openMixer } = useMixerPanel();
  const cardWidth = Math.max(0, Math.floor((width - horizontalPadding * 2 - cardGap * 2) / 3));
  const profileWideCardWidth = Math.max(
    0,
    Math.floor((width - horizontalPadding * 2 - cardGap) / 2),
  );
  const twoRowCardWidth = Math.max(
    0,
    Math.floor((width - horizontalPadding * 2 - cardGap * 2) / 2.25) + 10,
  );
  const cardBackground = cardBackgroundColor ?? (
    activeSceneId === "tibet"
      ? "rgba(0,0,0,0.15)"
      : isIndigoThemeId(activeSceneId)
        ? "rgba(181,211,255,0.057)"
        : activeSceneId === "indigo2"
          ? "rgba(191,207,255,0.055)"
        : "rgba(181,211,255,0.057)"
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
    if (id === "mixer") {
      openMixer();
      return;
    }
    if (id === "breathing") {
      openCategory(access.route);
      return;
    }
    if (id === "journal") {
      openOverlay(access.route);
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
  }, [openCategory, openMixer, openOverlay]);

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
  const twoRowColumns = Array.from(
    { length: Math.ceil(visibleAccessCards.length / 2) },
    (_, index) => visibleAccessCards.slice(index * 2, index * 2 + 2),
  );
  return (
    <View style={[styles.section, style]} testID="quick-access-section">
      {showTitle && <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>}
      {twoRowCarousel ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -horizontalPadding }}
          contentContainerStyle={{ paddingHorizontal: horizontalPadding, gap: cardGap }}
        >
          {twoRowColumns.map((column, columnIndex) => (
            <View key={`column-${columnIndex}`} style={{ gap: cardGap }}>
              {column.map((access) => (
                <QuickAccessCard
                  key={access.id}
                  access={access}
                  width={twoRowCardWidth}
                  cardBackground={cardBackground}
                  cardOpacity={cardOpacity}
                  showCardBorders={showCardBorders}
                  cardBorderWidth={cardBorderWidth}
                  cardBorderColor={cardBorderColor}
                  cardCornerRadius={cardCornerRadius}
                  roundedSide={
                    leftPillIds?.includes(access.id)
                      ? "left"
                      : rightPillIds?.includes(access.id)
                        ? "right"
                        : undefined
                  }
                  joinedContentCorners={false}
                  horizontal
                  largeLabel={largeLabelIds?.includes(access.id) ?? false}
                  profile={false}
                  profileWide={false}
                  cardHeightOffset={cardHeightOffset}
                  foregroundColor={colors.foreground}
                  onPress={() => handlePress(access.id)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.accessRow, { gap: cardGap }]}>
          {visibleAccessCards.map((access) => (
            <QuickAccessCard
              key={access.id}
              access={access}
              width={
                profileLayout && access.id !== "saved" && access.id !== "library" &&
                access.id !== "favorites" && access.id !== "history"
                  ? profileWideCardWidth
                  : horizontalIds?.includes(access.id)
                    ? profileWideCardWidth
                    : cardWidth
              }
              cardBackground={cardBackground}
              cardOpacity={cardOpacity}
              showCardBorders={showCardBorders}
              cardBorderWidth={cardBorderWidth}
              cardBorderColor={cardBorderColor}
              cardCornerRadius={cardCornerRadius}
              roundedSide={
                leftPillIds?.includes(access.id)
                  ? "left"
                  : rightPillIds?.includes(access.id)
                    ? "right"
                    : undefined
              }
              joinedContentCorners={joinedContentCorners}
              horizontal={horizontalIds?.includes(access.id) ?? false}
              largeLabel={largeLabelIds?.includes(access.id) ?? false}
              profile={profileLayout}
              profileWide={
                profileLayout && access.id !== "saved" && access.id !== "library" &&
                access.id !== "favorites" && access.id !== "history"
              }
              cardHeightOffset={cardHeightOffset}
              foregroundColor={colors.foreground}
              onPress={() => handlePress(access.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 35,
    marginBottom: 35,
  },
  pressable: {
    borderRadius: 16,
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
    backgroundColor: "rgba(181,211,255,0.057)",
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
  largeLabel: {
    fontSize: 14,
  },
  profileLabel: {
    fontSize: 15,
  },
  profileWideLabel: {
    textAlign: "center",
  },
});