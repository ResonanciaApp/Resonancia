import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
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

import { GlowRing } from "@/components/GlowRing";
import { usePlayer } from "@/context/PlayerContext";
import { getSessionById, SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const HEADER_H = 320;
const RATINGS_KEY = "@resonance_ratings";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playSession, isFavorite, toggleFavorite, currentSession, isPlaying } = usePlayer();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // ── Rating — hooks before early return ──────────────────────────────────
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

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
  // ────────────────────────────────────────────────────────────────────────

  const session = getSessionById(id ?? "");

  if (!session) {
    return (
      <View
        style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}
      >
        <Text style={{ color: colors.mutedForeground }}>Sesión no encontrada</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.primary }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const isGuiada = session.categoryId === "meditaciones-guiadas";
  const fav = isFavorite(session.id);
  const isCurrentlyPlaying = currentSession?.id === session.id && isPlaying;

  const related = SESSIONS.filter(
    (s) => s.categoryId === session.categoryId && s.id !== session.id
  ).slice(0, 3);

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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View style={[styles.imageHeader, { height: HEADER_H + topPad }]}>
          <Image
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            source={session.image as any}
            style={StyleSheet.absoluteFill as object}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(24,17,12,0.3)", "transparent", colors.background]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glowCenter}>
            <GlowRing size={160} color="rgba(198,155,79,0.15)" delay={0} duration={4000} />
            <GlowRing size={220} color="rgba(198,155,79,0.08)" delay={600} duration={4000} />
          </View>

          {/* Nav */}
          <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.navBtn, { backgroundColor: "rgba(24,17,12,0.5)" }]}
            >
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </Pressable>
            <View style={styles.navRight}>
              {isGuiada && (
                <Pressable
                  onPress={handleShare}
                  style={[styles.navBtn, { backgroundColor: "rgba(24,17,12,0.5)" }]}
                >
                  <Feather name="share" size={20} color={colors.foreground} />
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  toggleFavorite(session.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.navBtn, { backgroundColor: "rgba(24,17,12,0.5)" }]}
              >
                <Feather name="heart" size={20} color={fav ? colors.primary : colors.foreground} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, { marginTop: -40 }]}>
          {/* Category badge — hidden for meditaciones-guiadas (redundant) */}
          {!isGuiada && (
            <View style={styles.badges}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: "rgba(198,155,79,0.15)", borderColor: "rgba(198,155,79,0.3)" },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.accent }]}>
                  {session.categoryLabel.toUpperCase()}
                </Text>
              </View>
              {session.isNew && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>NUEVO</Text>
                </View>
              )}
            </View>
          )}

          {/* For guided meditations: show tag + NEW badge */}
          {isGuiada && (
            <View style={[styles.badges, { marginBottom: 10 }]}>
              {session.meditationTag && (
                <View style={[styles.badge, { backgroundColor: "rgba(198,155,79,0.15)", borderColor: "rgba(198,155,79,0.35)" }]}>
                  <Text style={[styles.badgeText, { color: colors.accent }]}>
                    {session.meditationTag.toUpperCase()}
                  </Text>
                </View>
              )}
              {session.isNew && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>NUEVO</Text>
                </View>
              )}
            </View>
          )}

          <Text style={[styles.title, { color: colors.foreground }]}>{session.title}</Text>
          <Text style={[styles.subtitle, { color: colors.accent }]}>{session.subtitle}</Text>

          {/* 5-star rating — only for Meditaciones Guiadas */}
          {isGuiada && (
            <View style={styles.ratingWrap}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (hoverRating || rating);
                  return (
                    <Pressable
                      key={star}
                      onPress={() => handleRate(star)}
                      onPressIn={() => setHoverRating(star)}
                      onPressOut={() => setHoverRating(0)}
                      hitSlop={6}
                    >
                      <Feather
                        name="star"
                        size={28}
                        color={filled ? "#E8B96A" : "rgba(198,155,79,0.25)"}
                      />
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>
                {rating === 0
                  ? "Valora esta meditación"
                  : rating === 1
                  ? "Necesita mejorar"
                  : rating === 2
                  ? "Regular"
                  : rating === 3
                  ? "Buena"
                  : rating === 4
                  ? "Muy buena"
                  : "¡Excelente!"}
              </Text>
            </View>
          )}

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {session.durationLabel}
              </Text>
            </View>
            {session.frequency && (
              <View style={styles.metaItem}>
                <Feather name="radio" size={14} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {session.frequency}
                </Text>
              </View>
            )}
            {!isGuiada && (
              <View style={styles.metaItem}>
                <Feather name="music" size={14} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {session.instruments.length} instrumentos
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.softSand ?? "#D9C5AE" }]}>
            {session.description}
          </Text>

          {/* Benefits — hidden for Meditaciones Guiadas */}
          {!isGuiada && (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, { color: colors.foreground }]}>Beneficios</Text>
              <View style={styles.pillsRow}>
                {session.benefits.map((b) => (
                  <View
                    key={b}
                    style={[styles.pill, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <Feather name="check" size={11} color={colors.accent} />
                    <Text style={[styles.pillText, { color: colors.foreground }]}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Instruments — hidden for Meditaciones Guiadas */}
          {!isGuiada && (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, { color: colors.foreground }]}>Instrumentos</Text>
              {session.instruments.map((inst) => (
                <View key={inst} style={[styles.instrRow, { borderBottomColor: colors.border }]}>
                  <Feather name="disc" size={14} color={colors.accent} />
                  <Text style={[styles.instrText, { color: colors.foreground }]}>{inst}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Related */}
          {related.length > 0 && (
            <View style={styles.block}>
              <Text style={[styles.blockTitle, { color: colors.foreground }]}>
                Más en {session.categoryLabel}
              </Text>
              {related.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(`/session/${s.id}` as never)}
                  style={({ pressed }) => [
                    styles.relatedRow,
                    { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Image
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    source={s.image as any}
                    style={styles.relatedImg}
                  />
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

      {/* Sticky Play Button */}
      <View style={[styles.stickyPlay, { paddingBottom: bottomPad + 10, backgroundColor: "transparent" }]}>
        <LinearGradient colors={["transparent", colors.background]} style={StyleSheet.absoluteFill} />
        <Pressable
          onPress={handlePlay}
          style={({ pressed }) => [
            styles.playBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <Feather
            name={isCurrentlyPlaying ? "pause" : "play"}
            size={20}
            color={colors.primaryForeground}
          />
          <Text style={[styles.playBtnText, { color: colors.primaryForeground }]}>
            {isCurrentlyPlaying ? "Reproduciendo" : "Reproducir"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  imageHeader: {
    width: "100%",
    overflow: "hidden",
  },
  glowCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  navRight: {
    flexDirection: "row",
    gap: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 16,
  },
  ratingWrap: {
    marginBottom: 20,
    gap: 8,
  },
  stars: {
    flexDirection: "row",
    gap: 8,
  },
  ratingLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 28,
  },
  block: {
    marginBottom: 28,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 14,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
  },
  instrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  instrText: {
    fontSize: 14,
  },
  relatedRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
    padding: 10,
    gap: 12,
  },
  relatedImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
    resizeMode: "cover",
  },
  relatedInfo: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  relatedSub: {
    fontSize: 12,
  },
  stickyPlay: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#C69B4F",
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
