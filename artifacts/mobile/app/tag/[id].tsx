import { Feather } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { openPremiumPlans } from "@/lib/premiumGate";
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

import { SessionCarousel } from "@/components/SessionCarousel";
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
import {
  buildOtherThemeInternalRoute,
  groupOtherThemeInternalSessions,
  hasOtherThemeInternalTag,
  isOtherThemeInternalTag,
  parseOtherThemeInternalTag,
} from "@/lib/explore-other-themes";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 16;
const THEME_DETAIL_DESCRIPTION_BY_SLUG: Record<string, string> = {
  "para-la-ansiedad": "Calma tu mente y recupera la paz",
  "energiza-tus-mananas": "Activa tu energía para comenzar",
  "foco-concentracion": "Claridad para sostener tu atención",
  "suelto-la-rabia": "Libera y transforma lo que sientes",
  "crecimiento-personal": "Expande tu conciencia y tus recursos",
  "armonia-familiar": "Fortalece vínculos y crea armonía",
  "respiracion-consciente": "Regresa al presente con tu respiración",
  "meditaciones-activas": "Conecta cuerpo y mente en movimiento",
  astrologia: "Conecta con los ciclos y la energía cósmica",
};

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
    SESSIONS.flatMap((session) =>
      (session.themeTag ?? []).filter((label) => !isOtherThemeInternalTag(label)),
    ),
  );
  const dynamicLabel = [...labels].find((label) => slugifyThemeTag(label) === slug);
  if (dynamicLabel) return dynamicLabel;

  const readableSlug = slug.replace(/-+/g, " ").trim();
  return readableSlug
    ? readableSlug.charAt(0).toUpperCase() + readableSlug.slice(1)
    : undefined;
}

