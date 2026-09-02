import { Feather, Ionicons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Animated,
  Alert,
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
import { useTabBarVisibility } from "@/context/TabBarVisibilityContext";
import { useGetSessionPlayCount, getGetSessionPlayCountQueryKey } from "@workspace/api-client-react";
import { getSessionById, getSonidosVisibleSessions } from "@/data/sessions";
import { getGuide } from "@/data/guides";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { hexToRgba } from "@/utils/color";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { SOUND_MAP } from "@/config/sound-map";
import { REMOTE_SOUND_MAP } from "@/lib/remoteSoundMap";
import { AmbientSoundPickerSheet } from "@/components/AmbientSoundPickerSheet";
import { AddToPlaylistSheet } from "@/components/AddToPlaylistSheet";
import { AddToFolderSheet } from "@/components/AddToFolderSheet";
import { GhostPill } from "@/components/GhostPill";

function CircleActionButton({
  label,
  testID,
  onPress,
  backgroundColor,
  children,
}: {
  label: string;
  testID: string;
  onPress: () => void;
  backgroundColor: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.circleAction,
        { backgroundColor, opacity: pressed ? 0.78 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

export default function SessionDetailScreen({ id: idProp }: { id?: string } = {}) {
  const { id: idParam, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const id = idProp ?? idParam;
  const overlayBack = useBackOverride();
  const goBack = () => (overlayBack ? overlayBack() : router.back());
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    playSession,
    playSessionInPlaylist,
    pauseResume,
    isFavorite,
    toggleFavorite,
    currentSession,
    isPlaying,
    isLoading,
    progress,
    clearSessionProgress,
  } = usePlayer();
  const { shouldSuppressRating } = useStreakCelebration();
  const { theme: sceneTheme } = useSceneTheme();
  const { requestHide, showMenu } = useTabBarVisibility();

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const session = getSessionById(id ?? "");

  useEffect(() => {
    requestHide();
    return showMenu;
  }, [requestHide, showMenu]);

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
  const isPlaceholder = session.isPlaceholder === true;
  // Fondo ligado a la Escena activa (naturaleza/bosque/lluvia/viento/...).
  const sessionGradient: string[] = sceneTheme.id === "tibet"
    ? ["#2D1C52", "#261F57", "#1F255A", "#1F2A62", "#283673", "#2D4082"]
    : [...sceneTheme.gradient];
  const actionBackground = "rgba(0,0,0,0.3)";
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

  const fav = localFav !== null ? localFav : isFavorite(session.id);
  const isCurrentSession = currentSession?.id === session.id;
  const isCurrentlyPlaying = isCurrentSession && isPlaying;

  const { data: playsData } = useGetSessionPlayCount(session.id, {
    query: { queryKey: getGetSessionPlayCountQueryKey(session.id), staleTime: 60_000 },
  });

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearSessionProgress(session.id);
    if (source === "sonidos") {
      playSessionInPlaylist(
        session,
        getSonidosVisibleSessions().map((candidate) => candidate.id),
      );
    } else {
      playSession(session);
    }
    if (session.skipMiniPlayer) return;
    router.push("/player" as never);
  };

  const handlePlayback = () => {
    if (isLoading && isCurrentSession) return;
    if (isPlaceholder) {
      handlePlay();
      return;
    }
    if (isCurrentSession && (isPlaying || progress < 1)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      pauseResume();
      return;
    }
    handlePlay();
  };

  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Próximamente", "La descarga estará disponible en una próxima versión.");
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

  // ── Autor de la sesión ───────────────────────────────────────────────────────
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
    <View style={[styles.root, { backgroundColor: sessionGradient[sessionGradient.length - 1] }]}>
      <StatusBar hidden />

      {/* ── Imagen inmersiva y contraste ─────────────────────────────────── */}
      <View style={styles.immersiveBackground} pointerEvents="none">
        <Image
          source={session.image}
          style={StyleSheet.absoluteFill as object}
          contentFit="cover"
          placeholder={BLUR_PLACEHOLDER}
          transition={IMAGE_TRANSITION}
        />
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.06)",
            "rgba(0,0,0,0.16)",
            "rgba(0,0,0,0.42)",
          ]}
          locations={[0, 0.46, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* ── Fila superior de acciones ─────────────────────────────────────── */}
      <View style={[styles.topActionRow, { paddingTop: topPad + 8 }]} pointerEvents="box-none">
        <CircleActionButton
          label="Volver"
          testID="session-detail-back-button"
          onPress={goBack}
          backgroundColor={actionBackground}
        >
          <Feather name="chevron-left" size={23} color={colors.foreground} />
        </CircleActionButton>

        <View style={styles.topActionGroup}>
          <CircleActionButton
            label="Descargar"
            testID="session-detail-download-button"
            onPress={handleDownload}
            backgroundColor={actionBackground}
          >
            <Feather name="download" size={19} color={colors.foreground} />
          </CircleActionButton>
          <CircleActionButton
            label={fav ? "Quitar de Me gusta" : "Me gusta"}
            testID="session-detail-favorite-button"
            onPress={handleFav}
            backgroundColor={actionBackground}
          >
            <Ionicons
              name={fav ? "heart" : "heart-outline"}
              size={21}
              color={colors.foreground}
            />
          </CircleActionButton>
          <CircleActionButton
            label="Compartir"
            testID="session-detail-share-button"
            onPress={handleShare}
            backgroundColor={actionBackground}
          >
            <Feather name="share-2" size={19} color={colors.foreground} />
          </CircleActionButton>
          <CircleActionButton
            label="Más opciones"
            testID="session-detail-more-button"
            onPress={() => setActionsSheetOpen(true)}
            backgroundColor={actionBackground}
          >
            <Feather name="more-horizontal" size={20} color={colors.foreground} />
          </CircleActionButton>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.immersiveScroll}
        contentContainerStyle={[
          styles.immersiveScrollContent,
          { paddingTop: topPad + 74, paddingBottom: bottomPad + 38 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.immersiveStage}>
          <View style={styles.playArea}>
            <GhostPill style={styles.immersivePlayPill}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isPlaceholder
                    ? "Ver disponibilidad de la sesión"
                    : isCurrentlyPlaying
                      ? "Pausar sesión"
                      : "Reproducir sesión"
                }
                accessibilityState={{
                  busy: isLoading && isCurrentSession,
                  disabled: isLoading && isCurrentSession,
                }}
                testID="session-detail-play-button"
                onPress={handlePlayback}
                disabled={isLoading && isCurrentSession}
                style={({ pressed }) => [
                  styles.immersivePlayButton,
                  {
                    opacity: isLoading && isCurrentSession ? 0.82 : pressed ? 0.82 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                {isLoading && isCurrentSession ? (
                  <ActivityIndicator size="small" color={colors.foreground} />
                ) : (
                  <Ionicons
                    name={isCurrentlyPlaying ? "pause" : "play"}
                    size={31}
                    color={colors.foreground}
                    style={!isCurrentlyPlaying ? { marginLeft: 3 } : undefined}
                  />
                )}
              </Pressable>
            </GhostPill>
          </View>

          <View style={styles.immersiveInfo}>
            {!!session.categoryLabel && (
              <Text style={[styles.immersiveCategory, { color: colors.foreground }]}>
                {session.categoryLabel}
              </Text>
            )}
            <Text style={[styles.immersiveTitle, { color: colors.foreground }]}>{session.title}</Text>

            {!!session.description && (
              <Text style={[styles.immersiveDescription, { color: colors.foreground }]}>
                {session.description}
              </Text>
            )}

            {authors[0] && (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Ver perfil de ${authors[0].name}`}
                onPress={() => router.push(authors[0].profilePath as never)}
                style={({ pressed }) => [styles.immersiveAuthorButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.immersiveAuthorPrefix, { color: colors.foreground }]}>Por </Text>
                <Text style={[styles.immersiveAuthor, { color: colors.foreground }]}>
                  {authors[0].name}
                </Text>
              </Pressable>
            )}

            <View style={styles.immersiveMetaRow}>
              {ratingStars > 0 && (
                <View style={styles.ratingMeta}>
                  <Text style={[styles.ratingMetaValue, { color: colors.foreground }]}>
                    {ratingStars.toFixed(1)}
                  </Text>
                  <Text style={[styles.ratingMetaStar, { color: colors.foreground }]}>★</Text>
                </View>
              )}
              <Text style={[styles.immersiveDuration, { color: colors.foreground }]}>
                {session.durationLabel}
              </Text>
            </View>

            {isPlaceholder && (
              <Text style={[styles.placeholderHint, { color: colors.foreground }]}>
                Contenido próximamente
              </Text>
            )}

            {playsData !== undefined && (
              <View style={styles.playsRow}>
                <Feather name="headphones" size={13} color={colors.foreground} />
                <Text style={[styles.playsText, { color: colors.foreground }]}>
                  {playsData.plays === 0
                    ? "Sé el primero en escuchar esta sesión"
                    : `${playsData.plays.toLocaleString("es")} ${playsData.plays === 1 ? "reproducción" : "reproducciones"}${session.createdAt ? ` desde ${new Date(session.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}` : ""}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>

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
              {/* Compartir en Instagram */}
              <Pressable
                style={styles.optRow}
                onPress={() => {
                  setActionsSheetOpen(false);
                  void handleInstagramShare();
                }}
              >
                <Feather name="instagram" size={18} color="#FBFBFB" style={styles.optIcon} />
                <Text style={styles.optRowText}>Compartir en Instagram</Text>
                <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.35)" />
              </Pressable>
              {/* Descargar */}
              <Pressable style={styles.optRow} onPress={handleDownload}>
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
  immersiveBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  topActionRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 4,
  },
  topActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  circleAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  immersiveScroll: {
    flex: 1,
    zIndex: 1,
  },
  immersiveScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  immersiveStage: {
    flexGrow: 1,
    justifyContent: "center",
    transform: [{ translateY: -50 }],
  },
  playArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  immersivePlayPill: {
    width: 88,
    height: 88,
    borderRadius: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
  },
  immersivePlayButton: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  immersiveInfo: {
    alignItems: "center",
    paddingHorizontal: 6,
    marginTop: 35,
  },
  immersiveCategory: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 2.2,
    textAlign: "center",
    textTransform: "uppercase",
    opacity: 0.76,
    marginBottom: 10,
  },
  immersiveTitle: {
    fontFamily: "Manrope",
    fontSize: 27,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
    maxWidth: 350,
  },
  immersiveDescription: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "400",
    textAlign: "center",
    opacity: 0.82,
    maxWidth: 350,
    marginTop: 14,
  },
  immersiveAuthorButton: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginTop: 17,
  },
  immersiveAuthorPrefix: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.68,
  },
  immersiveAuthor: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  immersiveMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 9,
  },
  ratingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingMetaValue: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.78,
  },
  ratingMetaStar: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.78,
  },
  immersiveDuration: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    opacity: 0.78,
  },
  placeholderHint: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.72,
    marginTop: 11,
  },
  playsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    maxWidth: 350,
  },
  playsText: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    opacity: 0.66,
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
