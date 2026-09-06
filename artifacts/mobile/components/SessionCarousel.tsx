import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
  type ImageStyle,
  type StyleProp,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import type { Session } from "@/data/sessions";
import {
  SessionCategoryPill,
  SESSION_CARD_METADATA_HEIGHT_SCALE,
  SessionCardMetadataOverlay,
} from "@/components/SessionCardMetadataOverlay";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
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
  color,
  numberOfLines,
}: {
  title: string;
  color: string;
  numberOfLines: number;
}) {
  const [lineCount, setLineCount] = React.useState(1);

  return (
    <View
      style={[
        styles.ambientalTitleWrap,
        {
          height: numberOfLines * 20,
          transform: [{ translateY: lineCount >= 3 ? 5 : 0 }],
        },
      ]}
    >
      <Text
        style={[styles.ambientalTitle, { color }]}
        numberOfLines={numberOfLines}
        onTextLayout={(event) => {
          const nextLineCount = event.nativeEvent.lines?.length ?? 1;
          setLineCount((previous) =>
            previous === nextLineCount ? previous : nextLineCount
          );
        }}
      >
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
  style?: object;
  titleOffset?: number;
  cardWidth?: number;
  cardHeight?: number;
  cardHeightAdjustment?: number;
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
  /** Explicit width for Ambiental cards; ignored by sleep-category presentation. */
  ambientalCardWidth?: number;
  /** Optional surface override for Ambiental cards on a specific screen/theme. */
  ambientalCardBackground?: string;
  hideAmbientalTitleInSquareRecent?: boolean;
  eagerRender?: boolean;
  /** Shared tall presentation used by Dormir and editorial discovery carousels. */
  presentation?: "sleep-category" | "tall-overlay";
  /** Places title and author over the image without a category pill. */
  overlayMetadataInside?: boolean;
};

export const SessionCarousel = React.memo(function SessionCarousel({
  title,
  sessions,
  isPremium,
  onPress,
  style,
  titleOffset,
  cardWidth,
  cardHeight,
  cardHeightAdjustment = 0,
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
  ambientalCardWidth,
  ambientalCardBackground: ambientalCardBackgroundOverride,
  hideAmbientalTitleInSquareRecent = false,
  eagerRender = false,
  presentation,
  overlayMetadataInside = false,
}: SessionCarouselProps) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { openForSession } = useAmbientalDuration();
  const { width: viewportWidth } = useWindowDimensions();
  if (sessions.length === 0) return null;
  const forceAmbientalVariant = cardVariant === "ambiental";
  const isSleepCategoryPresentation = presentation === "sleep-category";
  const isTallOverlayPresentation =
    isSleepCategoryPresentation || presentation === "tall-overlay";
  const useOverlayMetadata =
    isTallOverlayPresentation || overlayMetadataInside;
  const isAmbientalCarousel =
    forceAmbientalVariant || sessions.every((session) => session.categoryId === "ambientales");
  const ambientalCarouselCardWidth = Math.floor(
    (viewportWidth - GRID_PAD - CONTENT_CAROUSEL_GAP * 2) / 2.9,
  );
  const sleepCategoryCardWidth = getTwoCardCarouselCardWidth(viewportWidth, GRID_PAD);
  const requestedCardWidth = isTallOverlayPresentation
    ? cardWidth ?? sleepCategoryCardWidth
    : isAmbientalCarousel
    ? ambientalCardWidth ?? ambientalCarouselCardWidth
    : cardWidth ?? getContentCarouselCardWidth(viewportWidth);
  const effectiveAllowOversizedCardWidth =
    isTallOverlayPresentation || allowOversizedCardWidth;
  const cw = effectiveAllowOversizedCardWidth
    ? requestedCardWidth
    : Math.min(requestedCardWidth, getContentCarouselCardWidth(viewportWidth));
  const effectiveShowCardMetadata =
    isTallOverlayPresentation ? false : showCardMetadata;
  const effectiveSquareCards = isTallOverlayPresentation ? false : squareCards;
  const effectiveShowAuthor = isTallOverlayPresentation ? true : showAuthor;
  const effectiveShowCollectionBelow =
    isTallOverlayPresentation ? false : showCollectionBelow;
  const effectiveShowMetaBelow =
    isTallOverlayPresentation ? false : showMetaBelow;
  const effectiveShowDurationBadge =
    isTallOverlayPresentation ? true : showDurationBadge;
  const baseCardHeight = cardHeight ?? cw;
  const originalCardHeight = effectiveShowCardMetadata
    ? (baseCardHeight + 50) * SESSION_CARD_METADATA_HEIGHT_SCALE
    : baseCardHeight;
  const sleepCategoryCardHeight = Math.round(
    (sleepCategoryCardWidth + 50) *
      SESSION_CARD_METADATA_HEIGHT_SCALE *
      CONTENT_CAROUSEL_HEIGHT_SCALE,
  ) + cardHeightAdjustment;
  const ch = isTallOverlayPresentation
    ? sleepCategoryCardHeight
    : effectiveSquareCards
      ? cw
      : Math.round(originalCardHeight * CONTENT_CAROUSEL_HEIGHT_SCALE);
  const cardStyle = { width: cw };
  const thumbStyle = { width: cw, height: ch };
  const titleFontSize = titleSize ?? 17;
  // Esta excepción se activa únicamente desde el carrusel de "Sesiones
  // recientes" de Inicio. Otros carruseles cuadrados con metadata inferior
  // conservan el título superpuesto sobre la imagen.
  const shouldHideAmbientalTitle =
    (isSleepCategoryPresentation || hideAmbientalTitleInSquareRecent) &&
    effectiveSquareCards;
  const ambientalCardBackground =
    ambientalCardBackgroundOverride ?? "rgba(181,211,255,0.057)";
  const ambientalImageSize = Math.round(cw * 0.72);
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
        horizontal
        data={sessions}
        keyExtractor={(session) => session.id}
        initialNumToRender={eagerRender ? sessions.length : 3}
        maxToRenderPerBatch={eagerRender ? sessions.length : 3}
        windowSize={eagerRender ? 11 : 3}
        removeClippedSubviews={false}
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -GRID_PAD }}
        contentContainerStyle={{ paddingHorizontal: GRID_PAD, gap: CONTENT_CAROUSEL_GAP }}
        renderItem={({ item: s }) => {
          const locked = !!s.isPremium && !isPremium;
          const authorObj = s.guideId ? getGuide(s.guideId) : getArtist(s.artistId);
          const authorName = authorObj?.name;
          const isAmbiental = forceAmbientalVariant || s.categoryId === "ambientales";
          const hasSecondaryMeta =
            effectiveShowMetaBelow ||
            effectiveShowCollectionBelow ||
            (effectiveShowAuthor && Boolean(authorName));
          return (
            <PressScale
              key={s.id}
              onPress={() => {
                if (locked) { router.push("/membresia" as never); return; }
                if (openForSession(s)) return;
                onPress(s);
              }}
              style={[styles.card, cardStyle]}
            >
              <View
                style={[
                  styles.thumbWrap,
                  thumbStyle,
                  isAmbiental && { backgroundColor: ambientalCardBackground },
                ]}
              >
                {!isAmbiental && (
                  <CarouselImage source={s.image} style={[styles.thumb, thumbStyle]} />
                )}
                {isAmbiental ? (
                  <>
                    <CarouselImage
                      source={s.image}
                      style={[
                        styles.ambientalImage,
                        {
                          width: ambientalImageSize,
                          height: ambientalImageSize,
                          borderRadius: ambientalImageSize / 2,
                          left: (cw - ambientalImageSize) / 2,
                          top: (ch - ambientalImageSize) / 2 - 32,
                        },
                      ]}
                    />
                    {!shouldHideAmbientalTitle && (
                      <AmbientalCardTitle
                        title={s.title}
                        color="#F9F9F9"
                        numberOfLines={metadataTitleNumberOfLines ?? 2}
                      />
                    )}
                    {durationInsideWithMeta && effectiveShowDurationBadge && (
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
                        style={[
                          styles.durBadge,
                          !effectiveShowAuthor && styles.durBadgeLower,
                           { bottom: (effectiveShowAuthor ? 8 : 4) + durationLift },
                        ]}
                        textStyle={styles.durText}
                      />
                    )}
                  </>
                )}
                {useOverlayMetadata && (
                  <>
                    <LinearGradient
                      colors={[
                        "rgba(0,0,0,0)",
                        "rgba(0,0,0,0.18)",
                        "rgba(0,0,0,0.82)",
                      ]}
                      locations={[0.28, 0.58, 1]}
                      style={StyleSheet.absoluteFill}
                      pointerEvents="none"
                    />
                    <View pointerEvents="none" style={styles.sleepOverlayMetadata}>
                      {effectiveShowDurationBadge ? (
                        <SessionDurationBadge
                          label={s.durationLabel}
                          style={[styles.durBadge, styles.sleepOverlayDurationInline]}
                          textStyle={styles.durText}
                        />
                      ) : null}
                      <Text style={styles.sleepOverlayTitle} numberOfLines={2}>
                        {s.title}
                      </Text>
                      {authorName ? (
                        <Text style={styles.sleepOverlayAuthor} numberOfLines={1}>
                          {authorName}
                        </Text>
                      ) : null}
                    </View>
                  </>
                )}
                {locked && (
                  <Image
                    source={require("@/assets/images/estrella-premium.png")}
                    style={styles.star}
                    contentFit="contain"
                  />
                )}
              </View>
              {!effectiveShowCardMetadata && !useOverlayMetadata && (
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
  thumbWrap: {
    width: CARD_W,
    height: CARD_W,
    borderRadius: 15,
    overflow: "hidden",
  },
  thumb: { width: CARD_W, height: CARD_W },
  ambientalImage: {
    position: "absolute",
    overflow: "hidden",
  },
  ambientalTitleWrap: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  ambientalTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
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
  durText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
  sleepOverlayMetadata: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 13,
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
  sleepOverlayDurationInline: {
    position: "relative",
    left: undefined,
    bottom: undefined,
    alignSelf: "flex-start",
    marginBottom: 5,
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
