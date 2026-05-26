import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePlayer } from "@/context/PlayerContext";
import { type Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const RATINGS_KEY = "@resonance_ratings";

type Props = {
  session: Session;
  width?: number;
  horizontal?: boolean;
};

export function SessionCard({ session, width = 200, horizontal = false }: Props) {
  const colors = useColors();
  const { playSession } = usePlayer();

  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (session.categoryId !== "meditaciones-guiadas") return;
    AsyncStorage.getItem(RATINGS_KEY).then((val) => {
      if (!val) return;
      const map: Record<string, number> = JSON.parse(val);
      if (map[session.id]) setRating(map[session.id]);
    });
  }, [session.id, session.categoryId]);

  const isGuiada = session.categoryId === "meditaciones-guiadas";

  if (horizontal) {
    return (
      <Pressable
        onPress={() => router.push(`/session/${session.id}` as never)}
        style={({ pressed }) => [
          styles.hRow,
          { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Image source={session.image} style={styles.hImage} contentFit="cover" />
        <LinearGradient
          colors={["transparent", colors.card]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.hGradient}
        />
        <View style={styles.hContent}>
          {isGuiada ? (
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Feather
                  key={star}
                  name="star"
                  size={11}
                  color={star <= rating ? "#E8B96A" : "rgba(182,149,95,0.22)"}
                />
              ))}
              {rating === 0 && (
                <Text style={[styles.noRatingText, { color: colors.mutedForeground }]}>
                  Sin valorar
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.hCategory, { color: colors.accent }]}>
              {session.categoryLabel}
            </Text>
          )}
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
      onPress={() => router.push(`/session/${session.id}` as never)}
      style={({ pressed }) => [
        styles.card,
        { width, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.imageContainer, { borderRadius: colors.radius - 4 }]}>
        <Image source={session.image} style={styles.cardImage} contentFit="cover" />
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
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 3,
  },
  noRatingText: {
    fontSize: 9,
    letterSpacing: 0.3,
    marginLeft: 4,
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
});
