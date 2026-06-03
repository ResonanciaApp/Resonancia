import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { PremiumBadge } from "@/components/PremiumBadge";
import { VOICE_MAP } from "@/config/audio-map";
import { getGuideById } from "@/data/guides";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";

type Props = {
  session: Session;
  rating?: number;
  style?: object;
  onActionsPress?: () => void;
};

export function SessionRow({ session, rating, style, onActionsPress }: Props) {
  const colors = useColors();
  const { isPremium } = usePremium();
  const locked = !!session.isPremium && !isPremium;
  const hasVoice = session.id in VOICE_MAP;
  const guide = (session as Session & { guideId?: string }).guideId
    ? getGuideById((session as Session & { guideId?: string }).guideId!)
    : null;
  const author = guide?.name ?? "Casa del Cuenco";
  const displayRating = rating ?? 4.7;

  return (
    <View style={[styles.sessionRow, style]}>
      <Pressable
        onPress={() => router.push((locked ? "/membresia" : `/session/${session.id}`) as never)}
        style={({ pressed }) => [styles.sessionRowInner, { opacity: pressed ? 0.78 : 1 }]}
      >
        <View style={styles.sessionImgWrap}>
          <Image
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            source={session.image as any}
            style={styles.sessionImg}
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
          <View style={styles.sessionImgOverlay}>
            <Feather name="activity" size={16} color="rgba(255,255,255,0.7)" />
          </View>
          <PremiumBadge session={session} />
        </View>

        <View style={styles.sessionContent}>
          <View style={styles.sessionMeta}>
            <Feather name="star" size={11} color={colors.mutedForeground} />
            <Text style={[styles.sessionMetaText, { color: colors.mutedForeground }]}>
              {" "}{displayRating.toFixed(1)} · {hasVoice ? "Guiada" : "Sin voz"} · {session.durationLabel}
            </Text>
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
    alignItems: "flex-start",
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
  sessionImgOverlay: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionContent: { flex: 1, paddingTop: 4 },
  sessionMeta: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  sessionMetaText: { fontSize: 11, lineHeight: 14 },
  sessionTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 4 },
  sessionAuthor: { fontSize: 12 },
});
