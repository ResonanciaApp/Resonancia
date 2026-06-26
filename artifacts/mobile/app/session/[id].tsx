import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { getSessionById, SESSIONS } from "@/data/sessions";
import { getGuide } from "@/data/guides";
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

  // Esta pantalla cubre: Reflexiones, Ancestrales, Meditaciones.
  // Las sesiones de Música tendrán su propia pantalla de detalle.
  const isGuiada = session.categoryId === "meditaciones-guiadas";
  const isAncestral = session.categoryId === "sonidos-ancestrales";
  const [localFav, setLocalFav] = useState<boolean | null>(null);
  const fav = localFav !== null ? localFav : isFavorite(session.id);
  const isCurrentlyPlaying = currentSession?.id === session.id && isPlaying;

  const related = useMemo(() => {
    const pool = SESSIONS.filter((s) => s.categoryId === session.categoryId && s.id !== session.id);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }, [session.id]);

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

  // ── Autores de la sesión ─────────────────────────────────────────────────────
  // guideIds (array) tiene prioridad; sino guideId; sino Casa del Cuenco
  const COUNTRY_FLAG: Record<string, string> = {
    "Argentina": "🇦🇷", "Colombia": "🇨🇴", "México": "🇲🇽", "España": "🇪🇸",
    "Perú": "🇵🇪", "Chile": "🇨🇱", "Venezuela": "🇻🇪", "Uruguay": "🇺🇾",
    "Bolivia": "🇧🇴", "Ecuador": "🇪🇨", "Latinoamérica": "🌎",
  };
  const resolvedIds: string[] = session.guideIds?.length
    ? session.guideIds
    : isGuiada && session.guideId
    ? [session.guideId]
    : [];
  const authors = resolvedIds.length
    ? resolvedIds.map((gid) => getGuide(gid)).map((g) => ({
        name: g.name, firstName: g.name.split(" ")[0],
        photo: g.photo, country: g.country, flag: COUNTRY_FLAG[g.country] ?? "🌎",
        bio: g.bio, profilePath: `/guiador/${g.id}`,
      }))
    : [getGuide(undefined)].map((g) => ({
        name: g.name, firstName: g.name.split(" ")[0],
        photo: g.photo, country: g.country, flag: COUNTRY_FLAG[g.country] ?? "🌎",
        bio: g.bio, profilePath: `/guiador/${g.id}`,
      }));

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

          {/* ── Sobre la voz guía ────────────────────────────────────────── */}
          <View style={styles.authorSection}>
            <Text style={[styles.blockTitle, { color: colors.foreground }]}>
              {isAncestral
                ? "Sobre el Sonoterapeuta"
                : authors.length > 1
                  ? "Sobre las voces guía"
                  : "Sobre la voz guía"}
            </Text>
            {authors.map((a, idx) => (
              <View key={a.profilePath} style={[styles.authorCard, idx < authors.length - 1 && styles.authorCardDivider]}>
                {/* Row: avatar + name/country */}
                <View style={styles.authorRow}>
                  <Image
                    source={a.photo as never}
                    style={styles.authorAvatar}
                    contentFit="cover"
                    placeholder={BLUR_PLACEHOLDER}
                    transition={IMAGE_TRANSITION}
                  />
                  <View style={styles.authorMeta}>
                    <Text style={[styles.authorName, { color: colors.foreground }]}>{a.name}</Text>
                    <Text style={[styles.authorCountry, { color: colors.mutedForeground }]}>
                      {a.flag}{"  "}{a.country}
                    </Text>
                  </View>
                </View>
                {/* Bio */}
                <Text style={[styles.authorBio, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {a.bio}
                </Text>
                {/* Link */}
                <Pressable
                  onPress={() => router.push(a.profilePath as never)}
                  style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                >
                  <Text style={[styles.authorLink, { color: colors.primary }]}>
                    Más sobre {a.firstName}{"  "}
                    <Feather name="chevron-right" size={14} color={colors.primary} />
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* ── Más sesiones como estas ──────────────────────────────────── */}
          {related.length > 0 && (
            <View style={styles.relatedBlock}>
              <Text style={[styles.blockTitle, { color: colors.foreground }]}>
                Más sesiones como estas
              </Text>
              <View style={styles.relatedList}>
                {related.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => router.push(`/session/${s.id}` as never)}
                    style={({ pressed }) => [styles.relatedCard, { opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Image
                      source={s.image as never}
                      style={styles.relatedCardImg}
                      contentFit="cover"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                    <View style={styles.relatedCardBody}>
                      <Text style={[styles.relatedCardTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {s.title}
                      </Text>
                      <Text style={[styles.relatedCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {getGuide(s.guideIds?.[0] ?? s.guideId ?? undefined).name}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
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

  // Author section
  authorSection: { marginBottom: 28 },
  authorCard: { paddingVertical: 16 },
  authorCardDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(212,175,55,0.15)",
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  authorAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.25)",
  },
  authorMeta: { flex: 1, gap: 4 },
  authorName: { fontSize: 16, fontWeight: "700" },
  authorCountry: { fontSize: 13 },
  authorBio: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  authorLink: { fontSize: 14, fontWeight: "700" },

  blockTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 14,
  },

  // Related vertical list
  relatedBlock: { marginBottom: 20 },
  relatedList: { gap: 10 },
  relatedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  relatedCardImg: {
    width: 110,
    height: 72,
    borderRadius: 10,
  },
  relatedCardBody: {
    flex: 1,
    paddingVertical: 12,
    gap: 4,
  },
  relatedCardTitle: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  relatedCardSub: { fontSize: 12 },

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
