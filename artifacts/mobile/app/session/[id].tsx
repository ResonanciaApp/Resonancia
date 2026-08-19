import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Path } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
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
import { useStreakCelebration } from "@/context/StreakCelebrationContext";
import { useGetSessionPlayCount, getGetSessionPlayCountQueryKey } from "@workspace/api-client-react";
import { getSessionById, SESSIONS } from "@/data/sessions";
import { usePremium } from "@/context/PremiumContext";
import { getGuide } from "@/data/guides";
import { getArtist } from "@/data/artists";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { hexToRgba } from "@/utils/color";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { SOUND_MAP } from "@/config/sound-map";
import { REMOTE_SOUND_MAP } from "@/lib/remoteSoundMap";
import { AmbientSoundPickerSheet } from "@/components/AmbientSoundPickerSheet";
import { AddToPlaylistSheet } from "@/components/AddToPlaylistSheet";
import { AddToFolderSheet } from "@/components/AddToFolderSheet";
import { BackPill } from "@/components/BackPill";
import { GhostPill } from "@/components/GhostPill";
import { SacredGlyph } from "@/components/SacredGlyph";
import { CHAKRAS, chakraMatchesTag, isChakraTag } from "@/data/chakras";

const { width } = Dimensions.get("window");
const HEADER_H = 343;

function AnimatedHeart({
  favorited,
  onToggle,
  size = 20,
}: {
  favorited: boolean;
  onToggle: () => void;
  size?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    onToggle();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.1, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 140, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={10}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {favorited ? (
          <Ionicons name="heart" size={size} color="rgba(255,255,255,0.95)" />
        ) : (
          <Ionicons name="heart-outline" size={size} color="rgba(255,255,255,0.9)" />
        )}
      </Animated.View>
    </Pressable>
  );
}

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



