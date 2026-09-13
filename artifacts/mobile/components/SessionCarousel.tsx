import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import {
  Animated as RNAnimated,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
  type ImageStyle,
  type StyleProp,
  type TextStyle,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";

const AnimatedPressable = RNAnimated.createAnimatedComponent(Pressable);
const CANONICAL_AMBIENTAL_BORDER_COLOR = "rgba(255,255,255,0.25)";
const CANONICAL_AMBIENTAL_BORDER_WIDTH = 1;
const CANONICAL_AMBIENTAL_BORDER_RADIUS = 31;
const CANONICAL_AMBIENTAL_METADATA_STYLE: ViewStyle = {
  transform: [{ translateY: -2 }],
};
const CANONICAL_AMBIENTAL_TITLE_STYLE: TextStyle = {
  height: 42,
  fontSize: 15,
  lineHeight: 19,
  textAlign: "center",
  textAlignVertical: "top",
};

function brightenAmbientalColor(hex: string, pct: number): string {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return hex;
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  return `rgb(${channels
    .map((channel) => Math.round(channel + (255 - channel) * (pct / 100)))
    .join(",")})`;
}

import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { usePlayer } from "@/context/PlayerContext";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import type { Session } from "@/data/sessions";
import {
  SessionCategoryPill,
  SESSION_CARD_METADATA_HEIGHT_SCALE,
  SessionCardMetadataOverlay,
} from "@/components/SessionCardMetadataOverlay";
import {
  SessionBadgeGlass,
  SessionDurationBadge,
} from "@/components/SessionDurationBadge";
import { PressScale } from "@/components/PressScale";
import {
  CONTENT_CAROUSEL_GAP,
  CONTENT_CAROUSEL_HEIGHT_SCALE,
  getContentCarouselCardWidth,
  getTwoCardCarouselCardWidth,
} from "@/constants/carousel";

const CARD_W = 150;
const GRID_PAD = 14;
const SECTION_GAP = 53;
const NEON_VIOLET = "#A970FF";
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
function LineAwareAmbientalTitle({
  children,
  style,
}: {
  children: string;
  style: StyleProp<TextStyle>;
}) {
  const [lineCount, setLineCount] = React.useState(1);

  return (
    <Text
      style={[
        style,
        { transform: [{ translateY: lineCount > 1 ? -2 : 7 }] },
      ]}
      numberOfLines={2}
      onTextLayout={(event) => {
        const nextLineCount = Math.min(event.nativeEvent.lines.length, 2);
        setLineCount((current) =>
          current === nextLineCount ? current : nextLineCount,
        );
      }}
    >
      {children}
    </Text>
  );
}

function PreviewFadeLayer({
  active,
  style,
  children,
}: {
  active: boolean;
  style: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(active ? 1 : 0, { duration: 350 }),
  }), [active]);

  return (
    <Animated.View pointerEvents="none" style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

function PreviewCircularProgress({
  diameter,
  progress,
}: {
  diameter: number;
  progress: SharedValue<number>;
}) {
  const strokeWidth = 3;
  const canvasSize = diameter + strokeWidth * 2;
  const radius = diameter / 2 + strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset:
      circumference * (1 - Math.max(0, Math.min(1, progress.value))),
  }));

  return (
    <Svg width={canvasSize} height={canvasSize}>
      <AnimatedCircle
        animatedProps={animatedProps}
        cx={canvasSize / 2}
        cy={canvasSize / 2}
        r={radius}
        fill="none"
        stroke={NEON_VIOLET}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        transform={`rotate(-90 ${canvasSize / 2} ${canvasSize / 2})`}
      />
    </Svg>
  );
}

type CarouselImageProps = {
  source: import("react-native").ImageSourcePropType;
  style: StyleProp<ImageStyle>;
  contentFit?: "cover" | "contain";
};

const CarouselImage = React.memo(function CarouselImage({
  source,
  style,
  contentFit = "cover",
}: CarouselImageProps) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <View style={[style, styles.thumbFallback]}>
        <Feather name="image" size={24} color="#F9F9F9" />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      onError={() => setFailed(true)}
    />
  );
});

const AmbientalCardTitle = React.memo(function AmbientalCardTitle({
  title,
  numberOfLines,
}: {
  title: string;
  numberOfLines: number;
}) {
  return (
    <View style={styles.sleepOverlayMetadata}>
      <Text style={styles.sleepOverlayTitle} numberOfLines={numberOfLines}>
        {title}
      </Text>
    </View>
  );
});

