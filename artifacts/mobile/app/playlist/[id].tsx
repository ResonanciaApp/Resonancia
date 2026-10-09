import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { openPremiumPlans } from "@/lib/premiumGate";
import { useBackOverride } from "@/context/BackOverrideContext";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  PanResponder,
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

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { PlaylistAddSessionsSheet } from "@/components/PlaylistAddSessionsSheet";
import { SacredGlyph } from "@/components/SacredGlyph";
import {
  getDefaultPlaylistCover,
  getPlaylistCoverPreset,
  type PlaylistCoverPreset,
} from "@/data/default-playlist-covers";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { VideoActionsSheet } from "@/components/VideoActionsSheet";
import { VideoCard } from "@/components/VideoCard";
import { CreationCoverPreview } from "@/components/CreationCoverPreview";
import Animated from "react-native-reanimated";
import { ScrollProgressIndicator, useScrollProgress } from "@/components/ScrollProgressIndicator";
import { EqualizerBars } from "@/components/EqualizerBars";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type Session } from "@/data/sessions";
import { type VideoItem } from "@/data/videos";
import { useVideos } from "@/hooks/useVideos";
import { getGuideById } from "@/data/guides";
import { getArtist } from "@/data/artists";
import { type GeometryId } from "@/data/geometries";
import { useLibraryReturnBack } from "@/hooks/useLibraryReturnBack";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { readMoodHistory } from "@/data/mood-history";
import { getMoodById, type Mood } from "@/data/moods";
import { catalogImage, useCoverPresetCatalog } from "@/lib/cover-preset-catalog";

const BG_GRADIENT_FALLBACK = ["#340D1A", "#190913"] as const;
const GOLD = "#F9F9F9";
const TEXT = "#FAF0EE";
const MUTED = "#c2c2c2";
const DEFAULT_PANEL_BG = "transparent";
const PLAYLIST_CONTROL_BG = WIDGET_GREEN_SOLID;

/** Convierte hex a [r,g,b] (0-255). */
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/**
 * Mezcla el color extraído con un tono plomo oscuro y lo devuelve como
 * color CSS rgba con opacidad baja para superponerlo sobre el gradiente raíz.
 * ratio=0.4 → 40% color imagen, 60% plomo #2A2A35.
 */
