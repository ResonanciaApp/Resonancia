import { Feather } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { isIndigoThemeId } from "@/config/scene-themes";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SESSIONS, type Session } from "@/data/sessions";
import {
  TAG_CARDS,
  slugifyThemeTag,
} from "@/data/tags";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const COL_GAP = 12;
const CARD_W = (width - H_PAD * 2 - COL_GAP) / 2;
const DURATION_FILTERS = [
  { label: "5–10 min", min: 0, max: 10 },
  { label: "10–20 min", min: 11, max: 20 },
  { label: "20–30 min", min: 21, max: 30 },
  { label: "30+ min", min: 31, max: Number.POSITIVE_INFINITY },
] as const;

/**
 * The API stores the display label on each session and exposes a slug on the
 * Explore section. Resolve the slug back to that exact label before filtering
 * so custom labels work just like the predefined thematic tags.
 */
function resolveThemeLabel(slug: string | undefined): string | undefined {
  if (!slug) return undefined;

  const predefined = TAG_CARDS.find((tag) => tag.id === slug);
  if (predefined) return predefined.label;

  const labels = new Set(
    SESSIONS.flatMap((session) => session.themeTag ?? []),
  );
  const dynamicLabel = [...labels].find((label) => slugifyThemeTag(label) === slug);
  if (dynamicLabel) return dynamicLabel;

  const readableSlug = slug.replace(/-+/g, " ").trim();
  return readableSlug
    ? readableSlug.charAt(0).toUpperCase() + readableSlug.slice(1)
    : undefined;
}

