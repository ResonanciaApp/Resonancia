import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { type Session } from "@/data/sessions";
import { CATEGORIES } from "@/data/categories";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import {
  SESSION_CARD_METADATA_HEIGHT_SCALE,
  SessionCardMetadataOverlay,
} from "@/components/SessionCardMetadataOverlay";
import { PressScale } from "@/components/PressScale";

type Props = {
  session: Session;
  width?: number;
  horizontal?: boolean;
  tint?: "terracotta";
  cardBg?: string;
  noBorder?: boolean;
  onLongPress?: () => void;
  destRoute?: string;
  thumbWidth?: number;
  thumbHeight?: number;
  thumbRadius?: number;
  showDuration?: boolean;
  showAuthorAvatar?: boolean;
  showAuthor?: boolean;
  showMetaBelow?: boolean;
  showCardMetadata?: boolean;
  showCategoryPill?: boolean;
  categoryPillTextOnly?: boolean;
  titleFontSize?: number;
  pinned?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Overrides the default tap behavior (navigate to /session/[id]) — e.g. play immediately in place */
  overridePress?: () => void;
  /** Shows a white border around the thumbnail to mark this as the currently loaded session */
  playing?: boolean;
  cardVariant?: "ambiental";
};

function PlayingDot() {
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={{
        position: "absolute", top: 6, right: 6,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: "#C4A8F5",
        opacity: op,
      }}
    />
  );
}

function LockStar() {
  return (
    <Image
      source={require("../assets/images/estrella-premium.png")}
      style={[styles.lockBadge, { width: 22, height: 22 }]}
      contentFit="contain"
    />
  );
}