function buildPanelColor(hex: string, alpha = 0.55, ratio = 0.4): string {
  const src = hexToRgb(hex);
  if (!src) return DEFAULT_PANEL_BG;
  const lead: [number, number, number] = [42, 42, 53]; // #2A2A35
  const r = Math.round(src[0] * ratio + lead[0] * (1 - ratio));
  const g = Math.round(src[1] * ratio + lead[1] * (1 - ratio));
  const b = Math.round(src[2] * ratio + lead[2] * (1 - ratio));
  return `rgba(${r},${g},${b},${alpha})`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PlaylistDetailScreen({ id: idProp }: { id?: string } = {}) {
  const { id: idParam, fromLibrary } = useLocalSearchParams<{ id: string; fromLibrary?: string }>();
  const id = idProp ?? idParam;
  const backOverride = useBackOverride();
  const libraryBack = useLibraryReturnBack(fromLibrary);
  const goBack = backOverride ?? libraryBack;
  const insets = useSafeAreaInsets();
  const { theme: sceneTheme, activeSceneId } = useSceneTheme();
  const BG_GRADIENT = sceneTheme.gradient;
  const darkestStop = BG_GRADIENT[BG_GRADIENT.length - 1];
  const darkestRgb  = hexToRgb(darkestStop);
  const menuBtnBg   = darkestRgb
    ? `rgba(${darkestRgb[0]},${darkestRgb[1]},${darkestRgb[2]},0.5)`
    : "rgba(0,0,0,0.5)";
  const plusBadgeBg = darkestRgb
    ? `rgba(${darkestRgb[0]},${darkestRgb[1]},${darkestRgb[2]},0.96)`
    : "rgba(0,0,0,0.96)";
  const { isPremium } = usePremium();
  const { playlists, deletePlaylist, removeFromPlaylist, addToPlaylist, renamePlaylist, setPlaylistDescription, reorderPlaylist, setPlaylistCover, setPlaylistCoverPreset, removeVideoFromPlaylist } = useFoldersPlaylists();
  const { videos: allVideos } = useVideos();
  const {
    playSession,
    playSessionInPlaylist,
    pauseResume,
    isPlaying,
    currentSession,
    activePlaylistOwner,
  } = usePlayer();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ¿Está sonando una sesión de ESTA playlist?
  const playlistSessionIds = playlists.find((p) => p.id === id)?.sessionIds ?? [];
  const playlistOwner = id ? `private:${id}` : null;
  const ownsActiveQueue = !!playlistOwner && activePlaylistOwner === playlistOwner;
  const miniPlayerVisible =
    ownsActiveQueue && !!currentSession && playlistSessionIds.includes(currentSession.id);
  const MINI_H = 68;

  // ── Anti-flicker para el botón play/pause ────────────────────────────────
  // pauseResume() hace un update optimista pero el status listener del audio lo
  // sobrescribe durante ~200ms antes de que el audio arranque. Guardamos el
  // estado esperado y lo usamos para el ícono hasta que el contexto se asiente.
  const [pendingPlayState, setPendingPlayState] = useState<boolean | null>(null);
  const displayIsPlaying = pendingPlayState !== null ? pendingPlayState : isPlaying;

  useEffect(() => {
    if (pendingPlayState !== null && isPlaying === pendingPlayState) {
      setPendingPlayState(null);
    }
  }, [isPlaying, pendingPlayState]);

  const handleTogglePlay = () => {
    if (miniPlayerVisible) {
      // Ya hay una sesión de esta playlist sonando → toggle
      const next = !displayIsPlaying;
      setPendingPlayState(next);
      pauseResume();
    } else {
      // No hay sesión activa → Play All
      handlePlayAll();
      setPendingPlayState(true);
    }
  };
  // tab bar height (misma fórmula que (tabs)/_layout.tsx)
  const tabBarH = 31 + Math.round(bottomPad / 2) + bottomPad;

  const [actionsSession, setActionsSession] = useState<Session | null>(null);
  const [actionsVideo, setActionsVideo] = useState<VideoItem | null>(null);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editOrderVisible, setEditOrderVisible] = useState(false);
  const [editInfoVisible, setEditInfoVisible] = useState(false);
  const [coverModalVisible, setCoverModalVisible] = useState(false);
  const playlistCatalog = useCoverPresetCatalog("playlist");

  const playlist = playlists.find((p) => p.id === id);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const descriptionFocusedRef = useRef(false);
  const [latestMoods, setLatestMoods] = useState<Mood[]>([]);

  useEffect(() => {
    if (descriptionFocusedRef.current) return;
    setDescriptionDraft(playlist?.description ?? "");
  }, [playlist?.description, playlist?.id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      readMoodHistory()
        .then((records) => {
          if (cancelled) return;
          const moods = (records[0]?.moodIds ?? [])
            .map((moodId) => getMoodById(moodId))
            .filter((mood): mood is Mood => Boolean(mood));
          setLatestMoods(moods);
        })
        .catch(() => {
          if (!cancelled) setLatestMoods([]);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const panelColor = playlist?.coverColor
    ? buildPanelColor(playlist.coverColor)
    : DEFAULT_PANEL_BG;
  const playlistPresetSource = playlist?.coverPresetId
    ? playlistCatalog.find((item) => item.key === playlist.coverPresetId || item.id === playlist.coverPresetId)?.source
      ?? catalogImage("playlist", playlist.coverPresetId)
      ?? getPlaylistCoverPreset(playlist.coverPresetId)?.source
    : undefined;

  const sessions = useMemo(
    () =>
      (playlist?.sessionIds ?? [])
        .map((sid) => SESSIONS.find((s) => s.id === sid))
        .filter(Boolean) as Session[],
    [playlist?.sessionIds]
  );
  const playableSessions = useMemo(
    () => sessions.filter((session) => !session.isPremium || isPremium),
    [isPremium, sessions],
  );
  const playableSessionIds = useMemo(
    () => playableSessions.map((session) => session.id),
    [playableSessions],
  );

  const playlistVideos = useMemo(
    () =>
      (playlist?.videoIds ?? [])
        .map((vid) => allVideos.find((v) => v.id === vid))
        .filter(Boolean) as VideoItem[],
    [playlist?.videoIds, allVideos]
  );

  const recommended = useMemo(() => {
    if (!playlist) return [];
    const inPl = new Set(playlist.sessionIds);
    const available = SESSIONS.filter((session) => !inPl.has(session.id) && !session.isPlaceholder);
    if (latestMoods.length === 0) return shuffle(available).slice(0, 12);

    const categories = new Set(latestMoods.flatMap((mood) => mood.categoryIds));
    const themeTags = new Set(latestMoods.flatMap((mood) => mood.themeTags));
    const categoryMatches = available.filter((session) => categories.has(session.categoryId));
    const boosted = categoryMatches.filter((session) =>
      session.themeTag?.some((tag) => themeTags.has(tag)),
    );
    const remaining = categoryMatches.filter((session) =>
      !session.themeTag?.some((tag) => themeTags.has(tag)),
    );
    return [...boosted, ...remaining].slice(0, 12);
  }, [latestMoods, playlist]);

  const totalMin = useMemo(() => {
    const total = sessions.reduce((acc, s) => {
      const match = s.durationLabel?.match(/(\d+)\s*min/);
      return acc + (match ? parseInt(match[1], 10) : 0);
    }, 0);
    return total;
  }, [sessions]);

  if (!playlist) {
    return (
      <View style={styles.root}>
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Feather name="list" size={48} color={MUTED} style={{ marginBottom: 16 }} />
          <Text style={{ color: MUTED, fontSize: 16 }}>Playlist no encontrada</Text>
          <Pressable onPress={goBack} style={{ marginTop: 24 }}>
            <Text style={{ color: GOLD, fontSize: 15 }}>← Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Eliminar playlist",
      `¿Eliminar "${playlist.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => { deletePlaylist(playlist.id); goBack(); } },
      ]
    );
  };

  const commitDescription = () => {
    descriptionFocusedRef.current = false;
    const nextDescription = descriptionDraft.trim();
    setDescriptionDraft(nextDescription);
    if (nextDescription !== (playlist.description ?? "")) {
      setPlaylistDescription(playlist.id, nextDescription);
    }
  };

  const handlePlayAll = () => {
    const first = playableSessions[0];
    if (!first) return;
    playSessionInPlaylist(first, playableSessionIds, playlistOwner ?? undefined);
    router.push({
      pathname: "/player",
      params: { privatePlaylistId: playlist.id },
    } as never);
  };

  const handleShuffle = () => {
    if (!playableSessions.length) return;
    const random = playableSessions[Math.floor(Math.random() * playableSessions.length)];
    // Usar playSessionInPlaylist con shuffle activado (se barajará en el contexto)
    playSessionInPlaylist(random, playableSessionIds, playlistOwner ?? undefined, true);
    router.push({
      pathname: "/player",
      params: { privatePlaylistId: playlist.id },
    } as never);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Escucha mi playlist "${playlist.name}" en Resonancia 🎵` });
    } catch (_) {}
  };

  return (
    <View style={[styles.root, { backgroundColor: sceneTheme.solid }]}>
      <LinearGradient
        colors={BG_GRADIENT}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar hidden />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 32 + (miniPlayerVisible ? MINI_H : 0) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Relleno para el rubber-band de iOS: invisible en reposo, muestra panelColor al hacer pull-down */}
        <View style={{ position: "absolute", top: -600, left: 0, right: 0, height: 600, backgroundColor: panelColor }} />

        {/* Header — scrollea con el contenido (sin sticky) */}
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: panelColor }]}>
          <Pressable
            onPress={goBack}
            hitSlop={10}
            style={styles.playlistBackButton}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Feather name="chevron-left" size={28} color="#FFFFFF" style={{ transform: [{ translateX: -1 }] }} />
          </Pressable>
          <Pressable
            onPress={() => setMenuVisible(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Abrir opciones de la playlist"
            style={[
              styles.iconBtn,
              styles.moreMenuBtn,
              styles.playlistHeaderMenuButton,
              { top: topPad + 8 },
            ]}
          >
            <Feather name="more-horizontal" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* ── Panel superior (segundo fondo con fade) ─────────────────────── */}
        <View style={styles.topPanel}>
          <LinearGradient
            colors={[panelColor, "transparent"]}
            style={[StyleSheet.absoluteFill, { bottom: -90 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Cover art — tap para elegir foto o geometría */}
          <Pressable style={styles.cover} onPress={() => setCoverModalVisible(true)}>
            {getDefaultPlaylistCover(playlist.id) && !playlist.coverUri && !playlist.coverType ? (
              <Image source={getDefaultPlaylistCover(playlist.id)} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : playlist.coverType === "geometrix" && playlist.coverGeometryId ? (
              <View style={[styles.coverGlyph, { backgroundColor: panelColor }]}>
                <SacredGlyph
                  id={playlist.coverGeometryId as GeometryId}
                  color={GOLD}
                   size={187.45}
                  strokeWidth={1.2}
                  opacity={1}
                />
              </View>
            ) : playlist.coverType === "creation" && playlist.coverCreationId ? (
              <View style={styles.coverCreation}>
                 <CreationCoverPreview creationId={playlist.coverCreationId} size={146.05} />
              </View>
            ) : playlist.coverPresetId && playlistPresetSource ? (
              <Image
                source={playlistPresetSource}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : playlist.coverUri ? (
              <Image
                source={{ uri: playlist.coverUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <View style={styles.coverEmpty}>
                <View pointerEvents="none" style={styles.coverPlaceholderBackground} />
                <Feather name="music" size={40} color={MUTED} />
              </View>
            )}
            <View style={styles.coverEditBadge} pointerEvents="none">
              <GoldGradientFill />
              <Feather name="camera" size={14} color="#1B060F" />
            </View>
          </Pressable>

          {/* Info */}
          <View style={styles.heroInfo}>
            <View style={{ marginTop: 3 }}>
              <Text style={styles.playlistName} numberOfLines={3}>{playlist.name}</Text>
            </View>
            <TextInput
              style={styles.playlistDesc}
              value={descriptionDraft}
              onChangeText={setDescriptionDraft}
              onFocus={() => {
                descriptionFocusedRef.current = true;
              }}
              onBlur={commitDescription}
              placeholder="Escribe una descripción (opcional)"
              placeholderTextColor="#B5B0B0"
              multiline
              maxLength={180}
              accessibilityLabel="Descripción de la playlist"
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>{totalMin} min</Text>
        </View>


        </View>{/* fin topPanel */}

        {/* ── Píldoras Reproducir + Aleatorio ─────────────────────────── */}
        {sessions.length > 0 && (
          <View style={styles.pillsRow}>
            {/* Play / Pause */}
            <Pressable
              style={({ pressed }) => [
                styles.pill,
                { backgroundColor: PLAYLIST_CONTROL_BG, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleTogglePlay}
            >
              <Feather
                name={miniPlayerVisible && displayIsPlaying ? "pause" : "play"}
                size={16}
                color="#0E0E17"
                style={{ marginRight: 7 }}
              />
              <Text style={[styles.pillText, { color: "#0E0E17" }]}>
                {miniPlayerVisible && displayIsPlaying ? "Pausar" : "Reproducir"}
              </Text>
            </Pressable>
            {/* Aleatorio */}
            <Pressable
              style={({ pressed }) => [styles.pillOutline, { opacity: pressed ? 0.75 : 1 }]}
              onPress={handleShuffle}
            >
              <Text style={styles.pillOutlineText}>Aleatorio</Text>
              <Feather name="shuffle" size={15} color="#f9f9f9" />
            </Pressable>
          </View>
        )}

        {/* Sessions list */}
        <View style={{ marginTop: sessions.length > 0 ? 30 : 15 }}>
        {sessions.map((session) => (
          <PlaylistSessionRow
            key={session.id}
            session={session}
            isPremium={isPremium}
            isActive={ownsActiveQueue && currentSession?.id === session.id}
            isPlaying={ownsActiveQueue && displayIsPlaying}
            onPlay={() => {
              if (session.isPremium && !isPremium) {
                openPremiumPlans();
                return;
              }
              playSessionInPlaylist(session, playableSessionIds, playlistOwner ?? undefined);
              router.push({
                pathname: "/player",
                params: { privatePlaylistId: playlist.id },
              } as never);
            }}
            onActionsPress={() => setActionsSession(session)}
            onRemove={() => removeFromPlaylist(playlist.id, session.id)}
          />
        ))}
        </View>

        {/* Videos de la playlist */}
        {playlistVideos.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: sessions.length > 0 ? 12 : 0 }}>
            {playlistVideos.map((v) => (
              <View key={v.id} style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <VideoCard
                    video={v}
                    horizontal
                    onOptionsPress={() => setActionsVideo(v)}
                  />
                </View>
                <Pressable
                  onPress={() => removeVideoFromPlaylist(playlist.id, v.id)}
                  hitSlop={10}
                  style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center", marginBottom: 12 }}
                >
                  <Feather name="x" size={16} color={MUTED} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* + Agregar a esta playlist */}
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            sessions.length > 0 && styles.addBtnWithSessions,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => setAddSheetVisible(true)}
        >
          <Feather name="plus" size={16} color={TEXT} style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Agregar a esta Playlist</Text>
        </Pressable>

        {/* Sesiones recomendadas */}
        {recommended.length > 0 && (
          <>
            <View style={styles.recommendedHeader}>
              <View style={styles.recommendedHeaderCopy}>
                <Text style={styles.sectionHeader}>Sesiones recomendadas</Text>
                <Text style={styles.sectionDescription}>
                  Contenido basado en tu último estado de ánimo
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 15 }}>
              {recommended.map((session, index) => (
                <React.Fragment key={session.id}>
                  <RecommendedRow
                    session={session}
                    onAdd={() => addToPlaylist(playlist.id, session.id)}
                  />
                  {index < recommended.length - 1 && <View style={styles.recommendedDivider} />}
                </React.Fragment>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <SessionActionsSheet
        session={actionsSession}
        visible={actionsSession !== null}
        onClose={() => setActionsSession(null)}
      />
      <VideoActionsSheet
        video={actionsVideo}
        visible={actionsVideo !== null}
        onClose={() => setActionsVideo(null)}
      />
      <PlaylistAddSessionsSheet
        visible={addSheetVisible}
        playlistId={playlist.id}
        onClose={() => setAddSheetVisible(false)}
      />

      {/* ── Menú tres puntos ─────────────────────────────────────────────── */}
      <PlaylistMenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onShare={handleShare}
        onAddSessions={() => { setMenuVisible(false); setTimeout(() => setAddSheetVisible(true), 300); }}
        onEditOrder={() => { setMenuVisible(false); setTimeout(() => setEditOrderVisible(true), 300); }}
        onEditInfo={() => { setMenuVisible(false); setTimeout(() => setEditInfoVisible(true), 300); }}
      />

      {/* ── Editar orden (drag & drop) ───────────────────────────────────── */}
      <DragReorderModal
        visible={editOrderVisible}
        sessions={sessions}
        onClose={() => setEditOrderVisible(false)}
        onSave={(newIds) => reorderPlaylist(playlist.id, newIds)}
      />

      {/* ── Nombre y datos ───────────────────────────────────────────────── */}
      <EditInfoModal
        visible={editInfoVisible}
        playlist={playlist}
        onClose={() => setEditInfoVisible(false)}
        onSave={(name, desc) => { renamePlaylist(playlist.id, name); setPlaylistDescription(playlist.id, desc); }}
        onChangeCover={() => { setEditInfoVisible(false); setTimeout(() => setCoverModalVisible(true), 300); }}
        onDelete={handleDelete}
      />

      {/* Modal de selección de cover */}
      <CoverPickerModal
        visible={coverModalVisible}
        currentPresetId={playlist.coverPresetId}
        onClose={() => setCoverModalVisible(false)}
        onPickImage={async (closeFn) => {
          closeFn();
          await new Promise<void>((r) => setTimeout(r, 350));
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]?.uri) {
            setPlaylistCover(playlist.id, result.assets[0].uri);
          }
        }}
        onPickPreset={(preset) => {
          setPlaylistCoverPreset(playlist.id, preset.id);
        }}
      />

    </View>
  );
}

// ─── Playlist session row ──────────────────────────────────────────────────────
function PlaylistSessionRow({
  session, isPremium, isActive, isPlaying, onPlay, onActionsPress, onRemove,
}: {
  session: Session; isPremium: boolean;
  isActive: boolean; isPlaying: boolean;
  onPlay: () => void; onActionsPress: () => void; onRemove: () => void;
}) {
  const locked = !!session.isPremium && !isPremium;
  const guide = session.guideId ? getGuideById(session.guideId) : null;
  const author = guide?.name ?? "Casa del Cuenco";

  return (
    <View style={styles.sessionRow}>
      <Pressable onPress={locked ? openPremiumPlans : onPlay}
        style={({ pressed }) => [
          styles.thumbWrap,
          styles.recommendedThumbWrap,
          { opacity: pressed ? 0.75 : 1 },
        ]}>
        <Image source={session.image as never} style={styles.thumb}
          placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} contentFit="cover" />
        <SessionDurationBadge
          label={session.durationLabel}
          style={styles.thumbDurationBadge}
          textStyle={styles.thumbDurationText}
        />
      </Pressable>
      <Pressable onPress={locked ? openPremiumPlans : onPlay}
        style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.75 : 1 }]}>
        <Text style={styles.rowCategoryText} numberOfLines={1}>
          {session.categoryLabel}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.rowName, isActive && { color: "#F9F9F9" }]} numberOfLines={2}>
            {session.title}
          </Text>
          {isActive && isPlaying && <EqualizerBars color="#F9F9F9" size="sm" />}
        </View>
        <View style={styles.rowBottomMeta}>
          <Text style={styles.rowMeta} numberOfLines={1}>{author}</Text>
        </View>
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={10} style={styles.removeBtn}>
        <Feather name="x" size={16} color={MUTED} />
      </Pressable>
    </View>
  );
}

// ─── Recommended row ──────────────────────────────────────────────────────────
function RecommendedRow({ session, onAdd }: { session: Session; onAdd: () => void }) {
  const guide = session.guideId ? getGuideById(session.guideId) : null;
  const author = guide?.name ?? "Casa del Cuenco";

  return (
    <View style={styles.sessionRow}>
      <View style={[styles.thumbWrap, styles.recommendedThumbWrap]}>
        <Image source={session.image as never} style={styles.thumb}
          placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} contentFit="cover" />
        <SessionDurationBadge
          label={session.durationLabel}
          style={styles.thumbDurationBadge}
          textStyle={styles.thumbDurationText}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowCategoryText} numberOfLines={1}>
          {session.categoryLabel}
        </Text>
        <Text style={styles.rowName} numberOfLines={2}>{session.title}</Text>
        <View style={styles.rowBottomMeta}>
          <Text style={styles.rowMeta} numberOfLines={1}>{author}</Text>
        </View>
      </View>
      <Pressable onPress={onAdd} hitSlop={10} style={styles.addIconBtn}>
        <Feather name="plus" size={20} color={MUTED} />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0811" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  iconBtn: { width: 43, height: 43, alignItems: "center", justifyContent: "center" },
  playlistBackButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: 8 }],
  },
  moreMenuBtn: {
    borderRadius: 21.5,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 0,
    borderColor: "transparent",
  },
  playlistHeaderMenuButton: {
    position: "absolute",
    right: 20,
  },

  // Hero
  hero: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 16,
  },
  cover: {
    width: 146.05,
    height: 146.05,
    borderRadius: 17,
    backgroundColor: "transparent",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.20)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  coverEditBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1B060F",
  },
  heroInfo: { flex: 1, gap: 8, paddingTop: 0, justifyContent: "center" },
  playlistName: { fontFamily: "Manrope", color: "#FFFFFF", fontSize: 20, fontWeight: "700", lineHeight: 26 },
  creatorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  creatorDot: { width: 18, height: 18, borderRadius: 9 },
  creatorText: { fontFamily: "Manrope", color: MUTED, fontSize: 12 },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  statsText: { fontFamily: "Manrope", color: MUTED, fontSize: 16 },

  // Actions / Toolbar
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 4,
  },
  toolBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  playAllFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  // Píldoras Reproducir + Aleatorio
  pillsRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 11,
    marginBottom: 8,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    overflow: "hidden",
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  pillMuted: {
    backgroundColor: "rgba(249,249,249,0.7)",
  },
  pillText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
  pillOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "transparent",
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#f9f9f9",
    paddingVertical: 10.5,
    paddingHorizontal: 14,
  },
  pillOutlineText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#f9f9f9",
    letterSpacing: 0.5,
  },

  // Playlist description
  playlistDesc: {
    fontFamily: "Manrope",
    color: "#B5B0B0",
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
    padding: 0,
  },

  // Top panel (segundo fondo con fade)
  topPanel: {
    paddingBottom: 16,
  },

  // Add button
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 11,
    marginBottom: 25,
    paddingVertical: 9,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  addBtnWithSessions: {
    marginTop: 26,
  },
  addBtnText: { fontFamily: "Manrope", color: TEXT, fontSize: 14, fontWeight: "600" },

  // Section header
  recommendedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    marginTop: 5,
  },
  recommendedHeaderCopy: {
    flex: 1,
  },
  sectionHeader: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 15,
    fontWeight: "800",
  },
  sectionDescription: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  // Session rows
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  recommendedThumbWrap: {
    width: 82,
    height: 82,
  },
  recommendedDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  orderNum: { fontFamily: "Manrope", width: 20, fontSize: 13, textAlign: "center", fontWeight: "600", color: MUTED },
  thumbWrap: { width: 96, height: 96, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0 },
  thumb: { width: "100%", height: "100%" },
  thumbDurationBadge: { position: "absolute", bottom: 6, left: 6 },
  thumbDurationText: { fontSize: 11 },
  rowName: { fontFamily: "Manrope", color: "#f9f9f9", fontSize: 13, fontWeight: "600", lineHeight: 18 },
  rowCategoryText: {
    fontFamily: "Manrope",
    color: "#f4f4f4",
    fontSize: 11,
    marginBottom: 4,
  },
  rowBottomMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 5,
  },
  rowMeta: { fontFamily: "Manrope", color: "#f4f4f4", fontSize: 11, flex: 1 },
  moreBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  removeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  addIconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  // Cover glyph
  coverGlyph: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden", borderRadius: 8 },
  coverCreation: { flex: 1, overflow: "hidden", borderRadius: 8 },
  coverEmpty: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  coverPlaceholderBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  coverPlusBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
});