export default function ThemeTagScreen({ id: idProp }: { id?: string } = {}) {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = idProp ?? params.id;
  const slug = Array.isArray(rawId) ? rawId[0] : rawId;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const overlayBack = useBackOverride();
  const overlay = useCategoryOverlayOptional();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { version: catalogVersion } = useCatalog();
  const { theme } = useSceneTheme();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const tagLabel = useMemo(
    () => resolveThemeLabel(slug ? decodeURIComponent(slug) : undefined),
    [slug, catalogVersion],
  );
  const tag = useMemo(
    () => TAG_CARDS.find((candidate) => candidate.id === slug),
    [slug],
  );
  const inactiveFilterBackground =
    theme.id === "tibet"
      ? "rgba(0,0,0,0.15)"
      : isIndigoThemeId(theme.id)
        ? "rgba(255,255,255,0.05)"
        : "rgba(255,255,255,0.05)";
  const inactiveFilterBorder =
    theme.id === "indigo2"
      ? "rgba(255,255,255,0.04)"
      : "rgba(255,255,255,0.1)";
  const sessions = useMemo(
    () =>
      tagLabel
        ? SESSIONS.filter((session) =>
            (session.themeTag as readonly string[] | undefined)?.includes(tagLabel),
          )
        : [],
    [tagLabel, catalogVersion],
  );
  const [durationFilter, setDurationFilter] = React.useState<string | null>(null);
  const filteredSessions = useMemo(() => {
    if (!durationFilter) return sessions;
    const filter = DURATION_FILTERS.find((candidate) => candidate.label === durationFilter);
    if (!filter) return sessions;
    return sessions.filter(
      (session) => session.duration >= filter.min && session.duration <= filter.max,
    );
  }, [durationFilter, sessions]);

  const [stickyActive, setStickyActive] = React.useState(false);
  const [headerBottomY, setHeaderBottomY] = React.useState(Number.POSITIVE_INFINITY);
  const stickyHeaderOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(stickyHeaderOpacity, {
      toValue: stickyActive ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [stickyActive, stickyHeaderOpacity]);

  const goBack = () => (overlayBack ? overlayBack() : router.back());

  const openSession = (session: Session) => {
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (session.skipMiniPlayer) {
      playSession(session);
      return;
    }
    if (session.skipDetail) {
      playSession(session);
      router.push("/player" as never);
      return;
    }
    if (overlay) {
      overlay.openCategory(`/session/${session.id}`);
    } else {
      router.push(`/session/${session.id}` as never);
    }
  };

  if (!tagLabel) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 60 + bottomPad }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const y = event.nativeEvent.contentOffset.y;
          const active = y > headerBottomY - topPad - 8;
          if (active !== stickyActive) setStickyActive(active);
        }}
      >
        <View
          style={styles.legacyHeader}
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            setHeaderBottomY(y + height);
          }}
        >
          <View style={styles.hero}>
            {tag?.image ? (
              <ExpoImage
                source={tag.image}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.gradient[0] as string }]} />
            )}
            <LinearGradient
              colors={["rgba(6,6,12,0)", "rgba(6,6,12,0.28)", theme.gradient[0] as string]}
              locations={[0, 0.68, 1]}
              style={StyleSheet.absoluteFill}
            />
            <Pressable
              onPress={goBack}
              hitSlop={10}
              style={({ pressed }) => [
                styles.heroBackBtn,
                {
                  top: topPad + 8,
                  backgroundColor: "rgba(12,10,22,0.48)",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="chevron-left" size={26} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.intro}>
            <Text style={[styles.legacyPageTitle, { color: colors.foreground }]}>
              {tagLabel}
            </Text>
            {tag?.description ? (
              <Text style={[styles.pageDescription, { color: colors.foreground }]}>
                {tag.description}
              </Text>
            ) : null}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <Pressable
            onPress={() => setDurationFilter(null)}
            style={[
              styles.filterPill,
              durationFilter === null ? styles.filterPillSelected : styles.filterPillIdle,
              durationFilter === null
                ? null
                : {
                    backgroundColor: inactiveFilterBackground,
                    borderColor: inactiveFilterBorder,
                  },
            ]}
          >
            <Text
              style={[
                styles.filterLabel,
                durationFilter === null ? styles.filterLabelSelected : styles.filterLabelIdle,
              ]}
            >
              Todos
            </Text>
          </Pressable>
          {DURATION_FILTERS.map((filter) => {
            const active = durationFilter === filter.label;
            return (
              <Pressable
                key={filter.label}
                onPress={() => setDurationFilter(active ? null : filter.label)}
                style={[
                  styles.filterPill,
                  active ? styles.filterPillSelected : styles.filterPillIdle,
                  active
                    ? null
                    : {
                        backgroundColor: inactiveFilterBackground,
                        borderColor: inactiveFilterBorder,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    active ? styles.filterLabelSelected : styles.filterLabelIdle,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {sessions.length === 0 ? (
          <View style={[styles.emptySlot, { borderColor: colors.border }]}>
            <Feather name="inbox" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Aún no hay sesiones
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Estamos preparando nuevas experiencias para esta temática
            </Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={[styles.emptySlot, { borderColor: colors.border }]}>
            <Feather name="clock" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Sin sesiones en este filtro
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Prueba con otra duración
            </Text>
          </View>
        ) : (
          <View style={styles.sessionGrid}>
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                width={CARD_W}
                style={{ marginRight: 0 }}
                showCardMetadata
                showAuthorAvatar={false}
                overridePress={() => openSession(session)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad + 8,
            backgroundColor: theme.gradient[0] as string,
            opacity: stickyHeaderOpacity,
          },
        ]}
        pointerEvents={stickyActive ? "auto" : "none"}
      >
        <View style={styles.stickyHeaderRow}>
          <View style={styles.stickyHeaderSpacer} />
          <View style={styles.stickyTitleCol}>
            <Text
              style={[styles.stickyTitle, { color: colors.foreground }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {tagLabel}
            </Text>
          </View>
          <View style={styles.stickyHeaderSpacer} />
        </View>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: "rgba(255,255,255,0.08)",
              opacity: pressed ? 0.7 : 1,
              top: topPad + 2,
            },
          ]}
        >
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  legacyHeader: {
    width: "100%",
  },
  hero: {
    width: "100%",
    height: Math.round(width * 0.72),
    overflow: "hidden",
  },
  heroBackBtn: {
    position: "absolute",
    left: H_PAD,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: {
    paddingHorizontal: H_PAD,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: "center",
  },
  legacyPageTitle: {
    fontFamily: "Manrope",
    fontSize: 26,
    lineHeight: 33,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
    marginBottom: 6,
  },
  pageDescription: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    opacity: 0.92,
  },
  filtersRow: {
    paddingHorizontal: H_PAD,
    paddingBottom: 4,
    gap: 9,
  },
  filterPill: {
    minHeight: 38,
    borderRadius: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  filterPillSelected: {
    backgroundColor: WIDGET_GREEN_SOLID,
    borderColor: WIDGET_GREEN_SOLID,
  },
  filterPillIdle: {
    borderColor: "rgba(255,255,255,0.16)",
  },
  filterLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  filterLabelSelected: {
    color: "#FFFFFF",
  },
  filterLabelIdle: {
    color: "#F4F4F4",
  },
  header: {
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    left: H_PAD,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    maxWidth: width - H_PAD * 2 - 56,
    textAlign: "center",
  },
  sessionGrid: {
    paddingHorizontal: H_PAD,
    paddingTop: 36,
    paddingBottom: 40,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 35,
  },
  emptySlot: {
    marginHorizontal: H_PAD,
    marginTop: 36,
    minHeight: 160,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    fontFamily: "Manrope",
    fontSize: 13,
    textAlign: "center",
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    minHeight: 48,
    paddingHorizontal: H_PAD,
    paddingBottom: 22,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  stickyHeaderRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stickyHeaderSpacer: { width: 40 },
  stickyTitleCol: {
    flex: 1,
    alignItems: "center",
  },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});