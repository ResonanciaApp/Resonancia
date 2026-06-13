import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import type { Session } from "@/data/sessions";

const CARD_W = 150;
const GRID_PAD = 15;
const SECTION_GAP = 23;

// ── Carrusel de sesiones (con píldora de duración) ────────────────────────────
type SessionCarouselProps = {
  title: string;
  sessions: Session[];
  isPremium: boolean;
  onPress: (s: Session) => void;
};

export function SessionCarousel({ title, sessions, isPremium, onPress }: SessionCarouselProps) {
  if (sessions.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -GRID_PAD }}
        contentContainerStyle={{ paddingHorizontal: GRID_PAD, gap: 16 }}
      >
        {sessions.map((s) => {
          const locked = !!s.isPremium && !isPremium;
          const creator =
            s.categoryId === "meditaciones-guiadas"
              ? getGuide(s.guideId)
              : getArtist(s.artistId);
          return (
            <Pressable
              key={s.id}
              onPress={() => {
                if (locked) { router.push("/membresia" as never); return; }
                onPress(s);
              }}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
            >
              <View style={styles.thumbWrap}>
                <Image source={s.image as number} style={styles.thumb} resizeMode="cover" />
                {locked && (
                  <Image
                    source={require("@/assets/images/estrella-premium.png")}
                    style={styles.star}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.durBadge}>
                  <Text style={styles.durText}>{s.durationLabel}</Text>
                </View>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{s.title}</Text>
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
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -GRID_PAD }}
        contentContainerStyle={{ paddingHorizontal: GRID_PAD, gap: 16 }}
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onPress(item.id)}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={styles.thumbWrap}>
              {item.image != null ? (
                <Image source={item.image} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Feather name="music" size={32} color="#D4AF37" />
                </View>
              )}
            </View>
            <View style={styles.cardTitleWrap}>
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
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 11,
    color: "#FFFFFF",
  },
  card: { width: CARD_W },
  thumbWrap: {
    width: CARD_W,
    height: CARD_W,
    borderRadius: 10,
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
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durText: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },
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
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 17,
  },
  cardCreator: { fontSize: 11, color: "rgba(242,231,228,0.45)", marginTop: 4 },
});