export function SessionCard({ session, width = 200, horizontal = false, tint, cardBg, noBorder, onLongPress, destRoute, thumbWidth = 129, thumbHeight = 94, thumbRadius = 8, showDuration = true, showAuthorAvatar = true, showAuthor = true, showMetaBelow = false, showCardMetadata = false, showCategoryPill = true, categoryPillTextOnly = false, titleFontSize, pinned = false, style, overridePress, playing = false, cardVariant }: Props) {
  const tintOverlay =
    tint === "terracotta" ? "rgba(184,86,46,0.11)" : "transparent";
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { openForSession } = useAmbientalDuration();
  const locked = !!session.isPremium && !isPremium;
  const handlePress = () => {
    if (locked) { router.push("/membresia" as never); return; }
    if (openForSession(session)) return;
    if (overridePress) { overridePress(); return; }
    if (session.skipMiniPlayer) { playSession(session); return; }
    const SKIP_DETAIL_CATS = ["sonidos-ancestrales", "musica-sonidos"];
    const goToPlayer = session.skipDetail !== false && (session.skipDetail === true || SKIP_DETAIL_CATS.includes(session.categoryId ?? ""));
    if (goToPlayer) { playSession(session); router.push("/player" as never); return; }
    const base = destRoute ?? "/session";
    router.push(`${base}/${session.id}` as never);
  };
  const authorObj = session.guideId ? getGuide(session.guideId) : getArtist(session.artistId);
  const authorName  = authorObj.name;
  const authorPhoto = authorObj.photo;
  const categoryLabel = CATEGORIES.find(c => c.id === session.categoryId)?.title ?? "";
  const isAmbiental = cardVariant === "ambiental" || session.categoryId === "ambientales";
  const ambientalCardBackground = "rgba(181,211,255,0.057)";
  const ambientalImageSize = Math.round(width * 0.72);
  const ambientalCardHeight = Math.round(
    (width + 50) * SESSION_CARD_METADATA_HEIGHT_SCALE,
  );

  if (horizontal) {
    return (
      <PressScale
        onPress={handlePress}
        onLongPress={onLongPress}
        style={[
          styles.hRow,
          {
            height: Math.max(thumbHeight, 62),
            backgroundColor: cardBg ?? "transparent",
            borderWidth: 0,
            borderColor: "transparent",
          },
        ]}
      >
        <View style={{ width: thumbWidth, height: thumbHeight, borderRadius: thumbRadius, overflow: "hidden" }}>
          <Image source={session.image} style={{ width: "100%", height: "100%" }} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
          {locked && <LockStar />}
          {showDuration && <Text style={styles.hDurLabel}>{session.durationLabel}</Text>}
        </View>
        <View style={styles.hContent}>
          <View style={styles.hTitleRow}>
            <Text style={[styles.hTitle, { color: colors.foreground, flexShrink: 1 }, titleFontSize ? { fontSize: titleFontSize } : undefined]} numberOfLines={2}>
              {session.title}
            </Text>
            {pinned && <Feather name="bookmark" size={12} color="#F9F9F9" />}
          </View>
          {showMetaBelow && (
            <Text style={[styles.hMetaBelow, theme.id === "indigo2" && { color: colors.accent }]} numberOfLines={1}>
              {[session.durationLabel, categoryLabel].filter(Boolean).join(" · ")}
            </Text>
          )}
          {showAuthor && !!authorName && (
            <View style={styles.hAuthorRow}>
              {showAuthorAvatar && (
                <Image source={authorPhoto} style={styles.hAuthorAvatar} contentFit="cover" />
              )}
              <Text style={[styles.hAuthor, { color: theme.id === "indigo2" ? colors.accent : colors.mutedForeground }]} numberOfLines={1}>
                {authorName}
              </Text>
            </View>
          )}
        </View>
      </PressScale>
    );
  }

  return (
    <PressScale
      onPress={handlePress}
      onLongPress={onLongPress}
      style={[
        styles.card,
        { width },
        style,
      ]}
    >
      <View
        style={[
          styles.imageContainer,
          { borderRadius: colors.radius - 4 },
            isAmbiental
              ? {
                  height: ambientalCardHeight,
                  aspectRatio: undefined,
                  backgroundColor: ambientalCardBackground,
                }
              : showCardMetadata
            ? { height: (width + 50) * SESSION_CARD_METADATA_HEIGHT_SCALE, aspectRatio: undefined }
            : undefined,
        ]}
      >
        {!isAmbiental && (
          <Image
            source={session.image}
            style={styles.cardImage}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
        )}
        {isAmbiental ? (
          <>
            <Image
              source={session.image}
              style={[
                styles.ambientalImage,
                {
                  width: ambientalImageSize,
                  height: ambientalImageSize,
                  borderRadius: ambientalImageSize / 2,
                  left: (width - ambientalImageSize) / 2,
                  top: (ambientalCardHeight - ambientalImageSize) / 2 - 32,
                },
              ]}
              contentFit="cover"
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
            />
          </>
        ) : showCardMetadata ? (
          <SessionCardMetadataOverlay
            categoryId={session.categoryId}
            durationLabel={session.durationLabel}
            title={session.title}
            authorName={showAuthor ? authorName : undefined}
            showAuthor={showAuthor}
            durationBottom={showAuthor ? 70 : 52}
            metaBottom={showAuthor ? 15 : 20}
            metaLeft={showAuthor ? 10 : 18}
            contentLeft={showAuthor ? 8 : 18}
            showDuration={showDuration}
            showCategoryPill={showCategoryPill}
            categoryPillTextOnly={categoryPillTextOnly}
          />
        ) : showDuration ? (
          <SessionDurationBadge
            label={session.durationLabel}
            style={styles.durationBadge}
            textStyle={styles.durationBadgeText}
          />
        ) : null}
        {locked && <LockStar />}
      </View>
      {!showCardMetadata && (
        <>
          {isAmbiental ? (
            <View style={styles.ambientalCardTitleWrap}>
              <Text
                style={[
                  styles.cardTitle,
                  styles.ambientalCardTitle,
                  { color: "#F9F9F9" },
                ]}
                numberOfLines={2}
              >
                {session.title}
              </Text>
            </View>
          ) : (
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
              {session.title}
            </Text>
          )}
          {!!authorName && (
            <View style={styles.cardAuthorRow}>
              {showAuthorAvatar && (
                <Image source={authorPhoto} style={styles.cardAuthorAvatar} contentFit="cover" />
              )}
              <Text style={[styles.cardAuthor, { color: theme.id === "indigo2" ? colors.accent : colors.mutedForeground }]} numberOfLines={1}>
                {authorName}
              </Text>
            </View>
          )}
        </>
      )}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 14,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  ambientalImage: {
    position: "absolute",
    overflow: "hidden",
  },
  ambientalTitle: {
    position: "absolute",
    left: 18,
    right: 14,
    bottom: 16,
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 21,
  },
  ambientalCardTitleWrap: {
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -7 }],
  },
  ambientalCardTitle: {
    marginTop: 0,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    textAlign: "center",
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  cardAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
    paddingHorizontal: 2,
  },
  cardAuthorAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  cardAuthor: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    flexShrink: 1,
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  durationBadgeText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.95)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  hRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 94,
    marginBottom: 7,
  },
  hImage: {
    width: 129,
    height: 94,
    borderRadius: 8,
  },
  hDurLabel: {
    fontFamily: "Manrope",
    position: "absolute",
    bottom: 6,
    left: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.85)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  hMetaBelow: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(249,249,249,0.55)",
    marginTop: 4,
  },
  hAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  hAuthorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  hAuthor: {
    fontFamily: "Manrope",
    fontSize: 12,
    flex: 1,
  },
  hGradient: {
    position: "absolute",
    left: 51,
    top: 0,
    bottom: 0,
    width: 24,
  },
  hContent: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 8,
    justifyContent: "center",
  },
  hCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  hCategory: {
    fontFamily: "Manrope",
    fontSize: 8,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  hTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 21,
    marginBottom: 3,
  },
  hMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  hDuration: {
    fontFamily: "Manrope",
    fontSize: 10,
  },
  freqPill: {
    marginLeft: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  freqText: {
    fontFamily: "Manrope",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  lockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
