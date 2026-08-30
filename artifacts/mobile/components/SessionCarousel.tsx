import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import type { Session } from "@/data/sessions";
import {
  SessionCategoryPill,
  SESSION_CARD_METADATA_HEIGHT_SCALE,
  SessionCardMetadataOverlay,
} from "@/components/SessionCardMetadataOverlay";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import {
  CONTENT_CAROUSEL_GAP,
  CONTENT_CAROUSEL_HEIGHT_SCALE,
  getContentCarouselCardWidth,
} from "@/constants/carousel";

const CARD_W = 150;
const GRID_PAD = 14;
const SECTION_GAP = 53;

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
  allowOversizedCardWidth?: boolean;
  titleSize?: number;
  titleSpacing?: number;
  description?: string;
  squareCards?: boolean;
  cardAuthorColor?: string;
  showImageCategoryPill?: boolean;
  onViewAll?: () => void;
  showCardMetadata?: boolean;
  showHeader?: boolean;
};

export function SessionCarousel({
  title,
  sessions,
  isPremium,
  onPress,
  style,
  titleOffset,
  cardWidth,
  cardHeight,
  allowOversizedCardWidth = false,
  titleSize,
  titleSpacing,
  description,
  squareCards = false,
  cardAuthorColor,
  showImageCategoryPill = false,
  onViewAll,
  showCardMetadata = false,
  showHeader = true,
}: SessionCarouselProps) {
  const colors = useColors();
  const { width: viewportWidth } = useWindowDimensions();
  if (sessions.length === 0) return null;
  const requestedCardWidth = cardWidth ?? getContentCarouselCardWidth(viewportWidth);
  const cw = allowOversizedCardWidth
    ? requestedCardWidth
    : Math.min(requestedCardWidth, getContentCarouselCardWidth(viewportWidth));
  const baseCardHeight = cardHeight ?? requestedCardWidth;
  const originalCardHeight = showCardMetadata
    ? (baseCardHeight + 50) * SESSION_CARD_METADATA_HEIGHT_SCALE
    : baseCardHeight;
  const ch = squareCards
    ? cw
    : Math.round(originalCardHeight * CONTENT_CAROUSEL_HEIGHT_SCALE);
  const cardStyle = { width: cw };
  const thumbStyle = { width: cw, height: ch };
  const titleFontSize = titleSize ?? 17;
  return (
    <View style={[styles.section, style]}>
      {showHeader && (onViewAll ? (
        <View style={{ marginBottom: titleSpacing ?? 17 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[styles.sectionTitle, { fontSize: titleFontSize, marginBottom: description ? 4 : 0 }]}>{title}</Text>
            <Pressable onPress={onViewAll} hitSlop={8}>
              <Text style={{ fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: colors.primary }}>Ver todos</Text>
            </Pressable>
          </View>
          {description && (
            <Text style={[styles.sectionDescription, { color: "#acaac2" }]}>{description}</Text>
          )}
        </View>
      ) : description ? (
        <View style={{ marginBottom: titleSpacing ?? 17 }}>
          <Text style={[styles.sectionTitle, { fontSize: titleFontSize, marginBottom: 4 }]}>{title}</Text>
          <Text style={[styles.sectionDescription, { color: "#acaac2" }]}>{description}</Text>
        </View>
      ) : (
        <Text style={[styles.sectionTitle, { fontSize: titleFontSize, marginBottom: titleSpacing ?? 17 }]}>{title}</Text>
      ))}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -GRID_PAD }}
        contentContainerStyle={{ paddingHorizontal: GRID_PAD, gap: CONTENT_CAROUSEL_GAP }}
      >
        {sessions.map((s) => {
          const locked = !!s.isPremium && !isPremium;
          const authorObj = s.guideId ? getGuide(s.guideId) : getArtist(s.artistId);
          const authorName = authorObj?.name;
          return (
            <Pressable
              key={s.id}
              onPress={() => {
                if (locked) { router.push("/membresia" as never); return; }
                onPress(s);
              }}
              style={({ pressed }) => [styles.card, cardStyle, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={[styles.thumbWrap, thumbStyle]}>
                <Image source={s.image as number} style={[styles.thumb, thumbStyle]} resizeMode="cover" />
                {showCardMetadata ? (
                  <SessionCardMetadataOverlay
                    categoryId={s.categoryId}
                    durationLabel={s.durationLabel}
                    title={s.title}
                    authorName={authorName}
                  />
                ) : (
                  <>
                    {showImageCategoryPill && <SessionCategoryPill categoryId={s.categoryId} />}
                    <SessionDurationBadge
                      label={s.durationLabel}
                      style={styles.durBadge}
                      textStyle={styles.durText}
                    />
                  </>
                )}
                {locked && (
                  <Image
                    source={require("@/assets/images/estrella-premium.png")}
                    style={styles.star}
                    resizeMode="contain"
                  />
                )}
              </View>
              {!showCardMetadata && (
                <>
                  <Text style={[styles.cardTitle, { marginTop: titleOffset ?? 10 }]} numberOfLines={2}>{s.title}</Text>
                  {authorName ? (
                    <Text
                      style={[styles.cardAuthor, cardAuthorColor ? { color: cardAuthorColor } : null]}
                      numberOfLines={1}
                    >
                      {authorName}
                    </Text>
                  ) : null}
                </>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

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
                <Image
                  source={item.image}
                  style={[styles.thumb, { width: cardWidth, height: cardHeight }]}
                  resizeMode="cover"
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
  durText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
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
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 17,
  },
  cardAuthor: { fontFamily: "Manrope", fontSize: 11, color: "#F4F4F4", marginTop: 4 },
});
