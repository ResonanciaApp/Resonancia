import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import {
  Animated,
  Dimensions,
  Easing,
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

function GlowPill({ onPress, pillStyle }: { onPress: () => void; pillStyle: object }) {
  const scale  = useRef(new Animated.Value(1)).current;
  const bright = useRef(new Animated.Value(0)).current;

  function handlePressIn() {
    Animated.parallel([
      Animated.timing(scale,  { toValue: 1.32, duration: 160, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(bright, { toValue: 1,    duration: 160, easing: Easing.out(Easing.quad),       useNativeDriver: true }),
    ]).start();
  }

  function handlePressOut() {
    Animated.parallel([
      Animated.spring(scale,  { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }),
      Animated.timing(bright, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
    onPress();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={pillStyle}>
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: 19,
            backgroundColor: "rgba(255,255,255,0.28)",
            opacity: bright,
          }}
        />
        <Feather name="arrow-left" size={22} color="#FFF" />
      </Pressable>
    </Animated.View>
  );
}

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
  const isReflexion = session.categoryId === "reflexiones";
  const CATEGORY_BG: Record<string, {
    gradient: [string, string]; solid: string;
    pillBg: string; labelGradient: [string, string]; labelColor: string;
  }> = {
    "sonidos-ancestrales":  { gradient: ["#2E0510", "#160108"], solid: "#160108", pillBg: "#4A0C0C", labelGradient: ["#FFF8EE", "#FFEEDD"], labelColor: "#7A1020" },
    "meditaciones-guiadas": { gradient: ["#1A0F2E", "#0D0A1A"], solid: "#0D0A1A", pillBg: "#2A1848", labelGradient: ["#EEE8FF", "#E0D5FF"], labelColor: "#3D1A7A" },
    "reflexiones":          { gradient: ["#0A0F20", "#060A14"], solid: "#060A14", pillBg: "#0D1835", labelGradient: ["#E8EEFF", "#D8E6FF"], labelColor: "#1A3A8A" },
    "musica-sonidos":       { gradient: ["#081409", "#030806"], solid: "#030806", pillBg: "#0D2010", labelGradient: ["#E8F5EA", "#D5EDD8"], labelColor: "#3A8A40" },
  };
  const catBg = CATEGORY_BG[session.categoryId] ?? CATEGORY_BG["sonidos-ancestrales"];
  const categoryPill = isAncestral ? "Ancestral" : isGuiada ? "Meditación" : isReflexion ? "Reflexión" : null;
  const categoryIcon: string = isAncestral ? "headphones" : isGuiada ? "moon" : "book-open";
  const [localFav, setLocalFav] = useState<boolean | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const STICKY_START = (HEADER_H + topPad) * 0.3;
  const STICKY_END   = (HEADER_H + topPad) * 0.95;
  const stickyOpacity = scrollY.interpolate({
    inputRange: [STICKY_START, STICKY_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
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

  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: descarga real cuando el backend soporte offline
    alert("Próximamente podrás descargar esta sesión para escucharla sin conexión.");
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
    <View style={[styles.root, { backgroundColor: catBg.solid }]}>
      <LinearGradient colors={catBg.gradient} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 110 + bottomPad }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* ── Hero image ──────────────────────────────────────────────────── */}
        <View style={[styles.hero, { height: HEADER_H + topPad }]}>
          <Image source={session.image} style={StyleSheet.absoluteFill as object} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
          <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
            <GlowPill onPress={() => router.back()} pillStyle={[styles.heroBackPill, { backgroundColor: catBg.pillBg }]} />
          </View>
        </View>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <View style={styles.content}>

          {/* Category pill */}
          {categoryPill && (
            <LinearGradient
              colors={["#FFFFFF", "#FFF8EE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.categoryPill}
            >
              <Feather name={categoryIcon as never} size={17} color={catBg.labelColor} />
              <Text style={[styles.categoryPillText, { color: catBg.labelColor }]}>{categoryPill}</Text>
              <Text style={[styles.categoryPillSep, { color: catBg.labelColor }]}>·</Text>
              <Text style={[styles.durationText, { color: catBg.labelColor }]}>{session.durationLabel.replace(" min", "m")}</Text>
            </LinearGradient>
          )}

          {/* Title */}
          <Text style={[styles.title, { color: colors.foreground }]}>{session.title}</Text>

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
              <Feather name="heart" size={20} color={fav ? colors.primary : "rgba(255,255,255,0.9)"} />
              <Text style={[styles.actionLabel, { color: fav ? colors.primary : "rgba(255,255,255,0.9)" }]}>Guardar</Text>
            </Pressable>

            <Pressable
              onPress={handleDownload}
              style={({ pressed }) => [styles.actionCard, { backgroundColor: "rgba(255,255,255,0.07)", opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="download" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={[styles.actionLabel, { color: "rgba(255,255,255,0.9)" }]}>Descargar</Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.actionCard, { backgroundColor: "rgba(255,255,255,0.07)", opacity: pressed ? 0.8 : 1 }]}
            >
              <Feather name="share-2" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={[styles.actionLabel, { color: "rgba(255,255,255,0.9)" }]}>Compartir</Text>
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
                <Text style={[styles.authorBio, { color: "rgba(255,255,255,0.9)" }]} numberOfLines={2}>
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
                      {(() => {
                        const g = getGuide(s.guideIds?.[0] ?? s.guideId ?? undefined);
                        return (
                          <View style={styles.relatedAuthorRow}>
                            <Image source={g.photo} style={styles.relatedAuthorAvatar} contentFit="cover" />
                            <Text style={[styles.relatedCardSub, { color: "rgba(255,255,255,0.9)" }]} numberOfLines={1}>
                              {g.name}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* ── Sticky header (aparece al scrollear) ─────────────────────────── */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.stickyHeader, { paddingTop: topPad, opacity: stickyOpacity, backgroundColor: catBg.gradient[0] }]}
      >
        <GlowPill onPress={() => router.back()} pillStyle={styles.stickyBackPill} />
        <Text style={styles.stickyTitle} numberOfLines={1}>{session.title}</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      {/* ── Sticky "Escuchar ahora" ──────────────────────────────────────── */}
      <View style={[styles.stickyPlay, { paddingBottom: bottomPad + 10 }]}>
        <LinearGradient colors={["transparent", catBg.solid]} style={StyleSheet.absoluteFill} />
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

  // Category pill
  categoryPill: {
    flexDirection: "row",
    alignSelf: "center",
    height: 35,
    borderRadius: 17.5,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
    marginTop: 31,
    marginBottom: 10,
  },
  categoryPillText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4A0C0C",
    letterSpacing: 0.8,
  },
  categoryPillSep: {
    fontSize: 20,
    color: "#4A0C0C",
    opacity: 0.5,
  },
  durationText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#4A0C0C",
  },

  // Title
  title: {
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 33,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 7,
  },

  // Description
  description: {
    fontSize: 15,
    lineHeight: 25,
    marginTop: 5,
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
    marginTop: 19,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Author section
  authorSection: { marginTop: 20, marginBottom: 28 },
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
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 14,
  },

  // Related vertical list
  relatedBlock: { marginBottom: 20 },
  relatedList: { gap: 18, marginTop: 15 },
  relatedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  relatedCardImg: {
    width: 127,
    height: 89,
    borderRadius: 10,
  },
  relatedCardBody: {
    flex: 1,
    paddingVertical: 12,
    gap: 4,
  },
  relatedCardTitle: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  relatedAuthorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  relatedAuthorAvatar: { width: 18, height: 18, borderRadius: 9 },
  relatedCardSub: { fontSize: 12 },

  // Sticky header
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 12,
    zIndex: 10,
  },
  heroBackPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    width: 42,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "#4A0C0C",
  },
  stickyBackPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    width: 42,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "transparent",
  },
  stickyTitle: {
    flex: 1,
    fontSize: 21,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

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