// ── Carrusel de sesiones (con píldora de duración) ────────────────────────────
type SessionCarouselProps = {
  title: string;
  sessions: Session[];
  isPremium: boolean;
  onPress: (s: Session) => void;
  onLongPress?: (s: Session) => void;
  style?: object;
  titleOffset?: number;
  cardWidth?: number;
  cardHeight?: number;
  cardHeightAdjustment?: number;
  cardWidthAdjustment?: number;
  durationBadgeStyle?: StyleProp<ViewStyle>;
  sleepBelowTitleStyle?: StyleProp<TextStyle>;
  sleepBelowMetadataStyle?: StyleProp<ViewStyle>;
  sleepOverlayTitleStyle?: StyleProp<TextStyle>;
  sleepOverlayAuthorStyle?: StyleProp<TextStyle>;
  sleepOverlayMetadataStyle?: StyleProp<ViewStyle>;
  overlayGradientLocations?: [number, number, number];
  showOverlayGradient?: boolean;
  showCategoryAboveTitle?: boolean;
  hideCategoryAboveTitle?: boolean;
  fixedCardHeight?: number;
  allowOversizedCardWidth?: boolean;
  titleSize?: number;
  titleSpacing?: number;
  description?: string;
  squareCards?: boolean;
  showImageCategoryPill?: boolean;
  onViewAll?: () => void;
  viewAllColor?: string;
  showCardMetadata?: boolean;
  metadataTitleNumberOfLines?: number;
  showAuthor?: boolean;
  showCollectionBelow?: boolean;
  showMetaBelow?: boolean;
  durationInsideWithMeta?: boolean;
  showDurationBadge?: boolean;
  durationLift?: number;
  showHeader?: boolean;
  cardVariant?: "ambiental";
  /** Prevents Ambiental session metadata from changing the requested card presentation. */
  disableAmbientalVariant?: boolean;
  /** Optional radius override for every card in the carousel. */
  cardBorderRadius?: number;
  /** Visible width of the next card after two complete cards. */
  trailingPeek?: number;
  /** Explicit width for Ambiental cards; ignored by sleep-category presentation. */
  ambientalCardWidth?: number;
  /** Optional surface override for Ambiental cards on a specific screen/theme. */
  ambientalCardBackground?: string;
  /** Optional full gradient surface for Ambiental cards on a specific screen/theme. */
  ambientalCardGradient?: {
    colors: [string, string, ...string[]];
    locations?: readonly [number, number, ...number[]];
  };
  /** Optional border override for Ambiental cards on a specific screen/theme. */
  ambientalCardBorderColor?: string;
  ambientalCardBorderWidth?: number;
  ambientalCardBorderRadius?: number;
  hideAmbientalTitleInSquareRecent?: boolean;
  eagerRender?: boolean;
  /** Renders the same cards in a two-column vertical grid. */
  gridLayout?: boolean;
  fillGridWidth?: boolean;
  gridBottomPadding?: number;
  gridScrollEnabled?: boolean;
  /** Shared tall presentation used by Dormir and editorial discovery carousels. */
  presentation?: "sleep-category" | "tall-overlay" | "editorial";
  /** Places title and author over the image without a category pill. */
  overlayMetadataInside?: boolean;
  /** Keeps the duration pill in the image's upper-left corner. */
  overlayDurationTopLeft?: boolean;
  /** Shows DORMIR at top-left and moves duration into the metadata above the title. */
  showSleepCategoryPillWithInlineDuration?: boolean;
  /** Keeps the inline duration layout without its DORMIR pill. */
  showSleepCategoryPill?: boolean;
  /** Ambiental cards show only their title, aligned to the usual author position. */
  ambientalTitleOnly?: boolean;
  /** Moves the centered image of Ambiental cards upward. */
  ambientalImageLift?: number;
  /** Fills the upper card area with the image down to the former circle edge. */
  ambientalImageFillTop?: boolean;
  /** Position override used only by Ambiental title-only metadata. */
  ambientalTitleOnlyMetadataStyle?: StyleProp<ViewStyle>;
  /** Text override used only by Ambiental title-only titles. */
  ambientalTitleOnlyTitleStyle?: StyleProp<TextStyle>;
  /** Shows the session category pill on Ambiental title-only cards. */
  showAmbientalCategoryPill?: boolean;
  /** Dormir-only square card with category, duration and author below the image. */
  sleepMetadataBelow?: boolean;
  /** Square card with category, duration, title and author below the image. */
  squareMetadataBelow?: boolean;
  /** Square card with only its title below the image. */
  squareTitleOnlyBelow?: boolean;
  /** Square card with title and author below the image. */
  squareTitleAuthorBelow?: boolean;
  /** Category-grid layout: duration pill over image, title and author below. */
  categoryGridPresentation?: boolean;
  /** Shows the session category below the image, immediately above the title. */
  showCategoryLabelBelow?: boolean;
  /** Shows the session category as a glass pill in the image's upper-left corner. */
  showCategoryPillTopLeft?: boolean;
  /** Uses the same white glass surface as Ambiental favorite buttons. */
  whiteMetadataGlass?: boolean;
  /** Shows a clock icon before the duration label. */
  showDurationClock?: boolean;
  soundPreview?: {
    activeId: string | null;
    isPlaying: boolean;
    progress: SharedValue<number>;
    onToggle: (session: Session) => void;
  };
};

