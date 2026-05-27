import { Feather, FontAwesome } from "@expo/vector-icons";
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
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";

type Props = {
  session: Session;
  width?: number;
  horizontal?: boolean;
};

function LockStar() {
  return (
    <FontAwesome name="star" size={20} color="#E5B84B" style={styles.lockBadge} />
  );
}

export function SessionCard({ session, width = 200, horizontal = false }: Props) {
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
          { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        {/* Warm amber tint sutil */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(190,145,50,0.04)", borderRadius: 18 }]} />
        <View style={{ width: 108, height: 96 }}>
          <Image source={session.image} style={styles.hImage} contentFit="cover" />
          {locked && <LockStar />}
        </View>
        <LinearGradient
          colors={["transparent", colors.card]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.hGradient}
        />
        <View style={styles.hContent}>
          <Text style={[styles.hCategory, { color: colors.accent }]}>
            {session.categoryLabel}
          </Text>
          <Text style={[styles.hTitle, { color: colors.foreground }]} numberOfLines={2}>
            {session.title}
          </Text>
          <View style={styles.hMeta}>
            <Feather name="clock" size={11} color={colors.mutedForeground} />
            <Text style={[styles.hDuration, { color: colors.mutedForeground }]}>
              {" "}{session.durationLabel}
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
        <Image source={session.image} style={styles.cardImage} contentFit="cover" />
        {locked && <LockStar />}
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
        {session.title}
      </Text>
      <View style={styles.cardMeta}>
        <Feather name="clock" size={11} color={colors.mutedForeground} />
        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
          {" "}{session.durationLabel}
        </Text>
      </View>
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
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  metaText: {
    fontSize: 11,
  },
  hRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    height: 96,
  },
  hImage: {
    width: 108,
    height: 96,
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
  hCategory: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
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
    right: 8,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