export default function SessionDetailScreen({ id: idProp }: { id?: string } = {}) {
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = idProp ?? idParam;
  const overlayBack = useBackOverride();
  const goBack = () => (overlayBack ? overlayBack() : router.back());
  const overlay = useCategoryOverlayOptional();
  const openSession = (sid: string) => {
    const s = getSessionById(sid);
    if (s?.skipMiniPlayer && !(s.isPremium && !isPremium)) { playSession(s); return; }
    if (s?.skipDetail) { playSession(s); router.push("/player" as never); return; }
    if (overlay) overlay.openCategory(`/session/${sid}`);
    else router.push(`/session/${sid}` as never);
  };
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playSession, isFavorite, toggleFavorite, currentSession, isPlaying, progress, getSessionProgress, clearSessionProgress } = usePlayer();
  const { isPremium } = usePremium();
  const { shouldSuppressRating } = useStreakCelebration();
  const { theme: sceneTheme } = useSceneTheme();

  const accentColor = "rgb(218,212,236)";

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const session = getSessionById(id ?? "");

  if (!session) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.mutedForeground }}>Sesión no encontrada</Text>
        <Pressable onPress={goBack} style={{ marginTop: 16 }}>
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
  // Fondo ligado a la Escena activa (naturaleza/bosque/lluvia/viento/...).
  const sessionGradient: string[] = sceneTheme.id === "tibet"
    ? ["#2D1C52", "#261F57", "#1F255A", "#1F2A62", "#283673", "#2D4082"]
    : sceneTheme.gradient;
  const catBg = { gradient: sessionGradient, solid: sceneTheme.solid };
  const stickyHeaderColor = sessionGradient[0];
  const isIndigoPlayBtn = sceneTheme.id === "indigo";
  const playBtnColors: [string, string, ...string[]] = isIndigoPlayBtn
    ? ["#5146A8", "#5146A8"]
    : ["#F9F9F9", "#F9F9F9"];
  const listenNowBtnColors: [string, string, ...string[]] = isIndigoPlayBtn
    ? ["rgba(190,163,230,0.18)", "rgba(190,163,230,0.18)"]
    : playBtnColors;
  const playBtnTextColor = isIndigoPlayBtn ? "#f9f9f9" : "#0d0c26";
  const shareBtnTextColor = "#F9F9F9";
  const shareBtnBorder = isIndigoPlayBtn ? "#F9F9F9" : "#F9F9F9";
  const [localFav, setLocalFav] = useState<boolean | null>(null);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [showPlaylistSheet, setShowPlaylistSheet] = useState(false);
  const [showFolderSheet, setShowFolderSheet] = useState(false);

  // ── Sonido ambiente (mismo picker que el reproductor) ─────────────────────
  const [showAmbientPicker, setShowAmbientPicker] = useState(false);
  const [selectedAmbientSoundId, setSelectedAmbientSoundId] = useState<string | null>(null);
  const [ambientOverlayVolume, setAmbientOverlayVolume] = useState(0.5);
  const ambientOverlayRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    if (!ambientOverlayRef.current) {
      ambientOverlayRef.current = createAudioPlayer(null);
    }
    const p = ambientOverlayRef.current;
    if (!selectedAmbientSoundId) {
      p.pause();
      return;
    }
    const file: Parameters<typeof p.replace>[0] | null =
      SOUND_MAP[selectedAmbientSoundId] ??
      (REMOTE_SOUND_MAP[selectedAmbientSoundId]
        ? { uri: REMOTE_SOUND_MAP[selectedAmbientSoundId] }
        : null);
    if (!file) {
      p.pause();
      return;
    }
    p.loop = true;
    p.volume = ambientOverlayVolume;
    p.replace(file);
    p.play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAmbientSoundId]);

  useEffect(() => {
    if (ambientOverlayRef.current) {
      ambientOverlayRef.current.volume = ambientOverlayVolume;
    }
  }, [ambientOverlayVolume]);

  useEffect(() => {
    return () => {
      try {
        ambientOverlayRef.current?.pause();
        ambientOverlayRef.current?.remove();
      } catch {}
      ambientOverlayRef.current = null;
    };
  }, []);

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
      setTimeout(() => {
        // Si el flujo de celebración de día de racha tomó la calificación,
        // este popup no debe aparecer (solo esa vez; el resto sigue igual).
        if (!shouldSuppressRating(session.id)) setRatingModal(true);
      }, 800);
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
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  // Zoom suave en la imagen — sutil, se deshace solo al soltar (rebote nativo)
  const heroScale = scrollY.interpolate({
    inputRange: [-260, 0],
    outputRange: [1.12, 1],
    extrapolate: "clamp",
  });
  const STICKY_START = HEADER_H + 68 - topPad;
  const STICKY_END   = STICKY_START + 40;
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
    return pool.slice(0, 7);
  }, [session.id]);

  const savedProgress = getSessionProgress(session.id);
  const hasProgress = savedProgress > 0.005;

  const { data: playsData } = useGetSessionPlayCount(session.id, {
    query: { queryKey: getGetSessionPlayCountQueryKey(session.id), staleTime: 60_000 },
  });

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSession(session);
    if (session.skipMiniPlayer) return;
    router.push("/player" as never);
  };

  const handlePlayFromStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearSessionProgress(session.id);
    playSession(session);
    if (session.skipMiniPlayer) return;
    router.push("/player" as never);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSession(session);
    if (session.skipMiniPlayer) return;
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

  // ── Perfil "Sobre el…" ───────────────────────────────────────────────────────
  // Guiadas → guiador | Música ambient/enteógena → artista | resto → null
  const aboutPerson: { name: string; firstName: string; photo: import("react-native").ImageSourcePropType; city?: string; country?: string; bio: string; profilePath: string } | null = (() => {
    if (isGuiada) return authors[0] ?? null;
    if (isMusica && session.artistId) {
      const a = getArtist(session.artistId);
      return { name: a.name, firstName: a.name.split(" ")[0], photo: a.photo, city: a.city, country: a.country, bio: a.bio, profilePath: `/artista/${a.id}` };
    }
    return null;
  })();

  return (
    <View style={[styles.root, { backgroundColor: sessionGradient[sessionGradient.length - 1] }]}>
      <StatusBar hidden />

      {/* Colchón de color fijo — cubre cualquier gap durante scroll rápido sin lag */}
      <View style={{ position: "absolute", top: HEADER_H - 2, left: 0, right: 0, height: 400, backgroundColor: sessionGradient[0], zIndex: 0 }} pointerEvents="none" />

      {/* ── Hero fijo ──────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.hero, { height: HEADER_H, position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: heroScale }] }]}>
          <Image source={session.image} style={StyleSheet.absoluteFill as object} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />
        </Animated.View>
      </Animated.View>

      {/* ── NavBar flotante — encima del ScrollView ────────────────────── */}
      <View style={[styles.navBar, { paddingTop: topPad, position: "absolute", top: 0, left: 0, right: 0, zIndex: 3 }]}>
        <GhostPill noBorder style={{ backgroundColor: "rgba(27,6,15,0.5)", marginTop: -2, transform: [{ translateY: 2 }] }}>
          <BackPill onPress={goBack} size={27} iconOffsetX={-2} />
        </GhostPill>
        <Pressable onPress={handleInstagramShare} hitSlop={10} style={({ pressed }) => [styles.igBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <FontAwesome name="instagram" size={20} color="#FBFBFB" />
        </Pressable>
      </View>

      <Animated.ScrollView
        style={[styles.scroll, { zIndex: 2 }]}
        contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {/* Spacer transparente — muestra el hero fijo debajo */}
        <View style={{ height: HEADER_H }} pointerEvents="none" />

        {/* ── Bloque fondo+contenido que cubre el hero al hacer scroll ──── */}
        <View style={{ backgroundColor: sessionGradient[sessionGradient.length - 1] }}>
          <LinearGradient
            colors={sessionGradient as unknown as [string, string, ...string[]]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        {/* ── Content ────────────────────────────────────────────────────── */}
        <View style={styles.content}>

          {/* Title + acciones */}
          <View style={[styles.titleRow, { marginTop: 24 }]}>
            <Text style={[styles.title, { color: colors.foreground, flex: 1 }]} numberOfLines={3}>{session.title}</Text>
            <View style={styles.titleActions}>
              <Pressable onPress={() => setActionsSheetOpen(true)} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Feather name="more-horizontal" size={22} color="#FBFBFB" />
              </Pressable>
              <AnimatedHeart favorited={fav} onToggle={handleFav} size={22} />
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

          {/* ── Botones Escuchar / Compartir ─────────────────────────── */}
          {hasProgress ? (
            <>
              <View style={[styles.splitBtnRow, { marginTop: 10, marginBottom: 12 }]}>
                {/* Reiniciar */}
                <Pressable
                  onPress={handlePlayFromStart}
                  style={({ pressed }) => [styles.splitBtn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient colors={playBtnColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                  <Feather name="rotate-ccw" size={16} color={playBtnTextColor} />
                  <Text style={[styles.playBtnText, { color: playBtnTextColor }]}>Reiniciar</Text>
                </Pressable>

                <View style={styles.splitDivider} />

                {/* Continuar */}
                <Pressable
                  onPress={handleContinue}
                  style={({ pressed }) => [styles.splitBtn, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient colors={playBtnColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                  <Svg width={16} height={16} viewBox="0 0 48 48">
                    <Path
                      d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                      fill={playBtnTextColor}
                    />
                  </Svg>
                  <Text style={[styles.playBtnText, { color: playBtnTextColor }]}>Continuar</Text>
                </Pressable>
              </View>

              {/* Compartir — debajo del split */}
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, marginBottom: 26 })}
              >
                <View style={[styles.shareBtnInner, { borderColor: shareBtnBorder }]}>
                  <Text style={[styles.shareBtnText, { color: shareBtnTextColor }]}>Compartir</Text>
                  <Feather name="send" size={15} color={shareBtnTextColor} />
                </View>
              </Pressable>
            </>
          ) : (
            /* Escuchar ahora + Compartir lado a lado */
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16, marginBottom: 26 }}>
              <Pressable
                onPress={handlePlay}
                style={({ pressed }) => [
                  styles.playBtn,
                  {
                    flex: 1,
                    opacity: pressed ? 0.88 : 1,
                    ...(isIndigoPlayBtn
                      ? {
                          shadowOpacity: 0,
                          shadowRadius: 0,
                          elevation: 0,
                        }
                      : {}),
                  },
                ]}
              >
                <View style={[StyleSheet.absoluteFill, { borderRadius: styles.playBtn.borderRadius, overflow: "hidden" }]}>
                  <LinearGradient colors={listenNowBtnColors} start={{ x: 0, y: 0 }} end={isIndigoPlayBtn ? { x: 1, y: 0 } : { x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Svg width={18} height={18} viewBox="0 0 48 48">
                    <Path
                      d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                      fill={playBtnTextColor}
                    />
                  </Svg>
                  <Text style={[styles.playBtnText, { color: playBtnTextColor }]}>
                    {isCurrentlyPlaying ? "Reproduciendo" : "Escuchar ahora"}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={handleShare}
                style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.75 : 1 })}
              >
                <View style={[styles.shareBtnInner, { borderColor: shareBtnBorder, flex: 1 }]}>
                  <Text style={[styles.shareBtnText, { color: shareBtnTextColor }]}>Compartir</Text>
                  <Feather name="send" size={15} color={shareBtnTextColor} />
                </View>
              </Pressable>
            </View>
          )}

          {/* Duration label + rating */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 5, marginBottom: 5 }}>
            {ratingStars > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 17, fontWeight: "600", color: "#FBFBFB" }}>
                  {ratingStars.toFixed(1)}
                </Text>
                <Text style={{ fontSize: 14, color: "#FBFBFB", lineHeight: 19 }}>★</Text>
              </View>
            )}
            <Text style={[styles.durationLabel, { marginTop: 0, fontSize: 17 }]}>{session.durationLabel}</Text>
          </View>

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


          {/* ── Sobre el/la guiador/artista ─────────────────────────────── */}
          {aboutPerson && (
            <View style={styles.aboutBlock}>
              <Text style={[styles.blockTitle, { color: colors.foreground, marginBottom: 21 }]}>
                {`Sobre ${aboutPerson.firstName}`}
              </Text>
              <View style={styles.aboutCard}>
                <View style={styles.aboutCardHeader}>
                  <Image
                    source={aboutPerson.photo}
                    style={styles.aboutAvatar}
                    contentFit="cover"
                    placeholder={BLUR_PLACEHOLDER}
                    transition={IMAGE_TRANSITION}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.aboutName}>{aboutPerson.name}</Text>
                    {(aboutPerson.city || aboutPerson.country) && (
                      <Text style={styles.aboutLocation}>
                        {[aboutPerson.city, aboutPerson.country].filter(Boolean).join(", ")}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.aboutBio}>{aboutPerson.bio}</Text>
                <Pressable
                  onPress={() => router.push(aboutPerson.profilePath as never)}
                  style={({ pressed }) => [styles.aboutProfileLink, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={styles.aboutProfileLinkText}>Ver perfil</Text>
                  <Feather name="chevron-right" size={14} color="#F9F9F9" />
                </Pressable>
              </View>
            </View>
          )}

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
                    onPress={() => openSession(s.id)}
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
        </View>{/* /bloque fondo+contenido */}
      </Animated.ScrollView>

      {/* ── Sticky header (aparece al scrollear) ─────────────────────────── */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.stickyHeader, { paddingTop: topPad, opacity: stickyOpacity, backgroundColor: stickyHeaderColor }]}
      >
        <GhostPill noBorder style={{ backgroundColor: "rgba(255,255,255,0.10)", marginTop: -2, transform: [{ translateY: -3 }] }}>
          <BackPill onPress={goBack} size={27} iconOffsetX={-2} />
        </GhostPill>
        <View style={{ flex: 1, alignItems: "center", paddingTop: 8 }}>
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
            <LinearGradient colors={sceneTheme.id === "tibet" ? ["#2D1C52", "#261F57", "#1F255A", "#1F2A62", "#283673", "#2D4082"] : sceneTheme.gradient} style={StyleSheet.absoluteFill} />
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
              {/* Sonido ambiente */}
              <Pressable
                style={styles.optRow}
                onPress={() => { setActionsSheetOpen(false); setTimeout(() => setShowAmbientPicker(true), 300); }}
              >
                <Feather name="music" size={18} color="#FBFBFB" style={styles.optIcon} />
                <Text style={styles.optRowText}>Sonido ambiente</Text>
                {selectedAmbientSoundId && (
                  <Feather name="check-circle" size={15} color="#F9F9F9" style={{ marginRight: 6 }} />
                )}
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>
              {/* Temporizador */}
              <Pressable style={styles.optRow} onPress={() => setActionsSheetOpen(false)}>
                <Feather name="clock" size={18} color="#FBFBFB" style={styles.optIcon} />
                <Text style={styles.optRowText}>Temporizador</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>
              {/* Descargar */}
              <Pressable style={styles.optRow}>
                <Feather name="download" size={18} color="#FBFBFB" style={styles.optIcon} />
                <Text style={styles.optRowText}>Descargar</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>
              {/* Agregar a favoritos */}
              <Pressable style={styles.optRow} onPress={() => { handleFav(); }}>
                <Feather name="heart" size={18} color={fav ? "#F9F9F9" : "#FBFBFB"} style={styles.optIcon} />
                <Text style={[styles.optRowText, fav ? { color: "#F9F9F9" } : {}]}>
                  {fav ? "En favoritos" : "Agregar a favoritos"}
                </Text>
                {fav && <Feather name="check" size={15} color="#F9F9F9" />}
              </Pressable>
              {/* Añadir a playlist */}
              <Pressable
                style={styles.optRow}
                onPress={() => { setActionsSheetOpen(false); setTimeout(() => setShowPlaylistSheet(true), 300); }}
              >
                <Feather name="list" size={18} color="#FBFBFB" style={styles.optIcon} />
                <Text style={styles.optRowText}>Añadir a playlist</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>
              {/* Seguir al guía (si aplica) */}
              {authors[0]?.profilePath && (
                <Pressable
                  style={styles.optRow}
                  onPress={() => { setActionsSheetOpen(false); router.push(authors[0].profilePath as never); }}
                >
                  <Feather name="user-plus" size={18} color="#FBFBFB" style={styles.optIcon} />
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
      <AmbientSoundPickerSheet
        visible={showAmbientPicker}
        selectedSoundId={selectedAmbientSoundId}
        session={{ title: session.title, image: session.image }}
        onClose={() => setShowAmbientPicker(false)}
        initialStep={selectedAmbientSoundId ? "controles" : "pick"}
        initialAmbientVolume={ambientOverlayVolume}
        onPreviewStart={(sid) => setSelectedAmbientSoundId(sid)}
        onAmbientVolumeChange={(vol) => {
          setAmbientOverlayVolume(vol);
          if (ambientOverlayRef.current) ambientOverlayRef.current.volume = vol;
        }}
        onSelect={(sid, vol) => {
          setSelectedAmbientSoundId(sid);
          setAmbientOverlayVolume(vol);
        }}
        onRemoveConfirm={() => {
          setSelectedAmbientSoundId(null);
          setShowAmbientPicker(false);
        }}
      />

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
                    color: ratingStars >= star ? "#F9F9F9" : "rgba(255,255,255,0.25)",
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
                colors={["#F9F9F9", "#F9F9F9"]}
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
          <Text style={{ color: "#F9F9F9", fontSize: 11, letterSpacing: 5, fontWeight: "700" }}>RESONANCIA</Text>
          <Text style={{ color: "#F4F4F4", fontSize: 10, letterSpacing: 2, marginTop: 3 }}>Casa del Cuenco</Text>
        </View>
        {/* Session info center */}
        <View style={{ position: "absolute", bottom: 190, left: 36, right: 36 }}>
          <Text style={{ color: "#F9F9F9", fontSize: 11, letterSpacing: 2, textAlign: "center", marginBottom: 12, textTransform: "uppercase" }}>
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
    paddingHorizontal: 16,
    paddingBottom: 18,
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
  durationLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "500",
    color: "#FBFBFB",
    marginTop: 29,
  },
  authorNameInline: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "500",
    color: "#FBFBFB",
    marginTop: 3,
    marginBottom: 16,
  },
  authorNameLink: {
    fontFamily: "Manrope",
    textDecorationLine: "underline",
    textDecorationColor: "#FBFBFB",
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
    fontFamily: "Manrope",
    fontSize: 23,
    fontWeight: "700",
    lineHeight: 33,
    letterSpacing: -0.3,
    textAlign: "left",
  },

  // Description
  description: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 30,
    marginBottom: 24,
    textAlign: "left",
  },

  // Chakra banner
  chakraBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  chakraBannerText: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.70)",
  },
  chakraBannerBold: {
    fontFamily: "Manrope",
    fontWeight: "700",
    fontSize: 13,
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
  authorName: { fontFamily: "Manrope", fontSize: 22, fontWeight: "800", marginTop: 15, marginBottom: 4 },
  authorCountry: { fontFamily: "Manrope", fontSize: 14, color: "#FBFBFB", marginTop: 6, marginBottom: 8 },
  authorBio: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21, color: "#FBFBFB", marginTop: 6 },
  authorLink: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },
  allContentsBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
    shadowColor: "#F9F9F9",
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
    color: "#F9F9F9",
  },

  blockTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 14,
  },

  // Sobre el guiador / artista
  aboutBlock: { marginTop: 18, marginBottom: 8 },
  aboutCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  aboutCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  aboutAvatar: { width: 52, height: 52, borderRadius: 26 },
  aboutName: { fontFamily: "Manrope", fontSize: 15, fontWeight: "600", color: "#FBFBFB" },
  aboutLocation: { fontFamily: "Manrope", fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  aboutBio: { fontFamily: "Manrope", fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 19 },
  aboutProfileLink: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start", marginTop: 2 },
  aboutProfileLinkText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F9F9F9" },

  // Related vertical list
  relatedBlock: { marginBottom: 20, marginTop: 4 },
  relatedList: { gap: 18, marginTop: 21 },
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
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
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
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "400",
    color: "#FBFBFB",
    textAlign: "center",
  },
  stickySubtitle: {
    fontFamily: "Manrope",
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
    shadowColor: "#8769e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  playBtnText: {
    fontFamily: "Manrope",
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
    borderColor: "#F9F9F9",
    paddingHorizontal: 24,
  },
  shareBtnText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F9F9F9",
    letterSpacing: 0.5,
  },
  splitBtnRow: {
    flexDirection: "row",
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#F9F9F9",
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
    marginTop: 17,
    marginBottom: -16,
  },
  playsText: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "#F9F9F9",
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
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "700",
    color: "#FBFBFB",
    marginTop: 4,
    marginBottom: 10,
    textAlign: "center",
  },
  ratingSubtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    color: "#F4F4F4",
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
    fontFamily: "Manrope",
    width: "80%",
    minHeight: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(214,173,95,0.30)",
    color: "#FBFBFB",
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
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#1B060F",
    letterSpacing: 0.5,
  },
  ratingDismissText: {
    fontFamily: "Manrope",
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
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "400",
    color: "#FBFBFB",
    lineHeight: 20,
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  optSessionAuthor: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "300",
    color: "#F4F4F4",
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
    fontFamily: "Manrope",
    marginRight: 16,
    width: 22,
    textAlign: "center",
  },
  optRowText: {
    fontFamily: "Manrope",
    fontSize: 16,
    color: "#FBFBFB",
    flex: 1,
  },
});