export const SessionCarousel = React.memo(function SessionCarousel({
  title,
  sessions,
  isPremium,
  onPress,
  onLongPress,
  style,
  titleOffset,
  cardWidth,
  cardHeight,
  cardHeightAdjustment = 0,
  cardWidthAdjustment = 0,
  durationBadgeStyle,
  sleepBelowTitleStyle,
  sleepBelowMetadataStyle,
  sleepOverlayTitleStyle,
  sleepOverlayAuthorStyle,
  sleepOverlayMetadataStyle,
  overlayGradientLocations,
  showOverlayGradient = true,
  showCategoryAboveTitle = false,
  hideCategoryAboveTitle = false,
  fixedCardHeight,
  allowOversizedCardWidth = false,
  titleSize,
  titleSpacing,
  description,
  squareCards = false,
  showImageCategoryPill = false,
  onViewAll,
  viewAllColor,
  showCardMetadata = false,
  metadataTitleNumberOfLines,
  showAuthor = true,
  showCollectionBelow = false,
  showMetaBelow = false,
  durationInsideWithMeta = false,
  showDurationBadge = true,
  durationLift = 0,
  showHeader = true,
  cardVariant,
  disableAmbientalVariant = false,
  cardBorderRadius,
  trailingPeek,
  ambientalCardWidth,
  ambientalCardBackground: ambientalCardBackgroundOverride,
  ambientalCardGradient,
  ambientalCardBorderColor,
  ambientalCardBorderWidth,
  ambientalCardBorderRadius,
  hideAmbientalTitleInSquareRecent = false,
  eagerRender = false,
  gridLayout = false,
  fillGridWidth = false,
  gridBottomPadding = 0,
  gridScrollEnabled = true,
  presentation,
  overlayMetadataInside = false,
  overlayDurationTopLeft = false,
  showSleepCategoryPillWithInlineDuration = false,
  showSleepCategoryPill = true,
  ambientalTitleOnly = false,
  ambientalImageLift = 9,
  ambientalImageFillTop = true,
  ambientalTitleOnlyMetadataStyle = CANONICAL_AMBIENTAL_METADATA_STYLE,
  ambientalTitleOnlyTitleStyle = CANONICAL_AMBIENTAL_TITLE_STYLE,
  showAmbientalCategoryPill = false,
  sleepMetadataBelow = false,
  squareMetadataBelow = false,
  squareTitleOnlyBelow = false,
  squareTitleAuthorBelow = false,
  categoryGridPresentation = false,
  showCategoryLabelBelow = false,
  showCategoryPillTopLeft = false,
  whiteMetadataGlass = false,
  showDurationClock = false,
  soundPreview,
}: SessionCarouselProps) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const canonicalAmbientalGradient = React.useMemo(() => {
    const withoutPurpleStop =
      theme.gradient.length > 2 ? theme.gradient.slice(1) : theme.gradient;
    const withoutPurpleLocation =
      theme.gradient.length > 2 && theme.gradientLocations
        ? theme.gradientLocations.slice(1)
        : theme.gradientLocations;
    const firstLocation = withoutPurpleLocation?.[0] ?? 0;
    const lastLocation =
      withoutPurpleLocation?.[withoutPurpleLocation.length - 1] ?? 1;
    const locationSpan = lastLocation - firstLocation || 1;

    return {
      colors: withoutPurpleStop.map((color) =>
        brightenAmbientalColor(color, 5),
      ) as unknown as [string, string, ...string[]],
      locations: withoutPurpleLocation?.map(
        (location) => (location - firstLocation) / locationSpan,
      ) as unknown as [number, number, ...number[]] | undefined,
    };
  }, [theme.gradient, theme.gradientLocations]);
  const effectiveAmbientalCardGradient =
    ambientalCardGradient ?? canonicalAmbientalGradient;
  const { openForSession } = useAmbientalDuration();
  const { isFavorite, toggleFavorite } = usePlayer();
  const { width: viewportWidth } = useWindowDimensions();
  const previewScaleById = React.useRef(new Map<string, RNAnimated.Value>()).current;
  const getPreviewScale = React.useCallback((sessionId: string) => {
    let scale = previewScaleById.get(sessionId);
    if (!scale) {
      scale = new RNAnimated.Value(1);
      previewScaleById.set(sessionId, scale);
    }
    return scale;
  }, [previewScaleById]);
  const bouncePreview = React.useCallback((sessionId: string) => {
    const scale = getPreviewScale(sessionId);
    scale.stopAnimation();
    RNAnimated.sequence([
      RNAnimated.timing(scale, {
        toValue: 0.9,
        duration: 70,
        useNativeDriver: true,
      }),
      RNAnimated.spring(scale, {
        toValue: 1,
        speed: 24,
        bounciness: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [getPreviewScale]);
  if (sessions.length === 0) return null;
  const forceAmbientalVariant = cardVariant === "ambiental";
  const isEditorialPresentation = presentation === "editorial";
  const isSleepCategoryPresentation =
    presentation === "sleep-category" || isEditorialPresentation;
  const useSleepMetadataBelow =
    squareMetadataBelow ||
    squareTitleOnlyBelow ||
    squareTitleAuthorBelow ||
    (isSleepCategoryPresentation && sleepMetadataBelow);
  const isTallOverlayPresentation =
    isSleepCategoryPresentation || presentation === "tall-overlay";
  const useOverlayMetadata =
    (isTallOverlayPresentation && !useSleepMetadataBelow) || overlayMetadataInside;
  const isAmbientalCarousel =
    !disableAmbientalVariant &&
    (forceAmbientalVariant || sessions.every((session) => session.categoryId === "ambientales"));
  const ambientalCarouselCardWidth = Math.floor(
    (viewportWidth - GRID_PAD - CONTENT_CAROUSEL_GAP * 2) / 2.9,
  );
  const sleepCategoryCardWidth = getTwoCardCarouselCardWidth(
    viewportWidth,
    GRID_PAD,
    trailingPeek ?? (useSleepMetadataBelow ? 25 : undefined),
  );
  const requestedCardWidth = (
    gridLayout && fillGridWidth
      ? (viewportWidth - GRID_PAD * 2 - CONTENT_CAROUSEL_GAP) / 2
      : (isEditorialPresentation
          ? cardWidth ?? sleepCategoryCardWidth
          : useSleepMetadataBelow
            ? cardWidth ?? sleepCategoryCardWidth
            : isTallOverlayPresentation
              ? cardWidth ?? sleepCategoryCardWidth
              : isAmbientalCarousel
                ? ambientalCardWidth ?? ambientalCarouselCardWidth
                : cardWidth ?? getContentCarouselCardWidth(viewportWidth)) +
        (isEditorialPresentation && trailingPeek === undefined ? -3.5 : 0) +
        cardWidthAdjustment
  );
  const effectiveAllowOversizedCardWidth =
    isTallOverlayPresentation || allowOversizedCardWidth;
  const cw = effectiveAllowOversizedCardWidth
    ? requestedCardWidth
    : Math.min(requestedCardWidth, getContentCarouselCardWidth(viewportWidth));
  const effectiveShowCardMetadata =
    isTallOverlayPresentation ? false : showCardMetadata;
  const effectiveSquareCards = useSleepMetadataBelow
    ? true
    : isTallOverlayPresentation
      ? false
      : squareCards;
  const effectiveShowAuthor = showAuthor;
  const effectiveShowCollectionBelow =
    isTallOverlayPresentation ? false : showCollectionBelow;
  const effectiveShowMetaBelow =
    isTallOverlayPresentation ? false : showMetaBelow;
  const effectiveShowDurationBadge = useSleepMetadataBelow
    ? categoryGridPresentation && showDurationBadge
    : showDurationBadge;
  const effectiveShowCategoryAboveTitle =
    !hideCategoryAboveTitle && (showCategoryAboveTitle || isEditorialPresentation);
  const effectiveOverlayDurationTopLeft =
    overlayDurationTopLeft || isEditorialPresentation;
  const effectiveShowImageCategoryPill =
    showImageCategoryPill && !isEditorialPresentation;
  const baseCardHeight = cardHeight ?? cw;
  const originalCardHeight = effectiveShowCardMetadata
    ? (baseCardHeight + 50) * SESSION_CARD_METADATA_HEIGHT_SCALE
    : baseCardHeight;
  const sleepCategoryCardHeight = Math.round(
    (cw + 50) *
      SESSION_CARD_METADATA_HEIGHT_SCALE *
      CONTENT_CAROUSEL_HEIGHT_SCALE,
  ) + (isEditorialPresentation ? -11 : 0) + cardHeightAdjustment;
  const ch = useSleepMetadataBelow ? cw + cardHeightAdjustment : fixedCardHeight ?? (
    isTallOverlayPresentation
      ? sleepCategoryCardHeight
      : effectiveSquareCards
        ? cw
        : Math.round(originalCardHeight * CONTENT_CAROUSEL_HEIGHT_SCALE)
  );
  const cardStyle = { width: cw };
  const thumbStyle = { width: cw, height: ch };
  const titleFontSize = titleSize ?? 17;
  // Esta excepción se activa únicamente desde el carrusel de "Sesiones
  // recientes" de Inicio. Otros carruseles cuadrados con metadata inferior
  // conservan el título superpuesto sobre la imagen.
  const shouldHideAmbientalTitle =
    (useSleepMetadataBelow ||
      isSleepCategoryPresentation ||
      hideAmbientalTitleInSquareRecent) &&
    effectiveSquareCards;
  const ambientalCardBackground =
    ambientalCardBackgroundOverride ?? "rgba(0,0,0,0.28)";
  const ambientalImageSize = Math.round(cw * 0.72);
  const ambientalImageBottom =
    (ch - ambientalImageSize) / 2 - 1 - ambientalImageLift + ambientalImageSize;
  const ambientalFillScale = 0.75;
  const ambientalFilledImageDiameter =
    Math.min(
      (cw + 1) * ambientalFillScale + 15,
      ambientalImageBottom * ambientalFillScale + 15,
    ) * 0.9;
  const ambientalFilledImageWidth = ambientalFilledImageDiameter;
  const ambientalFilledImageHeight = ambientalFilledImageDiameter;
  const ambientalFilledImageLeft = (cw - ambientalFilledImageWidth) / 2;
  const ambientalFilledImageTop =
    (ambientalImageBottom - ambientalFilledImageHeight) / 2 + 4;
  const ambientalFilledImageBottom =
    ambientalFilledImageTop + ambientalFilledImageHeight;
  const ambientalPlayButtonSize = 34 * ambientalFillScale + 20;
  const ambientalPlayIconSize = 22 * ambientalFillScale + 14;
  const viewAllAccent = theme.accent ?? viewAllColor ?? colors.accent;
  return (
    <View style={[styles.section, style]}>
      {showHeader && (onViewAll ? (
        <View style={{ marginBottom: titleSpacing ?? 17 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[styles.sectionTitle, { fontSize: titleFontSize, marginBottom: description ? 4 : 0 }]}>{title}</Text>
              <Pressable onPress={onViewAll} hitSlop={8}>
                <Text style={{ fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: viewAllAccent }}>Ver todos</Text>
              </Pressable>
          </View>
          {description && (
            <Text style={[styles.sectionDescription, { color: viewAllAccent }]}>{description}</Text>
          )}
        </View>
      ) : description ? (
        <View style={{ marginBottom: titleSpacing ?? 17 }}>
          <Text style={[styles.sectionTitle, { fontSize: titleFontSize, marginBottom: 4 }]}>{title}</Text>
          <Text style={[styles.sectionDescription, { color: viewAllAccent }]}>{description}</Text>
        </View>
      ) : (
        <Text style={[styles.sectionTitle, { fontSize: titleFontSize, marginBottom: titleSpacing ?? 17 }]}>{title}</Text>
      ))}
      <FlatList
        horizontal={!gridLayout}
        scrollEnabled={!gridLayout || gridScrollEnabled}
        numColumns={gridLayout ? 2 : undefined}
        data={sessions}
        keyExtractor={(session) => session.id}
        initialNumToRender={eagerRender ? sessions.length : 3}
        maxToRenderPerBatch={eagerRender ? sessions.length : 3}
        windowSize={eagerRender ? 11 : 3}
        removeClippedSubviews={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={
          gridLayout
            ? { justifyContent: "center", gap: CONTENT_CAROUSEL_GAP }
            : undefined
        }
        style={gridLayout ? { flex: 1 } : { marginHorizontal: -GRID_PAD }}
        contentContainerStyle={
          gridLayout
            ? {
                paddingHorizontal: GRID_PAD,
                paddingTop: 30,
                paddingBottom: gridBottomPadding,
                rowGap: 18,
              }
            : { paddingHorizontal: GRID_PAD, gap: CONTENT_CAROUSEL_GAP }
        }
        renderItem={({ item: s }) => {
          const locked = !!s.isPremium && !isPremium;
          const authorObj = s.guideId ? getGuide(s.guideId) : getArtist(s.artistId);
          const authorName = authorObj?.name;
          const isAmbiental =
            !disableAmbientalVariant &&
            (forceAmbientalVariant || s.categoryId === "ambientales");
          const isPreviewActive = soundPreview?.activeId === s.id;
          const showAmbientalTitleOnly = ambientalTitleOnly && isAmbiental;
           const hasSecondaryMeta =
            effectiveShowMetaBelow ||
            effectiveShowCollectionBelow ||
            (effectiveShowAuthor && Boolean(authorName));
          return (
            <PressScale
              key={s.id}
              onLongPress={onLongPress ? () => onLongPress(s) : undefined}
              onPress={() => {
                if (locked) { router.push("/membresia" as never); return; }
                if (openForSession(s)) return;
                onPress(s);
              }}
              style={[styles.card, cardStyle]}
            >
              {soundPreview && !isAmbiental && (
                <PreviewFadeLayer
                  active={isPreviewActive}
                  style={[
                    styles.previewActiveCard,
                    { borderRadius: ambientalCardBorderRadius ?? 18 },
                  ]}
                />
              )}
              <View
                style={[
                  styles.thumbWrap,
                  thumbStyle,
                  cardBorderRadius !== undefined && {
                    borderRadius: cardBorderRadius,
                  },
                  isAmbiental && {
                    backgroundColor: effectiveAmbientalCardGradient
                      ? "transparent"
                      : ambientalCardBackground,
                    borderWidth:
                      ambientalCardBorderWidth ?? CANONICAL_AMBIENTAL_BORDER_WIDTH,
                    borderRadius:
                      ambientalCardBorderRadius ?? CANONICAL_AMBIENTAL_BORDER_RADIUS,
                    borderColor:
                      ambientalCardBorderColor ?? CANONICAL_AMBIENTAL_BORDER_COLOR,
                  },
                ]}
              >
                {isAmbiental && effectiveAmbientalCardGradient && (
                  <LinearGradient
                    colors={effectiveAmbientalCardGradient.colors}
                    locations={effectiveAmbientalCardGradient.locations}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  />
                )}
                {!isAmbiental && (
                  <CarouselImage source={s.image} style={[styles.thumb, thumbStyle]} />
                )}
                {isAmbiental ? (
                  <>
                    <CarouselImage
                      source={s.image}
                      style={[
                        styles.ambientalImage,
                        ambientalImageFillTop
                          ? {
                              width: ambientalFilledImageWidth,
                              height: ambientalFilledImageHeight,
                              left: ambientalFilledImageLeft,
                              top: ambientalFilledImageTop,
                              borderRadius: ambientalFilledImageDiameter / 2,
                            }
                          : {
                              width: ambientalImageSize,
                              height: ambientalImageSize,
                              borderRadius: ambientalImageSize / 2,
                              left: (cw - ambientalImageSize) / 2 - 1,
                              top: (ch - ambientalImageSize) / 2 - 1 - ambientalImageLift,
                            },
                      ]}
                    />
                    {soundPreview && (
                      <PreviewFadeLayer
                        active={isPreviewActive && soundPreview.isPlaying}
                        style={[
                          styles.ambientalPreviewBorder,
                          {
                            borderRadius:
                              ambientalCardBorderRadius ?? CANONICAL_AMBIENTAL_BORDER_RADIUS,
                          },
                        ]}
                      />
                    )}
                    {ambientalImageFillTop && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.ambientalImageBottomEdge,
                          {
                            width: ambientalFilledImageWidth,
                            height: ambientalFilledImageHeight,
                            left: ambientalFilledImageLeft,
                            top: ambientalFilledImageTop,
                            borderBottomLeftRadius: ambientalFilledImageDiameter / 2,
                            borderBottomRightRadius: ambientalFilledImageDiameter / 2,
                          },
                        ]}
                      >
                        <LinearGradient
                          colors={[
                            "rgba(255,255,255,0)",
                            "rgba(255,255,255,0.035)",
                          ]}
                          locations={[0, 1]}
                          style={styles.ambientalImageBottomFade}
                        />
                      </View>
                    )}
                    {soundPreview && (
                      <>
                        <PreviewFadeLayer
                          active={isPreviewActive}
                          style={[
                            styles.previewCircularProgress,
                            {
                              width: ambientalFilledImageDiameter + 6,
                              height: ambientalFilledImageDiameter + 6,
                              left: ambientalFilledImageLeft - 3,
                              top: ambientalFilledImageTop - 3,
                            },
                          ]}
                        >
                          <PreviewCircularProgress
                            diameter={ambientalFilledImageDiameter}
                            progress={soundPreview.progress}
                          />
                        </PreviewFadeLayer>
                        <AnimatedPressable
                          onPress={(event) => {
                            event.stopPropagation();
                            bouncePreview(s.id);
                            soundPreview.onToggle(s);
                          }}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`${isPreviewActive && soundPreview.isPlaying ? "Pausar" : "Reproducir"} preview de ${s.title}`}
                          style={[
                            styles.previewButton,
                            {
                              width: ambientalPlayButtonSize,
                              height: ambientalPlayButtonSize,
                              borderRadius: ambientalPlayButtonSize / 2,
                              left:
                                ambientalFilledImageLeft +
                                (ambientalFilledImageWidth -
                                  ambientalPlayButtonSize) /
                                  2,
                              top:
                                ambientalFilledImageBottom -
                                ambientalPlayButtonSize / 2,
                              transform: [{ scale: getPreviewScale(s.id) }],
                            },
                          ]}
                        >
                          <SessionBadgeGlass showBlackTint={false} />
                          <View
                            pointerEvents="none"
                            style={styles.favoriteGlassTint}
                          />
                          <MaterialCommunityIcons
                            name={isPreviewActive && soundPreview.isPlaying ? "pause" : "play"}
                            size={ambientalPlayIconSize}
                            color="#F9F9F9"
                          />
                        </AnimatedPressable>
                      </>
                    )}
                    {!useOverlayMetadata && !shouldHideAmbientalTitle && (
                      <AmbientalCardTitle
                        title={s.title}
                        numberOfLines={metadataTitleNumberOfLines ?? 2}
                      />
                    )}
                    {!isEditorialPresentation && !useSleepMetadataBelow &&
                      (!useOverlayMetadata || !showImageCategoryPill) && (
                      <SessionCategoryPill
                        categoryId={s.categoryId}
                        leftInset={18}
                        topInset={18}
                      />
                    )}
                    {!isEditorialPresentation && durationInsideWithMeta && effectiveShowDurationBadge && (
                      <SessionDurationBadge
                        label={s.durationLabel}
                        style={[
                          styles.durBadge,
                          !effectiveShowAuthor && styles.durBadgeLower,
                          { bottom: (effectiveShowAuthor ? 8 : 4) + durationLift },
                        ]}
                        textStyle={styles.durText}
                      />
                    )}
                    {!isEditorialPresentation && categoryGridPresentation && effectiveShowDurationBadge && (
                      <SessionDurationBadge
                        label={s.durationLabel}
                        style={[styles.durBadge, styles.categoryDurationBadge, durationBadgeStyle]}
                        textStyle={styles.durText}
                      />
                    )}
                  </>
                ) : effectiveShowCardMetadata ? (
                  <SessionCardMetadataOverlay
                    categoryId={s.categoryId}
                    durationLabel={s.durationLabel}
                    title={s.title}
                    titleNumberOfLines={metadataTitleNumberOfLines}
                    authorName={effectiveShowAuthor && !effectiveShowCollectionBelow ? authorName : undefined}
                    showAuthor={effectiveShowAuthor && !effectiveShowCollectionBelow}
                    showCategoryPill={!effectiveShowMetaBelow && (showImageCategoryPill || !effectiveShowCollectionBelow)}
                    showCategoryBelow={effectiveShowMetaBelow || effectiveShowCollectionBelow}
                    showDuration={effectiveShowDurationBadge && !effectiveShowMetaBelow}
                    durationBottom={(hasSecondaryMeta ? 70 : 52) + durationLift}
                    metaBottom={hasSecondaryMeta ? 15 : 20}
                    metaLeft={hasSecondaryMeta ? 10 : 18}
                    contentLeft={hasSecondaryMeta ? 8 : 18}
                  />
                ) : (
                  <>
                    {!isSleepCategoryPresentation &&
                      (!effectiveShowMetaBelow || durationInsideWithMeta) &&
                      showImageCategoryPill && (
                      <SessionCategoryPill categoryId={s.categoryId} />
                    )}
                    {effectiveShowDurationBadge &&
                      !useOverlayMetadata &&
                      (!effectiveShowMetaBelow || durationInsideWithMeta) && (
                      <SessionDurationBadge
                        label={s.durationLabel}
                        whiteGlass={whiteMetadataGlass}
                        showClock={showDurationClock}
                        style={[
                          styles.durBadge,
                         categoryGridPresentation && styles.categoryDurationBadge,
                          !effectiveShowAuthor && styles.durBadgeLower,
                          !categoryGridPresentation && {
                           bottom: (effectiveShowAuthor ? 8 : 4) + durationLift,
                         },
                          durationBadgeStyle,
                        ]}
                        textStyle={styles.durText}
                      />
                    )}
                  </>
                )}
                {useOverlayMetadata && (
                  <>
                    {showOverlayGradient && !showAmbientalTitleOnly ? (
                      <LinearGradient
                        colors={[
                          "rgba(0,0,0,0)",
                          "rgba(0,0,0,0.18)",
                          "rgba(0,0,0,0.82)",
                        ]}
                        locations={overlayGradientLocations ?? [0.28, 0.58, 1]}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />
                    ) : null}
                    {!showAmbientalTitleOnly && effectiveShowDurationBadge && effectiveOverlayDurationTopLeft && showSleepCategoryPillWithInlineDuration && showSleepCategoryPill ? (
                      <SessionCategoryPill
                        categoryId="descanso"
                        leftInset={11}
                        topInset={15}
                        style={styles.sleepCompactPill}
                        textStyle={styles.sleepCompactPillText}
                      />
                    ) : !showAmbientalTitleOnly && effectiveShowDurationBadge && effectiveOverlayDurationTopLeft ? (
                      <SessionDurationBadge
                        label={s.durationLabel}
                        style={[
                          styles.durBadge,
                          styles.sleepOverlayDurationTopLeft,
                          durationBadgeStyle,
                        ]}
                        textStyle={styles.durText}
                      />
                    ) : null}
                      {(!showAmbientalTitleOnly && effectiveShowImageCategoryPill) ||
                      (showAmbientalTitleOnly && showAmbientalCategoryPill) ? (
                       <SessionCategoryPill
                         categoryId={s.categoryId}
                         leftInset={showAmbientalTitleOnly ? 11 : 18}
                         topInset={showAmbientalTitleOnly ? 15 : 18}
                         style={showAmbientalTitleOnly ? styles.sleepCompactPill : undefined}
                         textStyle={showAmbientalTitleOnly ? styles.sleepCompactPillText : undefined}
                       />
                     ) : null}
                     <View
                       pointerEvents="none"
                       style={[
                         styles.sleepOverlayMetadata,
                         isEditorialPresentation && styles.editorialMetadata,
                         sleepOverlayMetadataStyle,
                          showAmbientalTitleOnly && ambientalTitleOnlyMetadataStyle,
                          showAmbientalTitleOnly &&
                            ambientalImageFillTop && {
                              top: ambientalImageBottom,
                              bottom: 0,
                              justifyContent: "center",
                              transform: [],
                            },
                       ]}
                     >
                       {!showAmbientalTitleOnly && effectiveShowDurationBadge && showSleepCategoryPillWithInlineDuration ? (
                        <SessionDurationBadge
                          label={s.durationLabel}
                           showClock
                          style={[
                            styles.durBadge,
                            styles.sleepOverlayDurationInline,
                            styles.sleepInlineDurationBorder,
                          ]}
                          textStyle={[styles.durText, styles.sleepInlineDurationText]}
                        />
                      ) : null}
                       {!showAmbientalTitleOnly && effectiveShowDurationBadge && !effectiveOverlayDurationTopLeft ? (
                        <SessionDurationBadge
                          label={s.durationLabel}
                          style={[
                            styles.durBadge,
                            styles.sleepOverlayDurationInline,
                            durationBadgeStyle,
                          ]}
                          textStyle={styles.durText}
                        />
                      ) : null}
                       {!showAmbientalTitleOnly && effectiveShowCategoryAboveTitle && s.categoryLabel ? (
                        <Text style={styles.sleepOverlayCategoryText} numberOfLines={1}>
                          {s.categoryLabel}
                        </Text>
                      ) : null}
                      {showAmbientalTitleOnly && ambientalImageFillTop ? (
                        <LineAwareAmbientalTitle
                          style={[
                            styles.sleepOverlayTitle,
                            sleepOverlayTitleStyle,
                            styles.ambientalTitleMatchSleep,
                            ambientalTitleOnlyTitleStyle,
                            {
                              height: 42,
                              textAlignVertical: "center",
                            },
                          ]}
                        >
                          {s.title}
                        </LineAwareAmbientalTitle>
                      ) : (
                        <Text
                          style={[
                            styles.sleepOverlayTitle,
                            isEditorialPresentation && styles.editorialTitle,
                            effectiveShowCategoryAboveTitle && styles.sleepOverlayTitleAfterCategory,
                            showSleepCategoryPillWithInlineDuration && styles.sleepInlineTitleLowered,
                            sleepOverlayTitleStyle,
                            showAmbientalTitleOnly && styles.ambientalTitleMatchSleep,
                            showAmbientalTitleOnly && ambientalTitleOnlyTitleStyle,
                          ]}
                          numberOfLines={2}
                        >
                          {s.title}
                        </Text>
                      )}
                       {!showAmbientalTitleOnly && effectiveShowAuthor && authorName ? (
                        <Text
                          style={[
                            styles.sleepOverlayAuthor,
                            isEditorialPresentation && styles.editorialAuthor,
                            sleepOverlayAuthorStyle,
                          ]}
                          numberOfLines={1}
                        >
                          {authorName}
                        </Text>
                      ) : null}
                    </View>
                  </>
                )}
                {showCategoryPillTopLeft ? (
                  <SessionCategoryPill
                    categoryId={s.categoryId}
                    leftInset={12}
                    topInset={12}
                    whiteGlass={whiteMetadataGlass}
                  />
                ) : null}
                {locked && (
                  <Image
                    source={require("@/assets/images/estrella-premium.png")}
                    style={styles.star}
                    contentFit="contain"
                  />
                )}
              </View>
              {useSleepMetadataBelow ? (
                <View style={[styles.sleepBelowMetadata, sleepBelowMetadataStyle]}>
                   {showCategoryLabelBelow && s.categoryLabel ? (
                    <Text
                      style={[styles.sleepBelowSecondary, { color: viewAllAccent }]}
                      numberOfLines={1}
                    >
                      {s.categoryLabel}
                    </Text>
                  ) : null}
                   {!categoryGridPresentation && !squareTitleOnlyBelow && !squareTitleAuthorBelow ? (
                    <Text
                      style={[styles.sleepBelowSecondary, { color: viewAllAccent }]}
                      numberOfLines={1}
                    >
                      {[s.categoryLabel, s.durationLabel].filter(Boolean).join(" · ")}
                    </Text>
                  ) : null}
                  <Text style={[styles.sleepBelowTitle, sleepBelowTitleStyle]} numberOfLines={2}>
                    {s.title}
                  </Text>
                  {!squareTitleOnlyBelow && authorName ? (
                    <Text
                      style={[styles.sleepBelowSecondary, { color: viewAllAccent }]}
                      numberOfLines={1}
                    >
                      {authorName}
                    </Text>
                  ) : null}
                </View>
              ) : !effectiveShowCardMetadata && !useOverlayMetadata && (
                <>
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                         marginTop: titleOffset ?? (hasSecondaryMeta ? 10 : 4),
                         marginLeft: hasSecondaryMeta ? 0 : 8,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {s.title}
                  </Text>
                  {effectiveShowMetaBelow && !durationInsideWithMeta ? (
                    <Text
                      style={[styles.cardAuthor, { color: viewAllAccent }]}
                      numberOfLines={1}
                    >
                      {[s.categoryLabel, s.durationLabel].filter(Boolean).join(" · ")}
                    </Text>
                  ) : effectiveShowCollectionBelow && s.categoryLabel ? (
                    <Text
                      style={[styles.cardAuthor, { color: viewAllAccent }]}
                      numberOfLines={1}
                    >
                      {s.categoryLabel}
                    </Text>
                  ) : effectiveShowAuthor && authorName ? (
                    <Text
                      style={[styles.cardAuthor, { color: viewAllAccent }]}
                      numberOfLines={1}
                    >
                      {authorName}
                    </Text>
                  ) : null}
                </>
              )}
            </PressScale>
          );
        }}
      />
    </View>
  );
});

// ── Carrusel de portadas (playlists / mezclas, sin píldora de duración) ────────
export type CoverItem = {
  id: string;
  title: string;
  image?: number;
};

type CoverCarouselProps = {
  title: string;
  items: CoverItem[];
  onPress: (id: string) => void;
};

export function CoverCarousel({ title, items, onPress }: CoverCarouselProps) {
  const { width: viewportWidth } = useWindowDimensions();
  if (items.length === 0) return null;
  const cardWidth = getContentCarouselCardWidth(viewportWidth);
  const cardHeight = Math.round(cardWidth * CONTENT_CAROUSEL_HEIGHT_SCALE);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -GRID_PAD }}
        contentContainerStyle={{ paddingHorizontal: GRID_PAD, gap: CONTENT_CAROUSEL_GAP }}
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPress(item.id)}
            style={({ pressed }) => [styles.card, { width: cardWidth, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[styles.thumbWrap, { width: cardWidth, height: cardHeight }]}>
              {item.image != null ? (
                <CarouselImage
                  source={item.image}
                  style={[styles.thumb, { width: cardWidth, height: cardHeight }]}
                />
              ) : (
                <View
                  style={[
                    styles.thumb,
                    styles.thumbFallback,
                    { width: cardWidth, height: cardHeight },
                  ]}
                >
                  <Feather name="music" size={32} color="#F9F9F9" />
                </View>
              )}
            </View>
            <View style={[styles.cardTitleWrap, { width: cardWidth }]}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SECTION_GAP,
    paddingHorizontal: GRID_PAD,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 17,
    color: "#FBFBFB",
  },
  sectionDescription: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 20,
  },
  card: { width: CARD_W },
  previewActiveCard: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: "rgba(169,112,255,0.05)",
    shadowColor: NEON_VIOLET,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 7,
  },
  previewBorder: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: NEON_VIOLET,
  },
  thumbWrap: {
    width: CARD_W,
    height: CARD_W,
    borderRadius: 18,
    overflow: "hidden",
  },
  thumb: { width: CARD_W, height: CARD_W },
  ambientalImage: {
    position: "absolute",
    overflow: "hidden",
  },
  ambientalImageBottomEdge: {
    position: "absolute",
    top: 0,
    overflow: "hidden",
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  ambientalImageBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 9,
  },
  previewButton: {
    position: "absolute",
    zIndex: 5,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "transparent",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCircularProgress: {
    position: "absolute",
    zIndex: 4,
  },
  ambientalPreviewBorder: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  favoriteButton: {
    position: "absolute",
    zIndex: 5,
    width: 32,
    height: 32,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  thumbFallback: { backgroundColor: "rgba(212,175,55,0.10)", alignItems: "center", justifyContent: "center" },
  star: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
  },
  durBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durBadgeLower: {
    bottom: 4,
  },
  categoryDurationBadge: {
    top: undefined,
    bottom: 8,
    left: 8,
    paddingHorizontal: 9,
  },
  durText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
  sleepOverlayMetadata: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 13,
  },
  editorialAmbientalMetadata: {
    transform: [{ translateX: 7 }, { translateY: -7 }],
  },
  sleepOverlayTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
    color: "#F9F9F9",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sleepOverlayTitleAfterCategory: {
    marginTop: 4,
    transform: [{ translateY: 1 }],
  },
  sleepOverlayCategoryText: {
    marginTop: 4,
    fontFamily: "Manrope",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
    color: "rgba(249,249,249,0.82)",
    transform: [{ translateY: 2 }],
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sleepOverlayAuthor: {
    marginTop: 4,
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
    color: "rgba(249,249,249,0.82)",
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sleepBelowMetadata: {
    marginTop: 8,
  },
  sleepBelowSecondary: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
  },
  sleepBelowTitle: {
    marginTop: 2,
    marginBottom: 2,
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
    color: "#F9F9F9",
  },
  ambientalTitleMatchSleep: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  sleepOverlayDurationInline: {
    position: "relative",
    left: undefined,
    bottom: undefined,
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  sleepInlineDurationBorder: {
    height: 23,
    paddingHorizontal: 7,
    paddingVertical: 0,
    justifyContent: "center",
    transform: [{ translateY: 4 }],
  },
  sleepInlineDurationText: {
    fontSize: 10,
  },
  sleepInlineTitleLowered: {
    transform: [{ translateY: 2 }],
  },
  sleepCompactPill: {
    height: 19,
    minHeight: 19,
    paddingVertical: 0,
  },
  sleepCompactPillText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "600",
    transform: [{ translateY: 1 }],
  },
  sleepOverlayDurationTopLeft: {
    top: 15,
    bottom: undefined,
    left: 15,
  },
  editorialMetadata: {
    transform: [{ translateX: 7 }, { translateY: -7 }],
  },
  editorialTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
  },
  editorialAuthor: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
  },
  cardTitleWrap: {
    width: CARD_W,
    backgroundColor: "rgba(27,6,15,0.30)",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginTop: 0,
  },
  cardTitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 17,
  },
  cardAuthor: { fontFamily: "Manrope", fontSize: 11, color: "#F4F4F4", marginTop: 4 },
});
