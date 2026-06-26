import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import {
  Dimensions,
  Linking,
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
import { getGuide } from "@/data/guides";
import { getArtist } from "@/data/artists";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const HEADER_H = 300;
export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playSession, isFavorite, toggleFavorite, currentSession, isPlaying } = usePlayer();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
  const isPodcast = session.categoryId === "reflexiones";
  const [localFav, setLocalFav] = useState<boolean | null>(null);
  const fav = localFav !== null ? localFav : isFavorite(session.id);
  const isCurrentlyPlaying = currentSession?.id === session.id && isPlaying;

  const related = SESSIONS.filter(
    (s) => s.categoryId === session.categoryId && s.id !== session.id
  ).slice(0, 3);

  // Tinted background derived from the session's category (gradient[1] = darker shade)
  // Darkened ~60% to keep a subtle tint without being too bright.
  const category = CATEGORIES.find((c) => c.id === session.categoryId);
  const categoryBg = colors.background;
  const actionTint = colors.card;

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

  // ── Autor de la sesión (guiador o artista según categoría) ──────────────────
  const guide = isGuiada ? getGuide(session.guideId) : undefined;
  const artist = isMusica ? getArtist(session.artistId) : undefined;
  const author = guide
    ? { name: guide.name, photo: guide.photo, country: guide.country, bio: guide.bio, profilePath: `/guiador/${guide.id}` as const }
    : artist
    ? { name: artist.name, photo: artist.photo, country: artist.country, bio: artist.bio, profilePath: `/artista/${artist.id}` as const }
    : undefined;

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />
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
            colors={["rgba(46,5,16,0.15)", "transparent", "#2E0510"]}
            locations={[0, 0.38, 1]}
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

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>{session.title}</Text>

          {/* Meta row: duration */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{session.durationLabel}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.softSand ?? "#FFFFFF" }]}>
            {session.description}
          </Text>

          {/* ── Action row ──────────────────────────────────────────────── */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleFav}
              style={({ pressed }) => [styles.actionCard, { backgroundColor: "rgba(255,255,255,0.07)", opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="heart" size={20} color={fav ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.actionLabel, { color: fav ? colors.primary : colors.mutedForeground }]}>Guardar</Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.actionCard, { backgroundColor: "rgba(255,255,255,0.07)", opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="share-2" size={20} color={colors.mutedForeground} />
              <Text style={[styles.actionLabel, { color: colors.mutedForeground }]}>Compartir</Text>
            </Pressable>
          </View>

          {/* ── Participantes (solo podcast) ──────────────────────────────── */}
          {isPodcast && (
            <View style={styles.participantsBlock}>
              <Text style={[styles.blockTitle, { color: colors.foreground }]}>Participantes</Text>

              <View style={styles.participantRow}>
                <View style={[styles.participantIcon, { backgroundColor: actionTint }]}>
                  <Feather name="mic" size={16} color={colors.primary} />
                </View>
                <View style={styles.participantMeta}>
                  <Text style={[styles.participantName, { color: colors.foreground }]}>
                    ElSeñordelosCuencos
                  </Text>
                  <Text style={[styles.participantRole, { color: colors.mutedForeground }]}>
                    Anfitrión
                  </Text>
                </View>
              </View>

              {session.guests?.map((g) => {
                const tappable = !!g.instagram;
                const content = (
                  <>
                    <View style={[styles.participantIcon, { backgroundColor: actionTint }]}>
                      <Feather name="user" size={16} color={colors.mutedForeground} />
                    </View>
                    <View style={styles.participantMeta}>
                      <Text style={[styles.participantName, { color: colors.foreground }]}>
                        {g.name}
                      </Text>
                      <Text style={[styles.participantRole, { color: colors.mutedForeground }]}>
                        {g.role}
                      </Text>
                    </View>
                    {tappable && (
                      <Feather name="instagram" size={18} color={colors.primary} />
                    )}
                  </>
                );
                return tappable ? (
                  <Pressable
                    key={g.name}
                    onPress={() => Linking.openURL(g.instagram!)}
                    style={({ pressed }) => [styles.participantRow, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    {content}
                  </Pressable>
                ) : (
                  <View key={g.name} style={styles.participantRow}>
                    {content}
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Tarjeta del autor ─────────────────────────────────────────── */}
          {author && (
            <View style={styles.authorBlock}>
              <Image
                source={author.photo as never}
                style={styles.authorAvatar}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
              />
              <Text style={[styles.authorName, { color: colors.foreground }]}>{author.name}</Text>
              <View style={styles.authorCountryRow}>
                <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                <Text style={[styles.authorCountryText, { color: colors.mutedForeground }]}>{author.country}</Text>
              </View>
              <Text style={[styles.authorBio, { color: colors.mutedForeground }]} numberOfLines={2}>
                {author.bio}
              </Text>
              <Pressable
                onPress={() => router.push(author.profilePath as never)}
                style={({ pressed }) => [styles.authorBtn, { opacity: pressed ? 0.75 : 1, borderColor: "rgba(212,175,55,0.25)" }]}
              >
                <Text style={[styles.authorBtnText, { color: colors.primary }]}>
                  Más sobre {author.name}
                </Text>
                <Feather name="chevron-right" size={15} color={colors.primary} />
              </Pressable>
            </View>
          )}

          {/* ── Más en … ─────────────────────────────────────────────────── */}
          {!isGuiada && !isAncestral && related.length > 0 && (
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
                    { backgroundColor: "rgba(255,255,255,0.05)", opacity: pressed ? 0.8 : 1 },
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
        <LinearGradient colors={["transparent", "#1B060F"]} style={StyleSheet.absoluteFill} />
        <Pressable
          onPress={handlePlay}
          style={({ pressed }) => [
            styles.playBtn,
            { overflow: "hidden", opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <LinearGradient
            colors={["#D6AD5F", "#B47344"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
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
  badges: { flexDirection: "row", gap: 8, marginBottom: 12, justifyContent: "center" },
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
    textAlign: "center",
  },

  // Meta
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    textAlign: "center",
  },

  // Theme tag chips
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },

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

  // Author card
  authorBlock: {
    alignItems: "center",
    marginBottom: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "rgba(74,12,12,0.18)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.12)",
  },
  authorAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.3)",
  },
  authorName: { fontSize: 17, fontWeight: "700", marginBottom: 4, textAlign: "center" },
  authorCountryRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 },
  authorCountryText: { fontSize: 12 },
  authorBio: { fontSize: 13, lineHeight: 19, textAlign: "center", marginBottom: 16 },
  authorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  authorBtnText: { fontSize: 13, fontWeight: "600" },

  blockTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 14,
  },

  // Participantes
  participantsBlock: { marginBottom: 28 },
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },
  participantIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  participantMeta: { flex: 1 },
  participantName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  participantRole: { fontSize: 12 },

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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  playBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: "#D4AF37",
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
