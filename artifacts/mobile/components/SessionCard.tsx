import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePlayer } from "@/context/PlayerContext";
import { type Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

type Props = {
  session: Session;
  width?: number;
  horizontal?: boolean;
};

export function SessionCard({ session, width = 200, horizontal = false }: Props) {
  const colors = useColors();
  const { isFavorite, toggleFavorite, playSession } = usePlayer();
  const fav = isFavorite(session.id);

  if (horizontal) {
    return (
      <Pressable
        onPress={() => router.push(`/session/${session.id}` as never)}
        style={({ pressed }) => [
          styles.hRow,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Image source={session.image} style={styles.hImage} />
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
            {session.frequency ? (
              <View style={[styles.freqPill, { borderColor: colors.border }]}>
                <Text style={[styles.freqText, { color: colors.accent }]}>
                  {session.frequency}
                </Text>
              </View>
            ) : null}
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
        <Image source={session.image} style={styles.cardImage} />
        <Pressable
          onPress={() => toggleFavorite(session.id)}
          style={styles.favBtn}
        >
          <Feather
            name="heart"
            size={16}
            color={fav ? colors.primary : "rgba(237,225,211,0.6)"}
          />
        </Pressable>
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
    resizeMode: "cover",
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
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    height: 96,
  },
  hImage: {
    width: 108,
    height: 96,
    resizeMode: "cover",
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
});
