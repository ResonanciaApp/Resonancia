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
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";

type Props = {
  session: Session;
  width?: number;
  horizontal?: boolean;
  tint?: "terracotta";
  cardBg?: string;
  noBorder?: boolean;
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


export function SessionCard({ session, width = 200, horizontal = false, tint, cardBg, noBorder }: Props) {
  const tintOverlay =
    tint === "terracotta" ? "rgba(184,86,46,0.11)" : "transparent";
  const colors = useColors();
  const { isPremium } = usePremium();
  const locked = !!session.isPremium && !isPremium;
  const handlePress = () => {
    if (locked) router.push("/membresia" as never);
    else router.push(`/session/${session.id}` as never);
  };

  if (horizontal) {
    return (
      <Pressable
        onPress={handlePress}
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
        <View style={{ width: 108, height: 96 }}>
          <Image source={session.image} style={styles.hImage} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
          {locked && <LockStar />}
        </View>
        <View style={styles.hContent}>
          <View style={styles.hCategoryRow}>
            <Text style={[styles.hCategory, { color: colors.mutedForeground }]}>
              {session.categoryLabel}
            </Text>
          </View>
          <Text style={[styles.hTitle, { color: colors.foreground }]} numberOfLines={2}>
            {session.title}
          </Text>
          <View style={styles.hMeta}>
            <Text style={[styles.hDuration, { color: colors.mutedForeground }]}>
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
    right: 8,
    backgroundColor: "rgba(6,10,15,0.72)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#EDE1D3",
  },
  hRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    height: 96,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(122,143,168,0.13)",
  },
  hImage: {
    width: 108,
    height: 96,
    borderRadius: 12,
  },
  hGradient: {
    position: "absolute",
    left: 80,
    top: 0,
    bottom: 0,
    width: 36,
  },
  hContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
  },
  hCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  hCategory: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  hTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 5,
  },
  hMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  hDuration: {
    fontSize: 11,
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
