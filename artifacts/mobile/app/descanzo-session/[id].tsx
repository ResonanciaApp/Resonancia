import { Feather, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Path } from "react-native-svg";
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
import { useGetSessionPlayCount, getGetSessionPlayCountQueryKey } from "@workspace/api-client-react";
import { getSessionById, SESSIONS } from "@/data/sessions";
import { getGuide } from "@/data/guides";
import { useColors } from "@/hooks/useColors";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";

const { width } = Dimensions.get("window");
const HEADER_H = 298;

function GlowPill({ onPress, pillStyle, gradientColors }: { onPress: () => void; pillStyle: object; gradientColors?: [string, string] }) {
  const scale  = useRef(new Animated.Value(1)).current;
  const bright = useRef(new Animated.Value(0)).current;

  function handlePressIn() {
    Animated.parallel([
      Animated.timing(scale,  { toValue: 0.97, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bright, { toValue: 1,    duration: 160, easing: Easing.out(Easing.quad),       useNativeDriver: true }),
    ]).start();
  }

  function handlePressOut() {
    Animated.parallel([
      Animated.timing(scale,  { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bright, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();
    onPress();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} style={[pillStyle, { overflow: "hidden" }]}>
        {gradientColors ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
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


function GradPillLabel({ icon, label, active }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; active?: boolean }) {
  const iconColor = active ? "#dad4ec" : "rgba(255,255,255,0.9)";
  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Feather name={icon} size={23} color={iconColor} />
      <Text style={{ fontSize: 14, fontWeight: "600", letterSpacing: 0.2, color: iconColor }}>{label}</Text>
    </View>
  );
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playSession, isFavorite, toggleFavorite, currentSession, isPlaying, getSessionProgress, clearSessionProgress } = usePlayer();

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

  // Esta pantalla cubre: Ancestrales (Sesiones), Meditaciones.
  // Las sesiones de Música tendrán su propia pantalla de detalle.
  const isGuiada = session.categoryId === "meditaciones-guiadas";
  const isAncestral = session.categoryId === "sonidos-ancestrales";
  const isMusica = session.categoryId === "musica-sonidos";
  const CATEGORY_BG: Record<string, {
    gradient: [string, string]; solid: string;
    pillBg: string; labelGradient: [string, string]; labelColor: string;
  }> = {
    "sonidos-ancestrales":  { gradient: ["#2E0510", "#16040A"], solid: "#16040A", pillBg: "#4A0C0C", labelGradient: ["#FFF8EE", "#FFEEDD"], labelColor: "#7A1020" },
    "meditaciones-guiadas": { gradient: ["#2E0510", "#16040A"], solid: "#16040A", pillBg: "#4A0C0C", labelGradient: ["#FFF8EE", "#FFEEDD"], labelColor: "#7A1020" },
    "musica-sonidos":       { gradient: ["#2E0510", "#16040A"], solid: "#16040A", pillBg: "#4A0C0C", labelGradient: ["#FFF8EE", "#FFEEDD"], labelColor: "#7A1020" },
    "descanso":             { gradient: ["#14060C", "#14060C"], solid: "#14060C", pillBg: "#3D0E16", labelGradient: ["#FFF8EE", "#FFEEDD"], labelColor: "#7A1020" },
  };
  const catBg = CATEGORY_BG[session.categoryId] ?? CATEGORY_BG["sonidos-ancestrales"];
  const categoryPill = isAncestral ? "Sesión" : isGuiada ? "Meditación"
    : isMusica ? "Música" : null;
  const categoryIcon: string = "clock";
  const subTag = isAncestral
    ? (session.ancestralTag ?? session.categoryLabel)
    : isGuiada
    ? (session.meditationTag ?? session.categoryLabel)
    : isMusica
    ? (session.soundTag ?? session.categoryLabel)
    : session.categoryLabel;
  const SUBTAG_ICON: Record<string, string> = {
    // Ancestrales
    "Cuencos Tibetanos": "disc", "Cuencos de Cuarzo": "disc", "Mix de Cuencos": "disc", "Cuencos y Gongs": "disc",
    "Gongs": "circle", "Gongs y Campanas": "circle",
    "Campanas": "bell", "Campanas Tingsha": "bell",
    // Meditaciones
    "No Duales": "layers", "Visualizaciones": "eye", "Mantras": "mic",
    "Escaneo Corporal": "activity", "Manifestación": "star", "3 Minutos de Sabiduría": "clock",
    // Música
    "Música Ambient": "cloud", "Música Enteógena": "feather", "Música Tribal": "zap", "Música Étnica": "globe",
    "Sabiduría": "book-open", "ASMR": "headphones", "Historias": "book",
  };
  const subTagIcon: string = SUBTAG_ICON[subTag ?? ""] ?? (isAncestral ? "disc" : isGuiada ? "eye" : isMusica ? "cloud" : "book-open");
  const savedCount = 40 + ((parseInt(session.id, 10) * 17 + 83) % 260);
  const [localFav, setLocalFav] = useState<boolean | null>(null);
  const [downloadPressed, setDownloadPressed] = useState(false);
  const [sharePressed, setSharePressed] = useState(false);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);

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

  const savedProgress = getSessionProgress(session.id);
  const hasProgress = savedProgress > 0.005;

  const { data: playsData } = useGetSessionPlayCount(session.id, {
    query: { queryKey: getGetSessionPlayCountQueryKey(session.id), staleTime: 60_000 },
  });

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSession(session);
    router.push("/player" as never);
  };

  const handlePlayFromStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearSessionProgress(session.id);
    playSession(session);
    router.push("/player" as never);
  };

  const handleContinue = () => {
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
      <StatusBar hidden />

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* ── Hero image ──────────────────────────────────────────────────── */}
        <View style={[styles.hero, { height: HEADER_H }]}>
          <Image source={session.image} style={StyleSheet.absoluteFill as object} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
          <View style={[styles.navBar, { paddingTop: topPad + 8 }]}>
            <GlowPill onPress={() => router.back()} pillStyle={styles.heroBackPill} gradientColors={catBg.gradient as [string, string]} />
          </View>
        </View>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <View style={styles.content}>

          {/* Category pill */}
          {categoryPill && (
            <LinearGradient
              colors={["#f8f3eb", "#e8d2c0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.categoryPill}
            >
              <Feather name={categoryIcon as never} size={17} color="#16040A" />
              <Text style={[styles.categoryPillText, { color: "#16040A" }]}>{categoryPill}</Text>
              <Text style={[styles.categoryPillSep, { color: "#16040A" }]}>·</Text>
              <Text style={[styles.durationText, { color: "#16040A" }]}>{session.durationLabel.replace(" min", "m")}</Text>
            </LinearGradient>
          )}

          {/* Guardados */}
          <View style={styles.savedCountRow}>
            <MaskedView maskElement={<Feather name="heart" size={12} color="#000" />}>
              <LinearGradient colors={["#C4A8F5","#A088D8"]} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={{ width: 12, height: 12 }} />
            </MaskedView>
            <Text style={styles.savedCountText}>{savedCount} guardados</Text>
          </View>

          {/* Title + acciones */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={3}>{session.title}</Text>
            <View style={styles.titleActions}>
              <Pressable onPress={handleFav} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Feather name="heart" size={22} color={fav ? "#C4A8F5" : "#F4F4F4"} />
              </Pressable>
              <Pressable onPress={() => setActionsSheetOpen(true)} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Feather name="more-vertical" size={22} color="#F4F4F4" />
              </Pressable>
            </View>
          </View>

          {/* Author name */}
          {authors[0] && (
            <Text style={styles.authorNameInline} numberOfLines={1}>
              Por {authors[0].name}
            </Text>
          )}

          {/* ── Botón Escuchar / Split Reiniciar+Continuar ───────────── */}
          {hasProgress ? (
            <View style={[styles.splitBtnRow, { marginBottom: 16 }]}>
              {/* Reiniciar */}
              <Pressable
                onPress={handlePlayFromStart}
                style={({ pressed }) => [styles.splitBtn, { opacity: pressed ? 0.85 : 1 }]}
              >
                <LinearGradient
                  colors={["#C4A8F5", "#A088D8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Feather name="rotate-ccw" size={16} color={colors.primaryForeground} />
                <Text style={[styles.playBtnText, { color: colors.primaryForeground }]}>Reiniciar</Text>
              </Pressable>

              <View style={styles.splitDivider} />

              {/* Continuar */}
              <Pressable
                onPress={handleContinue}
                style={({ pressed }) => [styles.splitBtn, { opacity: pressed ? 0.85 : 1 }]}
              >
                <LinearGradient
                  colors={["#C4A8F5", "#A088D8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Svg width={16} height={16} viewBox="0 0 48 48">
                  <Path
                    d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                    fill={colors.primaryForeground}
                  />
                </Svg>
                <Text style={[styles.playBtnText, { color: colors.primaryForeground }]}>Continuar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePlay}
              style={({ pressed }) => [
                styles.playBtn,
                { overflow: "hidden", opacity: pressed ? 0.88 : 1, marginBottom: 16 },
              ]}
            >
              <LinearGradient
                colors={["#884D80", "#884D80"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Svg width={18} height={18} viewBox="0 0 48 48">
                  <Path
                    d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                    fill="#0d0c26"
                  />
                </Svg>
                <Text style={[styles.playBtnText, { color: "#0d0c26" }]}>
                  {isCurrentlyPlaying ? "Reproduciendo" : "Escuchar ahora"}
                </Text>
              </View>
            </Pressable>
          )}

          {/* ── Botón Compartir ─────────────────────────────────────────── */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.shareBtnText}>Compartir</Text>
              <Feather name="send" size={15} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Description */}
          <Text style={[styles.description, { color: colors.softSand ?? "#FFFFFF" }]} numberOfLines={3}>
            {session.description}
          </Text>

          {/* ── Reproducciones ──────────────────────────────────────────── */}
          {playsData !== undefined && (
            <Text style={styles.playsInline}>
              {playsData.plays === 0
                ? "Sé el primero en escuchar esta sesión"
                : `${playsData.plays.toLocaleString("es")} ${playsData.plays === 1 ? "reproducción" : "reproducciones"}`}
            </Text>
          )}

          {/* ── Banner Mezclador ────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [styles.mixerBannerWrap, pressed && { opacity: 0.82 }]}
            onPress={() => router.push("/escenas-mixer" as never)}
          >
            <LinearGradient
              style={styles.mixerBanner}
              colors={["#2A2070", "#C47A6A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.mixerBannerIcon}>
                <Ionicons name="moon" size={22} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mixerBannerTitle}>Mezclador para dormir</Text>
                <Text style={styles.mixerBannerSub}>Crea tu propia mezcla de sonidos</Text>
              </View>
              <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </Pressable>

        </View>
      </Animated.ScrollView>

      {/* ── Sticky header (aparece al scrollear) ─────────────────────────── */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.stickyHeader, { paddingTop: topPad, opacity: stickyOpacity, backgroundColor: catBg.gradient[0] }]}
      >
        <GlowPill onPress={() => router.back()} pillStyle={styles.stickyBackPill} gradientColors={catBg.gradient as [string, string]} />
        <Text style={styles.stickyTitle} numberOfLines={1}>{session.title}</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      <SessionActionsSheet
        session={session}
        visible={actionsSheetOpen}
        onClose={() => setActionsSheetOpen(false)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  // Hero
  hero: { width: "100%", overflow: "hidden", borderBottomWidth: 5, borderBottomColor: "#C4A8F5" },
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
  badgeText: { fontFamily: "Manrope", fontSize: 9, letterSpacing: 1.5, fontWeight: "700" },

  // Category pill
  categoryPill: {
    flexDirection: "row",
    alignSelf: "center",
    height: 33,
    borderRadius: 16.5,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
    marginTop: 31,
    marginBottom: 10,
  },
  categoryPillText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "#4A0C0C",
    letterSpacing: 0.8,
  },
  categoryPillSep: {
    fontFamily: "Manrope",
    fontSize: 20,
    color: "#4A0C0C",
    opacity: 0.5,
  },
  durationText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "400",
    color: "#4A0C0C",
  },

  // Meta row
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 2,
    marginBottom: 10,
  },
  metaText: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "#F4F4F4",
    fontWeight: "500",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 3,
  },

  savedCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 26,
    marginBottom: 4,
  },
  savedCountText: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "#FFFFFF",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  authorNameInline: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginTop: -9,
    marginBottom: 16,
  },

  // Title
  title: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    textAlign: "left",
    marginTop: 0,
    marginBottom: 6,
  },

  // Description
  description: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 25,
    marginTop: 0,
    marginBottom: 24,
    textAlign: "left",
  },

  // Theme tag chips
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipText: { fontFamily: "Manrope", fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },

  // Action row
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 11,
    marginBottom: 28,
  },
  actionCardWrap: { flex: 1 },
  actionCardBorder: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
  },
  actionCardInner: {
    borderRadius: 13,
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionLabel: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Author section
  authorSection: { marginTop: 15, marginBottom: 28 },
  authorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  authorCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.18)",
    padding: 16,
    marginBottom: 10,
  },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  authorAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.30)",
  },
  authorMeta: { flex: 1, gap: 5 },
  authorName: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  authorCountry: { fontFamily: "Manrope", fontSize: 13 },
  authorBio: { fontFamily: "Manrope", fontSize: 13, lineHeight: 19, maxWidth: 190 },
  authorLink: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },
  allContentsBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
    shadowColor: "#dad4ec",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  allContentsBtnText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    color: "#dad4ec",
  },

  blockTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
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
  relatedCardTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700", lineHeight: 19 },
  relatedAuthorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  relatedAuthorAvatar: { width: 18, height: 18, borderRadius: 9 },
  relatedCardSub: { fontFamily: "Manrope", fontSize: 12 },

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
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 21,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  playBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: "#dad4ec",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  playBtnText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  shareBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#dad4ec",
    marginBottom: 14,
  },
  shareBtnText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    color: "#dad4ec",
    letterSpacing: 0.5,
  },
  playsInline: {
    fontFamily: "Manrope",
    textAlign: "center",
    fontSize: 13,
    color: "#F4F4F4",
    marginBottom: 28,
  },
  mixerBannerWrap: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
  },
  mixerBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
  },
  mixerBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  mixerBannerTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 3,
  },
  mixerBannerSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  splitBtnRow: {
    flexDirection: "row",
    marginTop: 16,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#dad4ec",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  splitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 8,
    overflow: "hidden",
  },
  splitDivider: {
    width: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 2,
  },
  playsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: -6,
    marginBottom: 4,
  },
  playsText: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
  },
});