export default function ThemeTagScreen({
  id: idProp,
  internalLabel: internalLabelProp,
}: { id?: string; internalLabel?: string } = {}) {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = idProp ?? params.id;
  const slug = Array.isArray(rawId) ? rawId[0] : rawId;
  const internalLabel = internalLabelProp;
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
  const sessions = useMemo(
    () =>
      tagLabel
        ? SESSIONS.filter((session) =>
            (session.themeTag as readonly string[] | undefined)?.some(
              (tag) =>
                tag === tagLabel ||
                tag === slug ||
                parseOtherThemeInternalTag(tag)?.parentSlug === slug,
            ),
          )
        : [],
    [catalogVersion, slug, tagLabel],
  );
  const internalGroups = useMemo(
    () => groupOtherThemeInternalSessions(sessions, slug ?? "", tagLabel),
    [sessions, slug, tagLabel],
  );
  const mainSessions = useMemo(
    () =>
      internalLabel
        ? internalGroups.get(internalLabel) ?? []
        : sessions.filter(
            (session) => !hasOtherThemeInternalTag(session, slug ?? "", tagLabel),
          ),
    [internalGroups, internalLabel, sessions],
  );
  const pageTitle = internalLabel ?? tagLabel;
  const description =
    (internalLabel
      ? `Sesiones de ${internalLabel.toLocaleLowerCase("es")}`
      : (slug ? THEME_DETAIL_DESCRIPTION_BY_SLUG[slug] : undefined) ??
        `Sesiones para conectar con ${tagLabel?.toLocaleLowerCase("es") ?? "esta temática"}`);

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
      openPremiumPlans();
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
  const hasContent = internalLabel
    ? mainSessions.length > 0
    : sessions.length > 0 || internalGroups.size > 0;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.gradient[theme.gradient.length - 1] as string },
      ]}
    >
      <StatusBar hidden />
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        locations={theme.gradientLocations}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

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
            <Pressable
              onPress={goBack}
              hitSlop={10}
              style={({ pressed }) => [
                styles.heroBackBtn,
                {
                  top: topPad + 8,
                  backgroundColor: "rgba(0,0,0,0.28)",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name="chevron-left" size={28} color={colors.foreground} style={{ transform: [{ translateX: -1 }] }} />
            </Pressable>
          </View>
          <View style={styles.intro}>
            <Text style={[styles.legacyPageTitle, { color: colors.foreground }]}>
               {pageTitle}
            </Text>
            <Text
              style={[styles.pageDescription, { color: colors.mutedForeground }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {description}
            </Text>
          </View>
        </View>

        {!hasContent ? (
          <View style={[styles.emptySlot, { borderColor: "rgba(255,255,255,0.1)" }]}>
            <Feather name="inbox" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Aún no hay sesiones
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Estamos preparando nuevas experiencias para esta temática
            </Text>
          </View>
        ) : (
          <>
            {!internalLabel &&
            !internalLabel && [...internalGroups.entries()].map(([label, labelSessions]) => (
                <SessionCarousel
                  key={label}
                  title={label}
                  sessions={labelSessions.slice(0, 6)}
                  isPremium={isPremium}
                  onPress={openSession}
                  onViewAll={() =>
                    router.push(
                      buildOtherThemeInternalRoute(slug ?? "", label) as never,
                    )
                  }
                  viewAllLabel="Ver todo"
                  style={styles.sessionGrid}
                  eagerRender
                  presentation="editorial"
                  disableAmbientalVariant
                  sleepMetadataBelow
                  categoryGridPresentation
                  whiteMetadataGlass
                  showDurationClock
                  durationBadgeStyle={{ bottom: 8, left: 8 }}
                  showCategoryLabelBelow
                  showCategoryLabelAfterTitle
                  showAuthor={false}
                  sleepBelowMetadataStyle={{
                    marginTop: 7,
                    transform: [{ translateX: 3 }],
                  }}
                  trailingPeek={20}
                  cardBorderRadius={16}
                  hideCategoryAboveTitle
                  showSleepCategoryPillWithInlineDuration
                  ambientalTitleOnly
                />
              ))}
            {mainSessions.length > 0 && (
              <SessionCarousel
                title=""
                sessions={mainSessions}
                isPremium={isPremium}
                onPress={openSession}
                style={styles.sessionGrid}
                showHeader={false}
                gridLayout
                fillGridWidth
                gridScrollEnabled={false}
                eagerRender
                presentation="editorial"
                disableAmbientalVariant
                sleepMetadataBelow
                categoryGridPresentation
                whiteMetadataGlass
                showDurationClock
                durationBadgeStyle={{ bottom: 8, left: 8 }}
                showCategoryLabelBelow
                showCategoryLabelAfterTitle
                showAuthor={false}
                sleepBelowMetadataStyle={{
                  marginTop: 7,
                  transform: [{ translateX: 3 }],
                }}
                trailingPeek={20}
                cardBorderRadius={16}
                hideCategoryAboveTitle
                showSleepCategoryPillWithInlineDuration
                ambientalTitleOnly
              />
            )}
          </>
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
              {pageTitle}
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
              backgroundColor: "rgba(0,0,0,0.28)",
              opacity: pressed ? 0.7 : 1,
               top: topPad - 4,
            },
          ]}
        >
          <Feather name="chevron-left" size={28} color={colors.foreground} style={{ transform: [{ translateX: -1 }] }} />
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
    height: Math.round(width * 0.72) + 15,
    overflow: "hidden",
  },
  heroBackBtn: {
    position: "absolute",
    left: H_PAD,
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  intro: {
    paddingHorizontal: H_PAD,
    paddingTop: 38,
    paddingBottom: 4,
    alignItems: "flex-start",
  },
  legacyPageTitle: {
    fontFamily: "Manrope",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    textAlign: "left",
    alignSelf: "stretch",
  },
  pageDescription: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    marginTop: 15,
    textAlign: "left",
    alignSelf: "stretch",
    opacity: 0.92,
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
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
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
    paddingHorizontal: 0,
    marginBottom: 0,
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