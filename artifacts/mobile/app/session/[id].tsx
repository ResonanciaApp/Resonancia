import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Image } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/PlayerContext";
import { CATEGORIES } from "@/data/categories";
import { getSessionById, SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const HEADER_H = 300;
const RATINGS_KEY = "@resonance_ratings";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playSession, isFavorite, toggleFavorite, currentSession, isPlaying } = usePlayer();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem(RATINGS_KEY).then((val) => {
      if (!val) return;
      const map: Record<string, number> = JSON.parse(val);
      if (map[id]) setRating(map[id]);
    });
  }, [id]);

  const handleRate = useCallback(
    async (stars: number) => {
      if (!id) return;
      setRating(stars);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const val = await AsyncStorage.getItem(RATINGS_KEY);
      const map: Record<string, number> = val ? JSON.parse(val) : {};
      map[id] = stars;
      await AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(map));
    },
    [id]
  );

  const session = getSessionById(id ?? "");

  if (!session) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.mutedForeground }}>Sesión no encontrada</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const isMusica = session.categoryId === "musica-sonidos";
  const isGuiada = session.categoryId === "meditaciones-guiadas";
  const isAncestral = session.categoryId === "sonidos-ancestrales";
  const isSabiduría = session.categoryId === "sabiduria-dia";
  const isPodcast = session.categoryId === "podcast";
  const [localFav, setLocalFav] = useState<boolean | null>(null);
  const fav = localFav !== null ? localFav : isFavorite(session.id);
  const isCurrentlyPlaying = currentSession?.id === session.id && isPlaying;

  const related = SESSIONS.filter(
    (s) => s.categoryId === session.categoryId && s.id !== session.id
  ).slice(0, 3);

  // Tinted background derived from the session's category (gradient[1] = darker shade)
  const category = CATEGORIES.find((c) => c.id === session.categoryId);
  const categoryBg = category?.gradient[1] ?? colors.background;

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSession(session);
    router.push("/player" as never);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      title: session.title,
      message: `✨ Estoy escuchando "${session.title}" en RESONANCIA — meditación y sanación con sonido. ¿Te unes?`,
    });
  };

  const handleFav = () => {
    const next = !fav;
    setLocalFav(next);
    toggleFavorite(session.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ── Guide initials ──────────────────────────────────────────────────────────
  const guideInitials = session.guide
    ? session.guide.name.split(" ").map((w) => w[0]).slice(0, 2).join("")
    : "";

  // ── Badge block helper ──────────────────────────────────────────────────────
  const renderBadges = () => {
    let tag: string | undefined;
    let tagColor = colors.accent;
    let tagBg = "rgba(182,149,95,0.15)";
    let tagBorder = "rgba(182,149,95,0.3)";

    if (isGuiada && session.meditationTag) {
      tag = session.meditationTag;
      tagColor = "#C8B4E0";
      tagBg = "rgba(200,180,224,0.15)";
      tagBorder = "rgba(200,180,224,0.35)";
    }
    else if (isAncestral && session.ancestralTag) tag = session.ancestralTag;
    else if (isPodcast) {
      tag = "Podcast";
      tagColor = "#8AAAD4";
      tagBg = "rgba(138,170,212,0.15)";
      tagBorder = "rgba(138,170,212,0.35)";
    } else if (isSabiduría && session.sabiduriaTag) tag = session.sabiduriaTag;
    else if (!isGuiada && !isAncestral && !isSabiduría && !isPodcast && !isMusica) {
      tag = session.categoryLabel;
    }

    if (!tag && !session.isNew) return null;
    return (
      <View style={styles.badges}>
        {tag && (
          <View style={[styles.badge, { backgroundColor: tagBg, borderColor: tagBorder }]}>
            <Text style={[styles.badgeText, { color: tagColor }]}>{tag.toUpperCase()}</Text>
          </View>
        )}
        {session.isNew && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>NUEVO</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: categoryBg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 110 + bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero image ──────────────────────────────────────────────────── */}
        <View style={[styles.hero, { height: HEADER_H + topPad }]}>
          <Image source={session.image} style={StyleSheet.absoluteFill as object} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
          <LinearGradient
            colors={["rgba(0,0,0,0.25)", "transparent", categoryBg]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
            <Pressable onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: "rgba(24,17,12,0.5)" }]}>
              <Feather name="arrow-left" size={20} color="#FFF" />
            </Pressable>
          </View>
        </View>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <View style={[styles.content, { marginTop: -36 }]}>

          {/* Badges */}
          {renderBadges()}

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>{session.title}</Text>

          {/* Meta row: duration · small stars */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{session.durationLabel}</Text>
            </View>
            {/* Small inline rating */}
            <View style={styles.metaItem}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => handleRate(star)} hitSlop={4}>
                  <Feather
                    name="star"
                    size={13}
                    color={star <= rating ? "#E8B96A" : "rgba(182,149,95,0.28)"}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.softSand ?? "#C8C1B5" }]}>
            {session.description}
          </Text>

          {/* ── Action row ──────────────────────────────────────────────── */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleFav}
              style={({ pressed }) => [styles.actionCard, { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="heart" size={20} color={fav ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.actionLabel, { color: fav ? colors.primary : colors.mutedForeground }]}>Guardar</Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.actionCard, { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="share-2" size={20} color={colors.mutedForeground} />
              <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>Compartir</Text>
            </Pressable>
          </View>

          {/* ── Sobre la voz guía ────────────────────────────────────────── */}
          {!isMusica && session.guide && (
            <View style={styles.guideBlock}>
              <Text style={[styles.blockTitle, { color: colors.foreground }]}>Sobre la voz guía</Text>
              <View style={styles.guideCard}>
                <View style={[styles.guideAvatar, { backgroundColor: "rgba(182,149,95,0.18)" }]}>
                  <Text style={[styles.guideInitials, { color: colors.primary }]}>{guideInitials}</Text>
                </View>
                <View style={styles.guideMeta}>
                  <Text style={[styles.guideName, { color: colors.foreground }]}>{session.guide.name}</Text>
                  <View style={styles.guideCountryRow}>
                    <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.guideCountry, { color: colors.mutedForeground }]}>{session.guide.country}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── Más en … ─────────────────────────────────────────────────── */}
          {related.length > 0 && (
            <View style={styles.relatedBlock}>
              <Text style={[styles.blockTitle, { color: colors.foreground }]}>
                Más en {session.categoryLabel}
              </Text>
              {related.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/session/${s.id}` as never)}
                  style={({ pressed }) => [
                    styles.relatedRow,
                    { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Image source={s.image as never} style={styles.relatedImg} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
                  <View style={styles.relatedInfo}>
                    <Text style={[styles.relatedTitle, { color: colors.foreground }]}>{s.title}</Text>
                    <Text style={[styles.relatedSub, { color: colors.mutedForeground }]}>
                      {s.subtitle} · {s.durationLabel}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.border} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky "Escuchar ahora" ──────────────────────────────────────── */}
      <View style={[styles.stickyPlay, { paddingBottom: bottomPad + 10 }]}>
        <LinearGradient colors={["transparent", categoryBg]} style={StyleSheet.absoluteFill} />
        <Pressable
          onPress={handlePlay}
          style={({ pressed }) => [
            styles.playBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Text style={[styles.playBtnText, { color: colors.primaryForeground }]}>
            {isCurrentlyPlaying ? "Reproduciendo" : "Escuchar ahora"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  // Hero
  hero: { width: "100%", overflow: "hidden" },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Content
  content: { paddingHorizontal: 20 },

  // Badges
  badges: { flexDirection: "row", gap: 8, marginBottom: 12 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 9, letterSpacing: 1.5, fontWeight: "700" },

  // Title
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    marginBottom: 12,
  },

  // Meta
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13 },

  // Description
  description: {
    fontSize: 15,
    lineHeight: 25,
    marginBottom: 24,
  },

  // Action row
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Guide
  guideBlock: { marginBottom: 28 },
  guideCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 4,
  },
  guideAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  guideInitials: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  guideMeta: { flex: 1 },
  guideName: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  guideCountryRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  guideCountry: { fontSize: 12 },

  blockTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 14,
  },

  // Related
  relatedBlock: { marginBottom: 10 },
  relatedRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    padding: 10,
    gap: 12,
  },
  relatedImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  relatedInfo: { flex: 1 },
  relatedTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  relatedSub: { fontSize: 12 },

  // Sticky play
  stickyPlay: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  playBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#B6955F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  playBtnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
