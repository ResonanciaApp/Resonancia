import { Feather } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/PlayerContext";
import { useGetSessionPlayCount, getGetSessionPlayCountQueryKey } from "@workspace/api-client-react";
import { getSessionById, SESSIONS } from "@/data/sessions";
import { getGuide } from "@/data/guides";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const HEADER_H = 298;

function GlowPill({ onPress, pillStyle, gradientColors }: { onPress: () => void; pillStyle: object; gradientColors?: [string, string] }) {
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



export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playSession, isFavorite, toggleFavorite, currentSession, isPlaying, progress, getSessionProgress, clearSessionProgress } = usePlayer();

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
  const isMusica = session.categoryId === "musica-sonidos";
  const CATEGORY_BG: Record<string, {
    gradient: [string, string]; solid: string;
    pillBg: string; labelGradient: [string, string]; labelColor: string;
  }> = {
    "sonidos-ancestrales":  { gradient: ["#2E0510", "#160108"], solid: "#160108", pillBg: "#4A0C0C", labelGradient: ["#FFF8EE", "#FFEEDD"], labelColor: "#7A1020" },
    "meditaciones-guiadas": { gradient: ["#2E0510", "#160108"], solid: "#160108", pillBg: "#4A0C0C", labelGradient: ["#FFF8EE", "#FFEEDD"], labelColor: "#7A1020" },
    "reflexiones":          { gradient: ["#2E0510", "#160108"], solid: "#160108", pillBg: "#4A0C0C", labelGradient: ["#FFF8EE", "#FFEEDD"], labelColor: "#7A1020" },
    "musica-sonidos":       { gradient: ["#2E0510", "#160108"], solid: "#160108", pillBg: "#4A0C0C", labelGradient: ["#FFF8EE", "#FFEEDD"], labelColor: "#7A1020" },
    "descanso":             { gradient: ["#252525", "#1C1C1C"], solid: "#1C1C1C", pillBg: "#2A2A2A", labelGradient: ["#E8E8E8", "#C8C8C8"], labelColor: "#333333" },
  };
  const catBg = CATEGORY_BG[session.categoryId] ?? CATEGORY_BG["sonidos-ancestrales"];
  const [localFav, setLocalFav] = useState<boolean | null>(null);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);

  // ── Rating modal ────────────────────────────────────────────────────────────
  const RATINGS_KEY = "@resonance_ratings";
  const [ratingModal, setRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const finishTriggeredRef = useRef(false);

  // Carga rating previo al entrar
  useEffect(() => {
    AsyncStorage.getItem(RATINGS_KEY).then((val) => {
      if (!val) return;
      const map: Record<string, number> = JSON.parse(val);
      if (map[session.id]) {
        setRatingStars(map[session.id]);
        setRatingSubmitted(true);
      }
    });
  }, [session.id]);

  // Detecta fin de sesión
  useEffect(() => {
    if (
      progress >= 1 &&
      !isPlaying &&
      currentSession?.id === session.id &&
      !ratingSubmitted &&
      !finishTriggeredRef.current
    ) {
      finishTriggeredRef.current = true;
      setTimeout(() => setRatingModal(true), 800);
    }
    // Resetea el trigger si cambia la sesión o baja el progreso
    if (progress < 0.99) finishTriggeredRef.current = false;
  }, [progress, isPlaying, currentSession?.id, session.id, ratingSubmitted]);

  const handleRate = useCallback(async (stars: number) => {
    setRatingStars(stars);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSubmitRating = useCallback(async () => {
    if (ratingStars === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const val = await AsyncStorage.getItem(RATINGS_KEY);
    const map: Record<string, number> = val ? JSON.parse(val) : {};
    map[session.id] = ratingStars;
    await AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(map));
    setRatingSubmitted(true);
    setRatingModal(false);
  }, [ratingStars, session.id]);

  const handleDismissRating = useCallback(() => {
    setRatingModal(false);
  }, []);

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
          <LinearGradient
            colors={["#D6AD5F", "#B47344"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4 }}
          />
        </View>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <View style={styles.content}>

          {/* Duration label + rating */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 29 }}>
            {ratingStars > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>
                  {ratingStars.toFixed(1)}
                </Text>
                <Text style={{ fontSize: 9, color: "#FFFFFF", lineHeight: 14 }}>★</Text>
              </View>
            )}
            <Text style={[styles.durationLabel, { marginTop: 0 }]}>{session.durationLabel}</Text>
          </View>

          {/* Title + acciones */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground, flex: 1 }]} numberOfLines={3}>{session.title}</Text>
            <View style={styles.titleActions}>
              <Pressable onPress={() => setActionsSheetOpen(true)} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Feather name="more-horizontal" size={22} color="#FFFFFF" />
              </Pressable>
              <Pressable onPress={handleFav} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Feather name="heart" size={22} color={fav ? "#D4AF37" : "#FFFFFF"} />
              </Pressable>
            </View>
          </View>

          {/* Author name */}
          {authors[0] && (
            <Pressable
              onPress={() => router.push(authors[0].profilePath as never)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text style={styles.authorNameInline}>
                {"Por "}
                <Text style={styles.authorNameLink}>{authors[0].name}</Text>
              </Text>
            </Pressable>
          )}

          {/* ── Botón Escuchar / Split Reiniciar+Continuar ───────────── */}
          {hasProgress ? (
            <View style={[styles.splitBtnRow, { marginTop: 18, marginBottom: 26 }]}>
              {/* Reiniciar */}
              <Pressable
                onPress={handlePlayFromStart}
                style={({ pressed }) => [styles.splitBtn, { opacity: pressed ? 0.85 : 1 }]}
              >
                <LinearGradient
                  colors={["#D6AD5F", "#B47344"]}
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
                  colors={["#D6AD5F", "#B47344"]}
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
                { overflow: "hidden", opacity: pressed ? 0.88 : 1, marginTop: 18, marginBottom: 26 },
              ]}
            >
              <LinearGradient
                colors={["#D6AD5F", "#B47344"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Svg width={18} height={18} viewBox="0 0 48 48">
                  <Path
                    d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                    fill={colors.primaryForeground}
                  />
                </Svg>
                <Text style={[styles.playBtnText, { color: colors.primaryForeground }]}>
                  {isCurrentlyPlaying ? "Reproduciendo" : "Escuchar ahora"}
                </Text>
              </View>
            </Pressable>
          )}

          {/* ── Botón Compartir ──────────────────────────────────────────── */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.shareBtnText}>Compartir</Text>
              <Feather name="send" size={15} color="#e8d2c0" />
            </View>
          </Pressable>

          {/* Description */}
          <Text style={[styles.description, { color: colors.softSand ?? "#FFFFFF" }]}>
            {session.description}
          </Text>

          {/* ── Reproducciones ──────────────────────────────────────────── */}
          {playsData !== undefined && (
            <View style={styles.playsRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MaskedView style={{ marginTop: -3 }} maskElement={<Feather name="headphones" size={13} color="#000" />}>
                  <LinearGradient colors={["#D6AD5F","#B47344"]} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={{ width: 13, height: 13 }} />
                </MaskedView>
                <MaskedView
                  maskElement={
                    <Text style={styles.playsText}>
                      {playsData.plays === 0
                        ? "Sé el primero en escuchar esta sesión"
                        : `${playsData.plays.toLocaleString("es")} ${playsData.plays === 1 ? "reproducción" : "reproducciones"}${session.createdAt ? ` desde ${new Date(session.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}` : ""}`}
                    </Text>
                  }>
                  <LinearGradient colors={["#D6AD5F","#B47344"]} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={{ height: 18, width: 340 }} />
                </MaskedView>
              </View>
            </View>
          )}

          {/* ── Sobre la voz guía ────────────────────────────────────────── */}
          <View style={styles.authorSection}>
            {/* Header row: título + Ver perfil */}
            <View style={styles.authorHeaderRow}>
              <Text style={[styles.blockTitle, { color: colors.foreground, marginBottom: 0 }]} numberOfLines={1} ellipsizeMode="tail">
                {isAncestral
                  ? "Sobre el Sonoterapeuta"
                  : isMusica
                    ? "Sobre el músico"
                    : authors.length > 1
                      ? "Sobre las voces guía"
                      : "Sobre la voz guía"}
              </Text>
              {authors[0] && (
                <Pressable
                  onPress={() => router.push(authors[0].profilePath as never)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
                >
                  <Text style={[styles.authorLink, { color: "#FFFFFF" }]}>
                    Ver perfil{"  "}<Feather name="chevron-right" size={13} color="#FFFFFF" />
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Cards */}
            {authors.map((a) => (
              <View key={a.profilePath} style={styles.authorCard}>
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
                    <Text style={[styles.authorCountry, { color: "rgba(255,255,255,0.9)" }]}>
                      {a.flag}{"  "}{a.country}
                    </Text>
                    <Text style={[styles.authorBio, { color: "rgba(255,255,255,0.75)" }]} numberOfLines={3}>
                      {a.bio}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push(a.profilePath as never)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1, marginTop: 10, marginLeft: 86 })}
                >
                  <Text style={styles.allContentsBtnText}>Ver todos los contenidos</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* ── Más sesiones como estas ──────────────────────────────────── */}
          {related.length > 0 && (
            <View style={styles.relatedBlock}>
              <Text style={[styles.blockTitle, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
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
        <GlowPill onPress={() => router.back()} pillStyle={styles.stickyBackPill} gradientColors={catBg.gradient as [string, string]} />
        <Text style={styles.stickyTitle} numberOfLines={1}>{session.title}</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      {/* ── Modal de valoración ──────────────────────────────────────────── */}
      <Modal
        visible={ratingModal}
        transparent
        animationType="fade"
        onRequestClose={handleDismissRating}
        statusBarTranslucent
      >
        <View style={styles.ratingBackdrop}>
          <View style={styles.ratingSheet}>
            {/* Imagen de la sesión */}
            <View style={styles.ratingCoverWrap}>
              <Image
                source={session.image as never}
                style={styles.ratingCover}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
              />
              <LinearGradient
                colors={["transparent", "rgba(27,6,15,0.85)"]}
                style={StyleSheet.absoluteFill}
              />
            </View>

            {/* Foto del autor */}
            {authors[0] && (
              <View style={styles.ratingAuthorAvatar}>
                <Image
                  source={authors[0].photo as never}
                  style={{ width: 56, height: 56, borderRadius: 28 }}
                  contentFit="cover"
                  placeholder={BLUR_PLACEHOLDER}
                  transition={IMAGE_TRANSITION}
                />
              </View>
            )}

            <Text style={styles.ratingTitle}>¿Cómo estuvo?</Text>
            <Text style={styles.ratingSubtitle}>
              Recibe mejores recomendaciones y ayuda a apoyar al creador calificando la sesión.
            </Text>

            {/* Estrellas */}
            <View style={styles.ratingStarsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => handleRate(star)}
                  hitSlop={8}
                >
                  <Text style={{
                    fontSize: 38,
                    color: ratingStars >= star ? "#D6AD5F" : "rgba(255,255,255,0.25)",
                    lineHeight: 44,
                  }}>
                    {ratingStars >= star ? "★" : "☆"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Campo de reseña (aparece al seleccionar estrellas) */}
            {ratingStars > 0 && (
              <TextInput
                style={styles.ratingReviewInput}
                placeholder="Escribe tu reseña"
                placeholderTextColor="rgba(255,255,255,0.35)"
                multiline
                numberOfLines={3}
                value={ratingReview}
                onChangeText={setRatingReview}
                maxLength={280}
              />
            )}

            {/* Enviar */}
            <Pressable
              onPress={handleSubmitRating}
              style={({ pressed }) => [
                styles.ratingSubmitBtn,
                ratingStars === 0 && { opacity: 0.45 },
                pressed && { opacity: 0.75 },
              ]}
            >
              <LinearGradient
                colors={["#D6AD5F", "#B47344"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.ratingSubmitText}>Enviar</Text>
            </Pressable>

            {/* Tal vez más tarde */}
            <Pressable onPress={handleDismissRating} hitSlop={10}>
              <Text style={styles.ratingDismissText}>Tal vez más tarde</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
  durationLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
    marginTop: 29,
  },
  authorNameInline: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginTop: -4,
    marginBottom: 16,
  },
  authorNameLink: {
    textDecorationLine: "underline",
    textDecorationColor: "#FFFFFF",
  },

  // Title
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 5,
    marginBottom: 7,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    textAlign: "left",
  },

  // Description
  description: {
    fontSize: 15,
    lineHeight: 25,
    marginTop: 8,
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
  tagChipText: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },

  // Author section
  authorSection: { marginTop: 37, marginBottom: 28 },
  authorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  authorCard: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
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
  authorName: { fontSize: 17, fontWeight: "700" },
  authorCountry: { fontSize: 13 },
  authorBio: { fontSize: 13, lineHeight: 19, flex: 1 },
  authorLink: { fontSize: 13, fontWeight: "600" },
  allContentsBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  allContentsBtnText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    color: "#D6AD5F",
  },

  blockTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 14,
  },

  // Related vertical list
  relatedBlock: { marginBottom: 20, marginTop: 1 },
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

  playBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
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
  shareBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#e8d2c0",
    marginTop: -11,
    marginBottom: 14,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e8d2c0",
    letterSpacing: 0.5,
  },
  splitBtnRow: {
    flexDirection: "row",
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#D4AF37",
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
    justifyContent: "flex-start",
    gap: 6,
    marginTop: -3,
    marginBottom: 4,
  },
  playsText: {
    fontSize: 13,
    color: "#D4AF37",
  },

  // Rating modal
  ratingBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  ratingSheet: {
    backgroundColor: "#1B060F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    alignItems: "center",
    overflow: "hidden",
  },
  ratingCoverWrap: {
    width: "100%",
    height: 180,
    overflow: "hidden",
  },
  ratingCover: {
    width: "100%",
    height: "100%",
  },
  ratingAuthorAvatar: {
    marginTop: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#1B060F",
    overflow: "hidden",
    marginBottom: 8,
  },
  ratingTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
    marginBottom: 10,
    textAlign: "center",
  },
  ratingSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.60)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  ratingStarsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  ratingReviewInput: {
    width: "80%",
    minHeight: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(214,173,95,0.30)",
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  ratingSubmitBtn: {
    width: "80%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  ratingSubmitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B060F",
    letterSpacing: 0.5,
  },
  ratingDismissText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.50)",
    paddingVertical: 4,
  },
});