// ── CoverPickerModal ───────────────────────────────────────────────────────
function CoverPickerModal({
  visible,
  currentPresetId,
  onClose,
  onPickImage,
  onPickPreset,
}: {
  visible: boolean;
  currentPresetId?: string;
  onClose: () => void;
  onPickImage: (closeFn: () => void) => void;
  onPickPreset: (preset: { id: string }) => void;
}) {
  const { theme: sceneTheme } = useSceneTheme();
  const sheetColor = sceneTheme.gradient[sceneTheme.gradient.length - 1];
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const topOffset = (Platform.OS === "web" ? 67 : insets.top) + 50;
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const catalog = useCoverPresetCatalog("playlist");
  const coverScrollProgress = useScrollProgress(visible);
  const selectedPreset = catalog.find((item) => item.key === selectedPresetId || item.id === selectedPresetId);

  useEffect(() => {
    if (!visible) return;
    setSelectedPresetId(currentPresetId ?? null);
  }, [currentPresetId, visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />
      <View
        style={[
          modalStyles.sheet,
          {
            top: topOffset,
            paddingBottom: bottomPad,
            backgroundColor: sheetColor,
          },
        ]}
      >
        <LinearGradient
          colors={sceneTheme.gradient as unknown as [string, string, ...string[]]}
          locations={sceneTheme.gradientLocations}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={modalStyles.handle} />
        <View style={modalStyles.coverHeader}>
          <Text style={modalStyles.sheetTitle}>Portada</Text>
          <Pressable
            style={({ pressed }) => [
              modalStyles.coverUploadButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => { onPickImage(onClose); }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Agregar imagen desde la galería"
          >
            <Feather name="image" size={18} color={TEXT} />
          </Pressable>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar selector de portada"
            style={({ pressed }) => [
              modalStyles.coverCloseButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="x" size={22} color={GOLD} />
          </Pressable>
        </View>

        <View style={modalStyles.selectedPreviewSlot}>
           {selectedPreset && (
            <Image
              source={selectedPreset.source}
              style={modalStyles.selectedPreview}
              contentFit="cover"
              transition={IMAGE_TRANSITION}
            />
          )}
        </View>

        <View style={modalStyles.presetGrid}>
        <Animated.FlatList
          style={modalStyles.presetGrid}
          onScroll={coverScrollProgress.onScroll}
          onLayout={coverScrollProgress.onLayout}
          onContentSizeChange={coverScrollProgress.onContentSizeChange}
          scrollEventThrottle={16}
           data={catalog}
           keyExtractor={(preset) => preset.id}
          numColumns={5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={modalStyles.presetGridContent}
          columnWrapperStyle={modalStyles.presetGridRow}
           renderItem={({ item: preset }) => {
             const selected = preset.id === selectedPresetId || preset.key === selectedPresetId;
            return (
            <Pressable
              onPress={() => {
                 setSelectedPresetId(preset.key);
                 onPickPreset({ id: preset.key });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Portada: ${preset.label}`}
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                modalStyles.presetPhotoFrame,
                selected && modalStyles.presetPhotoFrameSelected,
                { opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Image
                source={preset.source}
                style={modalStyles.presetPhoto}
                contentFit="cover"
                transition={IMAGE_TRANSITION}
              />
            </Pressable>
            );
          }}
        />
        <ScrollProgressIndicator progress={coverScrollProgress} />
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    overflow: "hidden",
    backgroundColor: "#190913",
  },
  handle: {
    alignSelf: "center",
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(74,12,12,0.08)",
    marginTop: 10, marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: "Manrope",
    flex: 1,
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 0,
  },
  coverHeader: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  coverCloseButton: {
    position: "absolute",
    left: 0,
    width: 43,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 0,
    borderColor: "transparent",
  },
  selectedPreviewSlot: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedPreview: {
    width: 115.5,
    height: 115.5,
    borderRadius: 20,
  },
  coverUploadButton: {
    position: "absolute",
    right: 0,
    zIndex: 1,
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21.5,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 0,
  },
  presetGridContent: {
    paddingTop: 26,
    paddingBottom: 20,
  },
  presetGrid: {
    flex: 1,
  },
  presetGridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  presetPhotoFrame: {
    width: 63,
    height: 63,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 2,
  },
  presetPhotoFrameSelected: {
    borderColor: "#F9F9F9",
  },
  presetPhoto: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerSpacer: { width: 32 },
  headerTitle: {
    fontFamily: "Manrope",
    flex: 1,
    textAlign: "center",
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  headerClose: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  creationItem: {
    flex: 1,
    alignItems: "center",
    margin: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  creationThumb: {
    width: 170,
    height: 170,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  creationName: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 4,
  },
});

// ── PlaylistMenuSheet (tres puntos) ────────────────────────────────────────
function PlaylistMenuSheet({
  visible, onClose, onShare, onAddSessions, onEditOrder, onEditInfo,
}: {
  visible: boolean; onClose: () => void; onShare: () => void;
  onAddSessions: () => void; onEditOrder: () => void; onEditInfo: () => void;
}) {
  const { theme: sceneTheme } = useSceneTheme();
  const menuBackgroundColor =
    sceneTheme.gradient[2] ??
    sceneTheme.gradient[sceneTheme.gradient.length - 1];
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={menuSt.backdrop} onPress={onClose} />
      <View
        style={[
          menuSt.sheet,
          { paddingBottom: bottomPad + 8, backgroundColor: menuBackgroundColor },
        ]}
      >
        <View style={menuSt.handle} />
        {([
          { icon: "share", label: "Compartir", action: () => { onClose(); onShare(); } },
          { icon: "plus-circle", label: "Agregar a esta playlist", action: onAddSessions },
          { icon: "list", label: "Editar Playlist", action: onEditOrder },
          { icon: "edit-2", label: "Nombre y datos", action: onEditInfo },
        ] as { icon: React.ComponentProps<typeof Feather>["name"]; label: string; action: () => void }[]).map(({ icon, label, action }) => (
          <Pressable key={label} style={({ pressed }) => [menuSt.row, { opacity: pressed ? 0.7 : 1 }]} onPress={action}>
            <Feather name={icon} size={20} color={GOLD} />
            <Text style={menuSt.rowText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const menuSt = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingHorizontal: 20, overflow: "hidden",
  },
  handle: {
    alignSelf: "center", width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)", marginTop: 10, marginBottom: 8,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.35)",
  },
  rowText: { fontFamily: "Manrope", color: TEXT, fontSize: 15, fontWeight: "600" },
});

// ── DragReorderModal ────────────────────────────────────────────────────────
const DRAG_ROW_H = 68;

// ─ DragHandle: PanResponder propio por handle para capturar el gesto
//   confiablemente dentro del ScrollView.
function DragHandle({
  idx, isDragging,
  onDragStart, onDragMove, onDragEnd,
}: {
  idx: number; isDragging: boolean;
  onDragStart: (idx: number, pageY: number) => void;
  onDragMove: (dy: number) => void;
  onDragEnd: (dy: number) => void;
}) {
  // Refs estables para evitar closures obsoletos dentro del PanResponder
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const startRef = useRef(onDragStart);
  startRef.current = onDragStart;
  const moveRef = useRef(onDragMove);
  moveRef.current = onDragMove;
  const endRef = useRef(onDragEnd);
  endRef.current = onDragEnd;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        startRef.current(idxRef.current, e.nativeEvent.pageY);
      },
      onPanResponderMove: (_, gs) => {
        moveRef.current(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        endRef.current(gs.dy);
      },
      onPanResponderTerminate: () => {
        endRef.current(0);
      },
    })
  ).current;

  return (
    <View style={dreSt.dragHandle} {...pan.panHandlers}>
      <Feather name="menu" size={22} color={isDragging ? "#F9F9F9" : MUTED} />
    </View>
  );
}

function DragReorderModal({ visible, sessions, onClose, onSave }: {
  visible: boolean; sessions: Session[]; onClose: () => void;
  onSave: (newIds: string[]) => void;
}) {
  const { theme: sceneTheme } = useSceneTheme();
  const playlistCatalog = useCoverPresetCatalog("playlist");
  const BG_GRADIENT = sceneTheme.gradient;
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const dragIdxRef = useRef<number | null>(null);
  const draftIdsRef = useRef<string[]>([]);
  draftIdsRef.current = draftIds;

  useEffect(() => {
    if (visible) { setDraftIds(sessions.map((s) => s.id)); }
  }, [visible, sessions]);

  const idMap = useMemo(() => {
    const m: Record<string, Session> = {};
    sessions.forEach((s) => { m[s.id] = s; });
    return m;
  }, [sessions]);

  const handleDragStart = useCallback((idx: number, _pageY: number) => {
    dragIdxRef.current = idx;
    setDragIdx(idx);
    setOverIdx(idx);
  }, []);

  const handleDragMove = useCallback((dy: number) => {
    const idx = dragIdxRef.current;
    if (idx === null) return;
    const n = draftIdsRef.current.length;
    const newOver = Math.max(0, Math.min(n - 1, Math.round(idx + dy / DRAG_ROW_H)));
    setOverIdx(newOver);
  }, []);

  const handleDragEnd = useCallback((dy: number) => {
    const idx = dragIdxRef.current;
    if (idx === null) return;
    const n = draftIdsRef.current.length;
    const to = Math.max(0, Math.min(n - 1, Math.round(idx + dy / DRAG_ROW_H)));
    if (to !== idx) {
      setDraftIds((prev) => {
        const next = [...prev];
        const [item] = next.splice(idx, 1);
        next.splice(to, 0, item);
        return next;
      });
    }
    dragIdxRef.current = null;
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={dreSt.backdrop}>
        <View style={[dreSt.sheet, { paddingBottom: bottomPad }]}>
          <LinearGradient colors={[...BG_GRADIENT]} style={StyleSheet.absoluteFill} />
          <View style={dreSt.handle} />
          <View style={dreSt.header}>
            <Pressable onPress={onClose} hitSlop={12} style={dreSt.closeBtn}>
              <Feather name="x" size={20} color={MUTED} />
            </Pressable>
            <Text style={dreSt.title}>Editar Playlist</Text>
            <View style={{ width: 32 }} />
          </View>
          <Text style={dreSt.hint}>Toca y arrastra ≡ para reordenar</Text>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={dreSt.listContent}
            scrollEnabled={dragIdx === null}
            showsVerticalScrollIndicator={false}
          >
            {draftIds.map((sid, idx) => {
              const session = idMap[sid];
              if (!session) return null;
              const isDragging = dragIdx === idx;
              const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
              const showAbove = isOver && dragIdx !== null && dragIdx > idx;
              const showBelow = isOver && dragIdx !== null && dragIdx < idx;
              return (
                <View key={sid} style={{ minHeight: DRAG_ROW_H }}>
                  {showAbove && <View style={dreSt.dropLine} />}
                  <View style={[dreSt.row, isDragging && dreSt.rowActive]}>
                    <DragHandle
                      idx={idx}
                      isDragging={isDragging}
                      onDragStart={handleDragStart}
                      onDragMove={handleDragMove}
                      onDragEnd={handleDragEnd}
                    />
                    <Image source={session.image as never} style={dreSt.thumb} contentFit="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={dreSt.rowTitle} numberOfLines={2}>{session.title}</Text>
                    </View>
                  </View>
                  {showBelow && <View style={dreSt.dropLine} />}
                </View>
              );
            })}
          </ScrollView>
          <Pressable
            style={({ pressed }) => [dreSt.saveBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => { onSave(draftIds); onClose(); }}
          >
            <Text style={dreSt.saveBtnText}>Guardar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const dreSt = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    height: "82%", borderTopLeftRadius: 22, borderTopRightRadius: 22,
    overflow: "hidden", paddingHorizontal: 0,
  },
  handle: {
    alignSelf: "center", width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(212,175,55,0.25)", marginTop: 10,
  },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: { width: 43, height: 43, borderRadius: 21.5, borderWidth: 0, borderColor: "transparent", backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Manrope", flex: 1, textAlign: "center", color: TEXT, fontSize: 16, fontWeight: "700" },
  hint: { fontFamily: "Manrope", color: MUTED, fontSize: 12, textAlign: "center", marginBottom: 4, paddingHorizontal: 20 },
  listContent: {
    paddingTop: 20,
  },
  row: {
    height: DRAG_ROW_H, flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.30)",
  },
  rowActive: { backgroundColor: "rgba(255,255,255,0.1)" },
  dragHandle: { width: 56, height: DRAG_ROW_H, alignItems: "center", justifyContent: "center" },
  thumb: { width: 44, height: 44, borderRadius: 6 },
  rowTitle: { fontFamily: "Manrope", color: TEXT, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  dropLine: { height: 3, backgroundColor: GOLD, marginHorizontal: 16, borderRadius: 2 },
  saveBtn: {
    margin: 16, height: 50, borderRadius: 14, backgroundColor: GOLD,
    alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { fontFamily: "Manrope", color: "#1B060F", fontSize: 15, fontWeight: "700" },
});

// ── EditInfoModal (Nombre y datos) ─────────────────────────────────────────
function EditInfoModal({ visible, playlist, onClose, onSave, onChangeCover, onDelete }: {
  visible: boolean;
  playlist: { id: string; name: string; description?: string; coverUri?: string; coverPresetId?: string; coverType?: string };
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  onChangeCover: () => void;
  onDelete: () => void;
}) {
  const { theme: sceneTheme } = useSceneTheme();
  const playlistCatalog = useCoverPresetCatalog("playlist");
  const BG_GRADIENT = sceneTheme.gradient;
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (visible) { setName(playlist.name); setDesc(playlist.description ?? ""); }
  }, [visible, playlist.name, playlist.description]);

  const hasChanges = name !== playlist.name || desc !== (playlist.description ?? "");
  const saveDisabled = !hasChanges || !name.trim();
  const requestClose = (close = onClose) => {
    if (!hasChanges) {
      close();
      return;
    }
    Alert.alert(
      "¿Estás seguro/a de que quieres descargar los cambios?",
      undefined,
      [
        { text: "Continuar editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: close },
      ],
      { cancelable: false },
    );
  };

  const handleSave = () => {
    if (saveDisabled) return;
    onSave(name.trim(), desc.trim());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => requestClose()}>
      <View style={eiSt.backdrop}>
        <View style={[eiSt.sheet, { paddingBottom: bottomPad }]}>
          <LinearGradient colors={[...BG_GRADIENT]} style={StyleSheet.absoluteFill} />
          <View style={eiSt.handle} />
          <View style={eiSt.header}>
            <Pressable onPress={() => requestClose()} hitSlop={12} style={eiSt.closeBtn}>
              <Feather name="x" size={20} color={MUTED} />
            </Pressable>
            <Text style={eiSt.title}>Nombre y datos</Text>
            <Pressable
              onPress={handleSave}
              disabled={saveDisabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: saveDisabled }}
              style={({ pressed }) => [
                eiSt.saveButton,
                saveDisabled && eiSt.saveButtonDisabled,
                !saveDisabled && pressed && { opacity: 0.86 },
              ]}
            >
              <Text style={[eiSt.saveText, saveDisabled && eiSt.saveTextDisabled]}>Guardar</Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Portada */}
            <Pressable style={({ pressed }) => [eiSt.coverRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => requestClose(onChangeCover)}>
              <View style={eiSt.coverThumb}>
                {playlist.coverPresetId && playlistCatalog.find((item) => item.key === playlist.coverPresetId || item.id === playlist.coverPresetId) ? (
                  <Image source={playlistCatalog.find((item) => item.key === playlist.coverPresetId || item.id === playlist.coverPresetId)?.source} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : playlist.coverUri ? (
                  <Image source={{ uri: playlist.coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Feather name="music" size={24} color={MUTED} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={eiSt.coverLabel}>Foto de portada</Text>
                <Text style={eiSt.coverSub}>Toca para cambiar</Text>
              </View>
              <Feather name="chevron-right" size={18} color={MUTED} />
            </Pressable>

            {/* Nombre */}
            <Text style={eiSt.fieldLabel}>Nombre</Text>
            <TextInput
              style={eiSt.input}
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              maxLength={80}
            />

            {/* Descripción */}
            <Text style={eiSt.fieldLabel}>Descripción</Text>
            <TextInput
              style={[eiSt.input, eiSt.inputMulti]}
              value={desc}
              onChangeText={setDesc}
              multiline
              numberOfLines={3}
              maxLength={300}
            />

            {/* Eliminar */}
            <Pressable
              style={({ pressed }) => [eiSt.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => requestClose(() => { onClose(); setTimeout(onDelete, 300); })}
            >
              <Feather name="trash-2" size={16} color="#E05252" />
              <Text style={eiSt.deleteBtnText}>Eliminar playlist</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const eiSt = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    height: "80%", borderTopLeftRadius: 22, borderTopRightRadius: 22,
    overflow: "hidden", paddingHorizontal: 20,
  },
  handle: {
    alignSelf: "center", width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(212,175,55,0.25)", marginTop: 10,
  },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  closeBtn: { width: 43, height: 43, borderRadius: 21.5, borderWidth: 0, borderColor: "transparent", backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Manrope", flex: 1, textAlign: "center", color: TEXT, fontSize: 16, fontWeight: "700" },
  saveButton: {
    height: 43, paddingHorizontal: 18, marginLeft: "auto", borderRadius: 999,
    backgroundColor: "#F9F9F9", alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  saveButtonDisabled: { backgroundColor: "rgba(249,249,249,0.4)" },
  saveText: { fontFamily: "Manrope", color: "#060A0F", fontSize: 16, fontWeight: "700" },
  saveTextDisabled: { color: "rgba(249,249,249,0.8)" },
  coverRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14, marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  coverThumb: {
    width: 52, height: 52, borderRadius: 8, overflow: "hidden",
    backgroundColor: "rgba(212,175,55,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  coverLabel: { fontFamily: "Manrope", color: TEXT, fontSize: 14, fontWeight: "600" },
  coverSub: { fontFamily: "Manrope", color: MUTED, fontSize: 12, marginTop: 2 },
  fieldLabel: { fontFamily: "Manrope630", color: MUTED, fontSize: 15, marginTop: 16, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    fontFamily: "Manrope",
    backgroundColor: "rgba(0,0,0,0.16)", borderRadius: 10, padding: 12,
    color: TEXT, fontSize: 15,
    borderWidth: 0,
  },
  inputMulti: { height: 90, textAlignVertical: "top" },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 32, marginBottom: 8, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(224,82,82,0.35)",
    backgroundColor: "rgba(224,82,82,0.08)",
  },
  deleteBtnText: { fontFamily: "Manrope", color: "#E05252", fontSize: 15, fontWeight: "600" },
});

