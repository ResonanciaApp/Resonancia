import { Feather, FontAwesome } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
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
  Linking,
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
import { useSceneTheme } from "@/context/SceneThemeContext";
import { hexToRgba } from "@/utils/color";
import { AddToPlaylistSheet } from "@/components/AddToPlaylistSheet";
import { AddToFolderSheet } from "@/components/AddToFolderSheet";
import { BackPill } from "@/components/BackPill";
import { GhostPill } from "@/components/GhostPill";

const { width } = Dimensions.get("window");
const HEADER_H = 343;

function GlowPill({ onPress, pillStyle, bgColor }: { onPress: () => void; pillStyle: object; bgColor?: string }) {
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
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[pillStyle, { overflow: "hidden", backgroundColor: bgColor ?? "rgba(0,0,0,0.14)" }]}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: 19,
            backgroundColor: "rgba(255,255,255,0.28)",
            opacity: bright,
          }}
        />
        <Feather name="chevron-left" size={22} color="#FFF" />
      </Pressable>
    </Animated.View>
  );
}



export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playSession, isFavorite, toggleFavorite, currentSession, isPlaying, progress, getSessionProgress, clearSessionProgress } = usePlayer();
  const { theme: sceneTheme } = useSceneTheme();

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
  // Fondo ligado a la Escena activa (universo/naturaleza/bosque/lluvia/viento).
  const catBg = { gradient: sceneTheme.gradient, solid: sceneTheme.solid };
  const stickyHeaderColor = sceneTheme.gradient[0];
  const [localFav, setLocalFav] = useState<boolean | null>(null);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [showPlaylistSheet, setShowPlaylistSheet] = useState(false);
  const [showFolderSheet, setShowFolderSheet] = useState(false);

  // ── Rating modal ────────────────────────────────────────────────────────────
  const RATINGS_KEY = "@resonance_ratings";
  const [ratingModal, setRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingReview, setRatingReview] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const finishTriggeredRef = useRef(false);
  const storyCardRef = useRef<View>(null);

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

  const handleInstagramShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureRef(storyCardRef, { format: "png", quality: 1 });

      // Guardar en galería siempre
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        await MediaLibrary.saveToLibraryAsync(uri);
      }

      // Intentar abrir Instagram Stories directamente; si falla → share sheet
      try {
        await Linking.openURL("instagram-stories://share");
      } catch {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: "Compartir sesión",
            UTI: "public.png",
          });
        }
      }
    } catch {
      // captureRef u otro error inesperado
    }
  };

  const handleFav = () => {
    const next = !fav;
    setLocalFav(next);
    toggleFavorite(session.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ── Autores de la sesión ─────────────────────────────────────────────────────
  // guideIds (array) tiene prioridad; sino guideId; sino Casa del Cuenco
  const resolvedIds: string[] = session.guideIds?.length
    ? session.guideIds
    : isGuiada && session.guideId
    ? [session.guideId]
    : [];
  const authors = resolvedIds.length
    ? resolvedIds.map((gid) => getGuide(gid)).map((g) => ({
        name: g.name, firstName: g.name.split(" ")[0],
        photo: g.photo, country: g.country, city: g.city,
        bio: g.bio, profilePath: `/guiador/${g.id}`,
      }))
    : [getGuide(undefined)].map((g) => ({
        name: g.name, firstName: g.name.split(" ")[0],
        photo: g.photo, country: g.country, city: g.city,
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
            <GhostPill noBorder style={{ backgroundColor: hexToRgba(sceneTheme.gradient[1], 0.7) }}>
              <BackPill onPress={() => router.back()} />
            </GhostPill>
            <Pressable onPress={handleInstagramShare} hitSlop={10} style={({ pressed }) => [styles.igBtn, { opacity: pressed ? 0.6 : 1 }]}>
              <FontAwesome name="instagram" size={20} color="#e8e8e8" />
            </Pressable>
          </View>
        </View>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <View style={styles.content}>

          {/* Duration label + rating */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 34 }}>
            {ratingStars > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#e8e8e8" }}>
                  {ratingStars.toFixed(1)}
                </Text>
                <Text style={{ fontSize: 9, color: "#e8e8e8", lineHeight: 14 }}>★</Text>
              </View>
            )}
            <Text style={[styles.durationLabel, { marginTop: 0 }]}>{session.durationLabel}</Text>
          </View>

          {/* Title + acciones */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground, flex: 1 }]} numberOfLines={3}>{session.title}</Text>
            <View style={styles.titleActions}>
              <Pressable onPress={() => setActionsSheetOpen(true)} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Feather name="more-horizontal" size={22} color="#e8e8e8" />
              </Pressable>
              <Pressable onPress={handleFav} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Feather name="heart" size={22} color={fav ? "#BE8744" : "#e8e8e8"} />
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
                  colors={["#D6A45C", "#BE8744"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
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
                  colors={["#D6A45C", "#BE8744"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
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
                { overflow: "hidden", opacity: pressed ? 0.88 : 1, marginTop: 24, marginBottom: 26 },
              ]}
            >
              <LinearGradient
                colors={["#D6A45C", "#BE8744"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
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
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, marginTop: -11, marginBottom: 14 })}
          >
            <View style={styles.shareBtnInner}>
              <Text style={styles.shareBtnText}>Compartir</Text>
              <Feather name="send" size={15} color="#D6A45C" />
            </View>
          </Pressable>

          {/* ── Reproducciones ──────────────────────────────────────────── */}
          {playsData !== undefined && (
            <View style={styles.playsRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="headphones" size={13} color="#f4f4f4" style={{ marginTop: -2 }} />
                <Text style={[styles.playsText, { color: "#f4f4f4" }]}>
                  {playsData.plays === 0
                    ? "Sé el primero en escuchar esta sesión"
                    : `${playsData.plays.toLocaleString("es")} ${playsData.plays === 1 ? "reproducción" : "reproducciones"}${session.createdAt ? ` desde ${new Date(session.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}` : ""}`}
                </Text>
              </View>
            </View>
          )}

          {/* Description */}
          <Text style={[styles.description, { color: colors.softSand ?? "#FFFFFF" }]}>
            {session.description}
          </Text>

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
        style={[styles.stickyHeader, { paddingTop: topPad, opacity: stickyOpacity, backgroundColor: stickyHeaderColor }]}
      >
        <GhostPill noBorder style={{ backgroundColor: hexToRgba(sceneTheme.gradient[1], 0.4) }}>
          <BackPill onPress={() => router.back()} />
        </GhostPill>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.stickyTitle} numberOfLines={1}>{session.title}</Text>
          <Text style={styles.stickySubtitle} numberOfLines={1}>
            {[authors[0]?.name, session.durationLabel].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </Animated.View>

      {/* ── Options Sheet (···) ─────────────────────────────────────────── */}
      <Modal
        visible={actionsSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setActionsSheetOpen(false)}
        statusBarTranslucent
      >
        <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setActionsSheetOpen(false)}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.65)" }]} />
          </Pressable>
          <View style={[styles.optSheet, { paddingBottom: bottomPad + 8 }]}>
            <LinearGradient colors={sceneTheme.gradient} style={StyleSheet.absoluteFill} />
            <View style={styles.optHandle} />
            <View style={styles.optHeader}>
              <Image
                source={session.image as never}
                style={styles.optThumb}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
              />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.optSessionTitle} numberOfLines={2}>{session.title}</Text>
                <Text style={styles.optSessionAuthor}>{authors[0]?.name}</Text>
              </View>
            </View>
            <View style={styles.optDivider} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {/* Temporizador */}
              <Pressable style={styles.optRow} onPress={() => setActionsSheetOpen(false)}>
                <Feather name="clock" size={18} color="#e8e8e8" style={styles.optIcon} />
                <Text style={styles.optRowText}>Temporizador</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>
              {/* Descargar */}
              <Pressable style={styles.optRow}>
                <Feather name="download" size={18} color="#e8e8e8" style={styles.optIcon} />
                <Text style={styles.optRowText}>Descargar</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>
              {/* Agregar a favoritos */}
              <Pressable style={styles.optRow} onPress={() => { handleFav(); }}>
                <Feather name="heart" size={18} color={fav ? "#BE8744" : "#e8e8e8"} style={styles.optIcon} />
                <Text style={[styles.optRowText, fav ? { color: "#BE8744" } : {}]}>
                  {fav ? "En favoritos" : "Agregar a favoritos"}
                </Text>
                {fav && <Feather name="check" size={15} color="#BE8744" />}
              </Pressable>
              {/* Añadir a carpeta */}
              <Pressable
                style={styles.optRow}
                onPress={() => { setActionsSheetOpen(false); setTimeout(() => setShowFolderSheet(true), 300); }}
              >
                <Feather name="folder-plus" size={18} color="#e8e8e8" style={styles.optIcon} />
                <Text style={styles.optRowText}>Añadir a carpeta</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>
              {/* Añadir a playlist */}
              <Pressable
                style={styles.optRow}
                onPress={() => { setActionsSheetOpen(false); setTimeout(() => setShowPlaylistSheet(true), 300); }}
              >
                <Feather name="list" size={18} color="#e8e8e8" style={styles.optIcon} />
                <Text style={styles.optRowText}>Añadir a playlist</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>
              {/* Seguir al guía (si aplica) */}
              {authors[0]?.profilePath && (
                <Pressable
                  style={styles.optRow}
                  onPress={() => { setActionsSheetOpen(false); router.push(authors[0].profilePath as never); }}
                >
                  <Feather name="user-plus" size={18} color="#e8e8e8" style={styles.optIcon} />
                  <Text style={styles.optRowText}>Ver perfil del guía</Text>
                  <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
                </Pressable>
              )}
              <View style={[styles.optDivider, { marginTop: 8 }]} />
              {/* Informar un problema */}
              <Pressable style={styles.optRow}>
                <Feather name="alert-circle" size={18} color="rgba(255,255,255,0.5)" style={styles.optIcon} />
                <Text style={[styles.optRowText, { color: "rgba(255,255,255,0.5)" }]}>Informar un problema</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.25)" />
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <AddToPlaylistSheet visible={showPlaylistSheet} sessionId={session.id} onClose={() => setShowPlaylistSheet(false)} />
      <AddToFolderSheet visible={showFolderSheet} sessionId={session.id} onClose={() => setShowFolderSheet(false)} />

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

      {/* ── Story card invisible (opacity 0) para Instagram Stories ────────── */}
      <View
        ref={storyCardRef}
        style={{ position: "absolute", left: 0, top: 0, width: 390, height: 693, overflow: "hidden", backgroundColor: "#1B060F", opacity: 0 }}
        pointerEvents="none"
      >
        <Image source={session.image} style={StyleSheet.absoluteFill as object} contentFit="cover" />
        <LinearGradient
          colors={["rgba(27,6,15,0.25)", "rgba(27,6,15,0.55)", "rgba(27,6,15,0.95)"]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Branding top */}
        <View style={{ position: "absolute", top: 64, left: 0, right: 0, alignItems: "center" }}>
          <Text style={{ color: "#BE8744", fontSize: 11, letterSpacing: 5, fontWeight: "700" }}>RESONANCIA</Text>
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: 2, marginTop: 3 }}>Casa del Cuenco</Text>
        </View>
        {/* Session info center */}
        <View style={{ position: "absolute", bottom: 190, left: 36, right: 36 }}>
          <Text style={{ color: "#BE8744", fontSize: 11, letterSpacing: 2, textAlign: "center", marginBottom: 12, textTransform: "uppercase" }}>
            {session.categoryLabel}
          </Text>
          <Text style={{ color: "#FAF0EE", fontSize: 26, fontWeight: "700", lineHeight: 34, textAlign: "center" }}>
            {session.title}
          </Text>
          <Text style={{ color: "rgba(212,175,55,0.7)", fontSize: 12, textAlign: "center", marginTop: 10, letterSpacing: 1 }}>
            {session.durationLabel}
          </Text>
        </View>
        {/* CTA bottom */}
        <View style={{ position: "absolute", bottom: 80, left: 0, right: 0, alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, letterSpacing: 1.5 }}>Escucha en RESONANCIA</Text>
        </View>
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
  durationLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#e8e8e8",
    marginTop: 29,
  },
  authorNameInline: {
    fontSize: 12,
    fontWeight: "500",
    color: "#e8e8e8",
    marginTop: 3,
    marginBottom: 16,
  },
  authorNameLink: {
    textDecorationLine: "underline",
    textDecorationColor: "#e8e8e8",
  },

  // Title
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 7,
  },
  titleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  title: {
    fontSize: 23,
    fontWeight: "400",
    lineHeight: 30,
    letterSpacing: -0.3,
    textAlign: "left",
  },

  // Description
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 30,
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
    marginBottom: 16,
  },
  authorBigPhoto: {
    width: "100%",
    height: 210,
    borderRadius: 14,
    marginTop: 7,
    marginBottom: 14,
  },
  authorName: { fontSize: 22, fontWeight: "800", marginTop: 15, marginBottom: 4 },
  authorCountry: { fontSize: 14, color: "#e8e8e8", marginTop: 6, marginBottom: 8 },
  authorBio: { fontSize: 14, lineHeight: 21, color: "#e8e8e8", marginTop: 6 },
  authorLink: { fontSize: 13, fontWeight: "600" },
  allContentsBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
    shadowColor: "#BE8744",
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
  pillBorder: {
    borderRadius: 19,
  },
  heroBackPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    width: 42,
    borderRadius: 19,
  },
  igBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyBackPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    width: 42,
    borderRadius: 19,
    backgroundColor: "transparent",
  },
  stickyTitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#e8e8e8",
    textAlign: "center",
  },
  stickySubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 1,
  },

  playBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: "#BE8744",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  playBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  shareBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10.5,
    borderRadius: 30,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#D6A45C",
    paddingHorizontal: 24,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D6AD5F",
    letterSpacing: 0.5,
  },
  splitBtnRow: {
    flexDirection: "row",
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#BE8744",
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
    paddingVertical: 9,
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
    marginTop: 27,
    marginBottom: -26,
  },
  playsText: {
    fontSize: 12,
    color: "#BE8744",
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
    color: "#e8e8e8",
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
    color: "#e8e8e8",
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

  // Options sheet
  optSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    paddingTop: 10,
    maxHeight: "85%",
  },
  optHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "center",
    marginBottom: 18,
  },
  optHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  optThumb: {
    width: 73,
    height: 73,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  optSessionTitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#e8e8e8",
    lineHeight: 20,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  optSessionAuthor: {
    fontSize: 12,
    fontWeight: "300",
    color: "rgba(255,255,255,0.60)",
  },
  optDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 20,
    marginBottom: 4,
  },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  optIcon: {
    marginRight: 16,
    width: 22,
    textAlign: "center",
  },
  optRowText: {
    fontSize: 16,
    color: "#e8e8e8",
    flex: 1,
  },
});
