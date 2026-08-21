import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { PremiumBadge } from "@/components/PremiumBadge";
import { getVoiceLabel } from "@/config/audio-map";
import { getGuideById } from "@/data/guides";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";

type Props = {
  session: Session;
  rating?: number;
  style?: object;
  imageSize?: number;
  metaText?: string;
  onActionsPress?: () => void;
  onPress?: () => void;
};

export function SessionRow({ session, rating, style, imageSize = 80, metaText, onActionsPress, onPress }: Props) {
  const colors = useColors();
  const { isPremium } = usePremium();
  const { playSession, prewarmSession } = usePlayer();
  const overlay = useCategoryOverlayOptional();
  const locked = !!session.isPremium && !isPremium;
  const voiceLabel = getVoiceLabel(session);
  const guide = (session as Session & { guideId?: string }).guideId
    ? getGuideById((session as Session & { guideId?: string }).guideId!)
    : null;
  const author = guide?.name ?? "Casa del Cuenco";
  const displayRating = rating ?? 4.7;

  const defaultPress = () => {
    if (locked) { router.push("/membresia" as never); return; }
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
        <View style={[styles.sessionImgWrap, { width: imageSize, height: imageSize }]}>
          <Image
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            source={session.image as any}
            style={{ width: imageSize, height: imageSize }}
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
          <PremiumBadge session={session} />
        </View>

        <View style={styles.sessionContent}>
          <View style={styles.sessionMeta}>
            {metaText ? (
              <Text style={[styles.sessionMetaText, { color: colors.mutedForeground }]}>{metaText}</Text>
            ) : (
              <>
                <Feather name="star" size={11} color={colors.mutedForeground} />
                <Text style={[styles.sessionMetaText, { color: colors.mutedForeground }]}>
                  {" "}{displayRating.toFixed(1)}{voiceLabel ? ` · ${voiceLabel}` : ""} · {session.durationLabel}
                </Text>
              </>
            )}
          </View>
          <Text style={[styles.sessionTitle, { color: colors.foreground }]} numberOfLines={2}>
            {session.title}
          </Text>
          <Text style={[styles.sessionAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
            {author}
          </Text>
        </View>
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
  sessionImg: { width: 80, height: 80 },
  sessionContent: { flex: 1 },
  sessionMeta: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  sessionMetaText: { fontFamily: "Manrope", fontSize: 11, lineHeight: 14 },
  sessionTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 4 },
  sessionAuthor: { fontFamily: "Manrope", fontSize: 12 },
});
