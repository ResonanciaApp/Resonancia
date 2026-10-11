import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import React from "react";
import { CardCaptionText as Text } from "@/components/CardCaptionText";
import {
  Pressable,
  StyleSheet,
  View,
  type TextStyle,
} from "react-native";
import { Image } from "expo-image";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { CARD_TEXT_ABOVE, CARD_TEXT_BELOW } from "@/constants/colors";
import { PremiumBadge } from "@/components/PremiumBadge";
import {
  SessionCategoryPill,
} from "@/components/SessionCardMetadataOverlay";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { SessionBadgeGlass } from "@/components/SessionDurationBadge";
import { getVoiceLabel } from "@/config/audio-map";
import { getArtist } from "@/data/artists";
import { getGuideById } from "@/data/guides";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
import { openPremiumPlans } from "@/lib/premiumGate";

type Props = {
  session: Session;
  rating?: number;
  style?: object;
  imageSize?: number;
  imageOffsetX?: number;
  metaText?: string;
  metaTextColor?: string;
  metaFontSize?: number;
  showCategoryPill?: boolean;
  showCategoryText?: boolean;
  categoryPillPlain?: boolean;
  categoryPillOutlineColor?: string;
  categoryPillTextOnly?: boolean;
  categoryPillTinted?: boolean;
  categoryPillPlainIcon?: boolean;
  categoryPillShowIconGlyph?: boolean;
  categoryPillIconSize?: number;
  showDurationBadge?: boolean;
  showChevron?: boolean;
  authorColor?: string;
  authorFontSize?: number;
  titleFontSize?: number;
  titleFontWeight?: TextStyle["fontWeight"];
  staticPlayBadge?: boolean;
  hideMeta?: boolean;
  secondaryText?: string;
  chevronColor?: string;
  chevronOffsetX?: number;
  onActionsPress?: () => void;
  onPress?: () => void;
};

