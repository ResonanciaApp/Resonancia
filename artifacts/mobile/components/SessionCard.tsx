import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image } from "expo-image";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { type Session } from "@/data/sessions";
import { CATEGORIES } from "@/data/categories";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";

type Props = {
  session: Session;
  width?: number;
  horizontal?: boolean;
  tint?: "terracotta";
  cardBg?: string;
  noBorder?: boolean;
  onLongPress?: () => void;
};

function LockStar() {
  return (
    <Image
      source={require("../assets/images/estrella-premium.png")}
      style={[styles.lockBadge, { width: 22, height: 22 }]}
      contentFit="contain"
    />
  );
}


export function SessionCard({ session, width = 200, horizontal = false, tint, cardBg, noBorder, onLongPress }: Props) {
  const tintOverlay =
    tint === "terracotta" ? "rgba(184,86,46,0.11)" : "transparent";
  const colors = useColors();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const locked = !!session.isPremium && !isPremium;
  const handlePress = () => {
    if (locked) { router.push("/membresia" as never); return; }
    if (session.skipDetail) { playSession(session); router.push("/player" as never); return; }
    router.push(`/session/${session.id}` as never);
  };

  if (horizontal) {
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.hRow,
          {
            backgroundColor: cardBg ?? "transparent",
            borderWidth: 0,
            borderColor: "transparent",
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <View style={{ width: 65, height: 64 }}>
          <Image source={session.image} style={styles.hImage} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
          {locked && <LockStar />}
        </View>
        <View style={styles.hContent}>
          <View style={styles.hCategoryRow}>
            <Text style={[styles.hCategory, { color: "rgba(255,255,255,0.95)" }]}>
              {session.categoryLabel}
            </Text>
          </View>
          <Text style={[styles.hTitle, { color: colors.foreground }]} numberOfLines={2}>
            {session.title}
          </Text>
          <View style={styles.hMeta}>
            <Text style={[styles.hDuration, { color: "rgba(255,255,255,0.95)" }]}>
              {session.durationLabel}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.card,
        { width, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.imageContainer, { borderRadius: colors.radius - 4 }]}>
        <Image source={session.image} style={styles.cardImage} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
        {locked && <LockStar />}
        <View style={styles.durationBadge}>
          <Text style={styles.durationBadgeText}>{session.durationLabel}</Text>
        </View>
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
        {session.title}
      </Text>
    </Pressable>
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
  },
  cardImage: {
    width: "100%",
    height: "100%",
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
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(27,6,15,0.72)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  hRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    marginBottom: 7,
  },
  hImage: {
    width: 65,
    height: 64,
    borderRadius: 6,
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
    paddingHorizontal: 10,
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
    fontSize: 8,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  hTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    marginBottom: 3,
  },
  hMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  hDuration: {
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
    fontSize: 9,
    letterSpacing: 0.5,
  },
  lockBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