export function SessionRow({
  session,
  rating,
  style,
  imageSize = 80,
  imageOffsetX = 0,
  metaText,
  metaTextColor,
  metaFontSize,
  showCategoryPill = false,
  showCategoryText = false,
  categoryPillPlain = true,
  categoryPillOutlineColor,
  categoryPillTextOnly = false,
  categoryPillTinted = false,
  categoryPillPlainIcon = false,
  categoryPillShowIconGlyph = true,
  categoryPillIconSize = 19,
  showDurationBadge = false,
  showChevron = false,
  authorColor,
  authorFontSize,
  titleFontSize,
  titleFontWeight,
  staticPlayBadge = false,
  hideMeta = false,
  secondaryText,
  chevronColor,
  chevronOffsetX = 0,
  onActionsPress,
  onPress,
}: Props) {
  const colors = useColors();
  const { isPremium } = usePremium();
  const { playSession, prewarmSession } = usePlayer();
  const overlay = useCategoryOverlayOptional();
  const locked = !!session.isPremium && !isPremium;
  const voiceLabel = getVoiceLabel(session);
  const guideId = session.guideIds?.[0] ?? session.guideId;
  const guide = guideId ? getGuideById(guideId) : undefined;
  const artist = session.artistId ? getArtist(session.artistId) : undefined;
  const author = guide?.name ?? artist?.name ?? "Casa del Cuenco";
  const displayRating = rating ?? 4.7;

  const defaultPress = () => {
    if (locked) { openPremiumPlans(); return; }
    if (session.skipMiniPlayer) { playSession(session); return; }
    if (session.skipDetail) { playSession(session); router.push("/player" as never); return; }
    if (overlay) overlay.openCategory(`/session/${session.id}`);
    else router.push(`/session/${session.id}` as never);
  };

  return (
    <View style={[styles.sessionRow, style]}>
      <Pressable
        onPress={onPress ?? defaultPress}
        onPressIn={() => {
          if (!onPress && !locked && (session.skipDetail || session.skipMiniPlayer)) {
            prewarmSession(session);
          }
        }}
        style={({ pressed }) => [styles.sessionRowInner, { opacity: pressed ? 0.78 : 1 }]}
      >
        <View
          style={[
            styles.sessionThumb,
            {
              width: imageSize,
              height: imageSize,
              transform: [{ translateX: imageOffsetX }],
            },
          ]}
        >
          <View style={[styles.sessionImgWrap, { width: imageSize, height: imageSize }]}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              source={session.image as any}
              style={{ width: imageSize, height: imageSize }}
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
            />
            <PremiumBadge session={session} />
            {staticPlayBadge && (
              <View pointerEvents="none" style={styles.staticPlayBadge}>
                <SessionBadgeGlass showBlackTint={false} />
                <View style={styles.staticPlayBadgeTint} />
                <MaterialCommunityIcons
                  name="play"
                  size={17}
                  color="#F9F9F9"
                />
              </View>
            )}
            {showDurationBadge && (
              <SessionDurationBadge
                label={session.durationLabel}
                style={styles.rowDurationBadge}
                textStyle={[styles.rowDurationText, { color: CARD_TEXT_ABOVE }]}
              />
            )}
          </View>
        </View>

        <View style={styles.sessionContent}>
          {!hideMeta && (
            showCategoryText ? (
              <View style={styles.sessionMeta}>
                <Text
                  style={[
                    styles.sessionAuthor,
                    { color: CARD_TEXT_ABOVE },
                    authorFontSize !== undefined && { fontSize: authorFontSize },
                  ]}
                  numberOfLines={1}
                >
                  {session.categoryLabel}
                </Text>
              </View>
            ) : showCategoryPill ? (
              <View style={styles.sessionMeta}>
                <SessionCategoryPill
                  categoryId={session.categoryId}
                  inline
                  plain={categoryPillPlain}
                  textOnly={categoryPillTextOnly}
                  tinted={categoryPillTinted}
                  plainIcon={categoryPillPlainIcon}
                  outlineColor={categoryPillOutlineColor}
                  textStyle={{ color: CARD_TEXT_ABOVE }}
                  showIconGlyph={categoryPillShowIconGlyph}
                  iconSize={categoryPillIconSize}
                />
              </View>
            ) : (
              <View style={styles.sessionMeta}>
                {metaText ? (
                  <Text style={[styles.sessionMetaText, { color: metaTextColor ?? CARD_TEXT_ABOVE }, metaFontSize !== undefined && { fontSize: metaFontSize }]}>{metaText}</Text>
                ) : (
                  <>
                    <Feather name="star" size={11} color={colors.mutedForeground} />
                     <Text style={[styles.sessionMetaText, { color: CARD_TEXT_ABOVE }]}>
                      {" "}{displayRating.toFixed(1)}{voiceLabel ? ` · ${voiceLabel}` : ""} · {session.durationLabel}
                    </Text>
                  </>
                )}
              </View>
            )
          )}
          <Text
            style={[
              styles.sessionTitle,
              { color: colors.foreground },
              titleFontSize !== undefined && {
                fontSize: titleFontSize,
                lineHeight: titleFontSize + 5,
              },
              titleFontWeight !== undefined && {
                fontWeight: titleFontWeight,
              },
            ]}
            numberOfLines={2}
          >
            {session.title}
          </Text>
          <Text
            style={[
              styles.sessionAuthor,
               { color: authorColor ?? CARD_TEXT_BELOW },
              authorFontSize !== undefined && { fontSize: authorFontSize },
            ]}
            numberOfLines={1}
          >
            {secondaryText ?? author}
          </Text>
        </View>
        {showChevron && (
          <Feather
            name="chevron-right"
            size={25}
            color={chevronColor ?? colors.mutedForeground}
            style={[styles.chevron, chevronOffsetX !== 0 && { transform: [{ translateX: chevronOffsetX }] }]}
          />
        )}
      </Pressable>

      {onActionsPress && (
        <Pressable
          onPress={onActionsPress}
          hitSlop={10}
          style={({ pressed }) => [styles.moreBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Feather name="more-vertical" size={20} color={colors.mutedForeground} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  sessionRowInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  moreBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionImgWrap: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  staticPlayBadge: {
    position: "absolute",
    zIndex: 5,
    left: 8,
    bottom: 8,
    width: 29,
    height: 29,
    borderRadius: 14.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  staticPlayBadgeTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  rowDurationBadge: {
    position: "absolute",
    left: 6,
    bottom: 6,
  },
  rowDurationText: {
    fontSize: 11,
  },
  sessionThumb: { position: "relative", zIndex: 1 },
  sessionImg: { width: 80, height: 80 },
  sessionContent: { flex: 1 },
  chevron: { marginLeft: 2 },
  sessionMeta: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  sessionMetaText: { fontFamily: "Manrope", fontSize: 11, lineHeight: 14 },
  sessionTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 4 },
  sessionAuthor: { fontFamily: "Manrope", fontSize: 12, flexShrink: 1 },
});
