import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
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
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { CreationCoverPreview } from "@/components/CreationCoverPreview";
import { EqualizerBars } from "@/components/EqualizerBars";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type Session } from "@/data/sessions";
import { getGuideById } from "@/data/guides";
import { getArtist } from "@/data/artists";
import { type GeometryId } from "@/data/geometries";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";

const BG_GRADIENT = ["#2E0510", "#160108"] as const;
const GOLD = "#D4AF37";
const TEXT = "#F4DAD5";
const MUTED = "rgba(242,231,228,0.45)";
const DEFAULT_PANEL_BG = "rgba(74,12,12,0.28)";

const DEFAULT_ACCENT = ""; // sentinel = borgoña degradado por defecto
const ACCENT_PALETTE: readonly string[] = [
  DEFAULT_ACCENT, // borgoña degradado (por defecto)
  "#7B2D52", // borgoña
  "#2C4A8C", // azul marino
  "#2C6B4A", // verde
  "#6B2C8C", // violeta
  "#8C4A2C", // terra
  "#2C6B7B", // teal
  "#8C7B2C", // dorado
  "#4A1C8C", // índigo
];

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

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { playlists, deletePlaylist, removeFromPlaylist, addToPlaylist, renamePlaylist, setPlaylistDescription, reorderPlaylist, setPlaylistCover, setPlaylistCoverColor, setPlaylistCoverGeometry, setPlaylistCoverCreation } = useFoldersPlaylists();
  const { playSession, pauseResume, isPlaying, currentSession, stop } = usePlayer();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ¿Está sonando una sesión de ESTA playlist?
  const playlistSessionIds = playlists.find((p) => p.id === id)?.sessionIds ?? [];
  const miniPlayerVisible = !!currentSession && playlistSessionIds.includes(currentSession.id);
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
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editOrderVisible, setEditOrderVisible] = useState(false);
  const [editInfoVisible, setEditInfoVisible] = useState(false);
  const [coverModalVisible, setCoverModalVisible] = useState(false);
  const [pendingCover, setPendingCover] = useState<
    | { type: "image"; uri: string }
    | { type: "geometry"; geoId: string }
    | { type: "creation"; creationId: string }
    | null
  >(null);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState<string>(DEFAULT_ACCENT);

  const playlist = playlists.find((p) => p.id === id);

  const panelColor = playlist?.coverColor
    ? buildPanelColor(playlist.coverColor)
    : DEFAULT_PANEL_BG;

  const sessions = useMemo(
    () =>
      (playlist?.sessionIds ?? [])
        .map((sid) => SESSIONS.find((s) => s.id === sid))
        .filter(Boolean) as Session[],
    [playlist?.sessionIds]
  );

  const recommended = useMemo(() => {
    if (!playlist) return [];
    const inPl = new Set(playlist.sessionIds);
    return shuffle(SESSIONS.filter((s) => !inPl.has(s.id))).slice(0, 12);
  }, [playlist]);

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
          <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
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
        { text: "Eliminar", style: "destructive", onPress: () => { deletePlaylist(playlist.id); router.back(); } },
      ]
    );
  };

  const handlePlayAll = () => {
    const first = sessions.find((s) => !s.isPremium || isPremium);
    if (!first) return;
    playSession(first);
  };

  const handleShuffle = () => {
    const available = sessions.filter((s) => !s.isPremium || isPremium);
    if (!available.length) return;
    const random = available[Math.floor(Math.random() * available.length)];
    playSession(random);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Escucha mi playlist "${playlist.name}" en Resonancia 🎵` });
    } catch (_) {}
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={playlist.coverColor ? [panelColor, "#100105"] as const : BG_GRADIENT}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 32 + (miniPlayerVisible ? MINI_H : 0) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Relleno para el rubber-band de iOS: invisible en reposo, muestra panelColor al hacer pull-down */}
        <View style={{ position: "absolute", top: -600, left: 0, right: 0, height: 600, backgroundColor: panelColor }} />

        {/* Header — scrollea con el contenido (sin sticky) */}
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: panelColor }]}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={22} color={TEXT} />
          </Pressable>
        </View>

        {/* ── Panel superior (segundo fondo con fade) ─────────────────────── */}
        <View style={styles.topPanel}>
          <LinearGradient
            colors={[panelColor, "transparent"]}
            style={[StyleSheet.absoluteFill, { bottom: -140 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Cover art — tap para elegir foto o geometría */}
          <Pressable style={styles.cover} onPress={() => setCoverModalVisible(true)}>
            {playlist.coverType === "geometrix" && playlist.coverGeometryId ? (
              <View style={[styles.coverGlyph, { backgroundColor: panelColor }]}>
                <SacredGlyph
                  id={playlist.coverGeometryId as GeometryId}
                  color={GOLD}
                  size={142}
                  strokeWidth={1.2}
                  opacity={1}
                />
              </View>
            ) : playlist.coverType === "creation" && playlist.coverCreationId ? (
              <View style={styles.coverCreation}>
                <CreationCoverPreview creationId={playlist.coverCreationId} size={110} />
              </View>
            ) : playlist.coverUri ? (
              <Image
                source={{ uri: playlist.coverUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <View style={styles.coverEmpty}>
                <Feather name="music" size={40} color={MUTED} />
                {/* Badge "+" en esquina inferior derecha */}
                <View style={styles.coverPlusBadge}>
                  <GoldGradientFill />
                  <Feather name="plus" size={14} color="#FFFFFF" />
                </View>
              </View>
            )}
          </Pressable>

          {/* Info */}
          <View style={styles.heroInfo}>
            <Text style={styles.playlistName} numberOfLines={3}>{playlist.name}</Text>
            {!!playlist.description && (
              <Text style={styles.playlistDesc} numberOfLines={2}>{playlist.description}</Text>
            )}
            <View style={styles.creatorRow}>
              <GoldGradient style={styles.creatorDot} />
              <Text style={styles.creatorText}>Casa del Cuenco</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Feather name="globe" size={13} color={MUTED} />
          <Text style={styles.statsText}>{totalMin} min</Text>
        </View>

        {/* ── Toolbar Spotify-style ─────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          {/* Descargar */}
          <Pressable style={({ pressed }) => [styles.toolBtn, { opacity: pressed ? 0.6 : 1 }]} hitSlop={10}>
            <Feather name="download" size={22} color={MUTED} />
          </Pressable>
          {/* Compartir */}
          <Pressable style={({ pressed }) => [styles.toolBtn, { opacity: pressed ? 0.6 : 1 }]} hitSlop={10} onPress={handleShare}>
            <Feather name="share" size={22} color={MUTED} />
          </Pressable>
          {/* Tres puntos */}
          <Pressable style={({ pressed }) => [styles.toolBtn, { opacity: pressed ? 0.6 : 1 }]} hitSlop={10} onPress={() => setMenuVisible(true)}>
            <Feather name="more-horizontal" size={22} color={MUTED} />
          </Pressable>
          {/* Spacer */}
          <View style={{ flex: 1 }} />
          {/* Modo aleatorio */}
          <Pressable style={({ pressed }) => [styles.toolBtn, { opacity: pressed ? 0.6 : 1 }]} hitSlop={10} onPress={handleShuffle}>
            <Feather name="shuffle" size={22} color={MUTED} />
          </Pressable>
          {/* Play / Pause */}
          {sessions.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.playAllFab, { opacity: pressed ? 0.8 : 1 }]}
              onPress={handleTogglePlay}
            >
              <GoldGradientFill />
              <Feather
                name={miniPlayerVisible && displayIsPlaying ? "pause" : "play"}
                size={20}
                color="#1B060F"
              />
            </Pressable>
          )}
        </View>

        </View>{/* fin topPanel */}

        {/* Sessions list */}
        {sessions.map((session) => (
          <PlaylistSessionRow
            key={session.id}
            session={session}
            isPremium={isPremium}
            isActive={currentSession?.id === session.id}
            isPlaying={displayIsPlaying}
            onPlay={() => playSession(session)}
            onActionsPress={() => setActionsSession(session)}
            onRemove={() => removeFromPlaylist(playlist.id, session.id)}
          />
        ))}

        {/* + Agregar a esta playlist */}
        <Pressable
          style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={() => setAddSheetVisible(true)}
        >
          <Feather name="plus" size={16} color={TEXT} style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Agregar a esta Playlist</Text>
        </Pressable>

        {/* Sesiones recomendadas */}
        {recommended.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Sesiones recomendadas</Text>
            {recommended.map((session) => (
              <RecommendedRow
                key={session.id}
                session={session}
                onAdd={() => addToPlaylist(playlist.id, session.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <SessionActionsSheet
        session={actionsSession}
        visible={actionsSession !== null}
        onClose={() => setActionsSession(null)}
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
            setPendingCover({ type: "image", uri: result.assets[0].uri });
            setSelectedAccent(playlist.coverColor ?? DEFAULT_ACCENT);
            setColorPickerVisible(true);
          }
        }}
        onPickGeometry={(geoId) => {
          setPendingCover({ type: "geometry", geoId });
          setSelectedAccent(playlist.coverColor ?? DEFAULT_ACCENT);
          setColorPickerVisible(true);
        }}
        onPickCreation={(cid) => {
          setPendingCover({ type: "creation", creationId: cid });
          setSelectedAccent(playlist.coverColor ?? DEFAULT_ACCENT);
          setColorPickerVisible(true);
        }}
      />

      {/* ── Color picker de encabezado ──────────────────────────────────────── */}
      <Modal
        visible={colorPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setColorPickerVisible(false)}
      >
        <View style={cpStyles.backdrop}>
          <View style={cpStyles.sheet}>
            <Text style={cpStyles.title}>Fondo de tu Playlist</Text>
            <Text style={cpStyles.sub}>Elige el color que resuena con tus canciones</Text>

            {/* Preview del header con el color seleccionado */}
            <View style={[cpStyles.preview, { backgroundColor: buildPanelColor(selectedAccent) }]}>
              {pendingCover?.type === "image" && (
                <Image source={{ uri: pendingCover.uri }} style={cpStyles.previewImg} contentFit="cover" />
              )}
              {pendingCover?.type === "geometry" && (
                <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", opacity: 0.35 }]}>
                  <SacredGlyph id={pendingCover.geoId as GeometryId} color={GOLD} size={56} strokeWidth={1.2} opacity={1} />
                </View>
              )}
              {pendingCover?.type === "creation" && (
                <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", opacity: 0.35 }]}>
                  <CreationCoverPreview creationId={pendingCover.creationId} size={52} />
                </View>
              )}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: buildPanelColor(selectedAccent), opacity: 0.7 }]} />
              <Text style={cpStyles.previewLabel}>Vista previa</Text>
            </View>

            {/* Paleta de colores */}
            <View style={cpStyles.palette}>
              {ACCENT_PALETTE.map((hex) => (
                <Pressable
                  key={hex === DEFAULT_ACCENT ? "__default__" : hex}
                  onPress={() => setSelectedAccent(hex)}
                  style={[
                    cpStyles.swatch,
                    { backgroundColor: hex === DEFAULT_ACCENT ? "#2E0510" : hex },
                    selectedAccent === hex && cpStyles.swatchSelected,
                  ]}
                >
                  {hex === DEFAULT_ACCENT && (
                    <View style={cpStyles.swatchDefaultStripe} />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Botones */}
            <View style={cpStyles.actions}>
              <Pressable
                style={cpStyles.btnCancel}
                onPress={() => setColorPickerVisible(false)}
              >
                <Text style={cpStyles.btnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={cpStyles.btnConfirm}
                onPress={() => {
                  if (pendingCover?.type === "image") {
                    setPlaylistCover(playlist.id, pendingCover.uri);
                  } else if (pendingCover?.type === "geometry") {
                    setPlaylistCoverGeometry(playlist.id, pendingCover.geoId);
                  } else if (pendingCover?.type === "creation") {
                    setPlaylistCoverCreation(playlist.id, pendingCover.creationId);
                  }
                  if (pendingCover) setPlaylistCoverColor(playlist.id, selectedAccent === DEFAULT_ACCENT ? "" : selectedAccent);
                  setColorPickerVisible(false);
                  setPendingCover(null);
                }}
              >
                <Text style={cpStyles.btnConfirmText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Playlist MiniPlayer ──────────────────────────────────────────────── */}
      {miniPlayerVisible && currentSession && (
        <View
          style={[
            mpSt.bar,
            { bottom: tabBarH },
          ]}
        >
          <Pressable
            onPress={stop}
            hitSlop={12}
            style={({ pressed }) => [mpSt.closeBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="x" size={18} color={MUTED} />
          </Pressable>
          <Image
            source={currentSession.image as never}
            style={mpSt.cover}
            contentFit="cover"
          />
          <View style={mpSt.info}>
            <Text style={mpSt.title} numberOfLines={1}>{currentSession.title}</Text>
            <Text style={mpSt.artist} numberOfLines={1}>
              {currentSession.guideId
                ? (getGuideById(currentSession.guideId)?.name ?? "Casa del Cuenco")
                : currentSession.artistId
                  ? (getArtist(currentSession.artistId)?.name ?? "Resonancia")
                  : "Casa del Cuenco"}
            </Text>
          </View>
          <Pressable
            onPress={handleTogglePlay}
            hitSlop={12}
            style={({ pressed }) => [mpSt.playBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather
              name={displayIsPlaying ? "pause" : "play"}
              size={26}
              color={GOLD}
            />
          </Pressable>
        </View>
      )}
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
      <Pressable onPress={locked ? () => router.push("/membresia" as never) : onPlay}
        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}>
        <Image source={session.image as never} style={styles.thumb}
          placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} contentFit="cover" />
      </Pressable>
      <Pressable onPress={locked ? () => router.push("/membresia" as never) : onPlay}
        style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.75 : 1 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.rowName, isActive && { color: "#D4AF37" }]} numberOfLines={2}>
            {session.title}
          </Text>
          {isActive && isPlaying && <EqualizerBars color="#D4AF37" size="sm" />}
        </View>
        <Text style={styles.rowMeta}>{author} · {session.durationLabel}</Text>
      </Pressable>
      <Pressable onPress={onActionsPress} hitSlop={10} style={styles.moreBtn}>
        <Feather name="more-vertical" size={18} color={MUTED} />
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
      <Image source={session.image as never} style={styles.thumb}
        placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={2}>{session.title}</Text>
        <Text style={styles.rowMeta}>{author} · {session.durationLabel}</Text>
      </View>
      <Pressable onPress={onAdd} hitSlop={10} style={styles.addIconBtn}>
        <Feather name="plus-circle" size={24} color={MUTED} />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#160108" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  // Hero
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 16,
  },
  cover: {
    width: 110,
    height: 110,
    borderRadius: 8,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.20)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroInfo: { flex: 1, gap: 8, paddingTop: 4 },
  playlistName: { color: "#FFFFFF", fontSize: 20, fontWeight: "400", lineHeight: 26 },
  creatorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  creatorDot: { width: 18, height: 18, borderRadius: 9 },
  creatorText: { color: MUTED, fontSize: 12 },

  // Stats
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  statsText: { color: MUTED, fontSize: 12 },

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

  // Playlist description
  playlistDesc: { color: MUTED, fontSize: 13, lineHeight: 18 },

  // Top panel (segundo fondo con fade)
  topPanel: {
    paddingBottom: 16,
  },

  // Add button
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 40,
    marginTop: 4,
    marginBottom: 20,
    paddingVertical: 9,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  addBtnText: { color: TEXT, fontSize: 14, fontWeight: "600" },

  // Section header
  sectionHeader: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    marginTop: -10,
  },

  // Session rows
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.30)",
  },
  orderNum: { width: 20, fontSize: 13, textAlign: "center", fontWeight: "600", color: MUTED },
  thumb: { width: 52, height: 52, borderRadius: 8 },
  rowName: { color: TEXT, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  rowMeta: { color: MUTED, fontSize: 12, marginTop: 2 },
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
  },
  coverPlusBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1B060F",
  },
});

// ── CoverPickerModal ───────────────────────────────────────────────────────
function CoverPickerModal({
  visible,
  onClose,
  onPickImage,
  onPickGeometry,
  onPickCreation,
}: {
  visible: boolean;
  onClose: () => void;
  onPickImage: (closeFn: () => void) => void;
  onPickGeometry: (geoId: string) => void;
  onPickCreation: (creationId: string) => void;
}) {
  const [showGeometries, setShowGeometries] = useState(false);
  const { creations } = useGeometrixCreations();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const creationItems = useMemo(
    () => creations.map((c) => ({ id: c.id, name: c.name, creation: c })),
    [creations]
  );

  if (showGeometries) {
    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => { setShowGeometries(false); onClose(); }}>
        <Pressable style={modalStyles.backdrop} onPress={() => { setShowGeometries(false); onClose(); }} />
        <View style={[modalStyles.sheet, { paddingBottom: bottomPad, height: "78%" }]}>
          <LinearGradient colors={["#1A1030", "#06070F"]} style={StyleSheet.absoluteFill} />
          <View style={modalStyles.handle} />
          <View style={modalStyles.headerRow}>
            <Pressable onPress={() => setShowGeometries(false)} hitSlop={12} style={modalStyles.headerClose}>
              <Feather name="arrow-left" size={20} color={MUTED} />
            </Pressable>
            <Text style={modalStyles.headerTitle}>Mis Geometrix</Text>
            <View style={modalStyles.headerSpacer} />
          </View>
          <FlatList
            data={creationItems}
            keyExtractor={(c) => c.id}
            numColumns={2}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 12 }}
            ListEmptyComponent={
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Text style={{ color: MUTED, fontSize: 14 }}>No tienes creaciones aún</Text>
                <Text style={{ color: MUTED, fontSize: 12, marginTop: 6, opacity: 0.7 }}>Ve a Geometrix y crea una</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [modalStyles.creationItem, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => { onPickCreation(item.id); setShowGeometries(false); onClose(); }}
              >
                <View style={modalStyles.creationThumb}>
                  <CreationCoverPreview creationId={item.id} size={100} />
                </View>
                <Text style={modalStyles.creationName} numberOfLines={1}>{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />
      <View style={[modalStyles.sheet, { paddingBottom: bottomPad }]}>
        <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />
        <View style={modalStyles.handle} />
        <Text style={modalStyles.sheetTitle}>Foto de la playlist</Text>
        <Pressable
          style={({ pressed }) => [modalStyles.sheetRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => { onPickImage(onClose); }}
        >
          <Feather name="image" size={22} color={GOLD} />
          <Text style={modalStyles.sheetRowText}>Foto de la galería</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [modalStyles.sheetRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => setShowGeometries(true)}
        >
          <Feather name="hexagon" size={22} color={GOLD} />
          <Text style={modalStyles.sheetRowText}>Mis Geometrix</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    overflow: "hidden",
    backgroundColor: "#160108",
  },
  handle: {
    alignSelf: "center",
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(74,12,12,0.08)",
    marginTop: 10, marginBottom: 4,
  },
  sheetTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  sheetRowText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerSpacer: { width: 32 },
  headerTitle: {
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
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  creationName: {
    color: TEXT,
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 4,
  },
});

const cpStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1E0810",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  sub: {
    color: MUTED,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
  },
  preview: {
    height: 72,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  previewImg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  previewLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    letterSpacing: 1,
    zIndex: 1,
  },
  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    marginBottom: 28,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  swatchDefaultStripe: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 14,
    backgroundColor: "#160108",
    opacity: 0.45,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelText: {
    color: MUTED,
    fontSize: 15,
    fontWeight: "600",
  },
  btnConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  btnConfirmText: {
    color: "#1B060F",
    fontSize: 15,
    fontWeight: "700",
  },
});

// ── PlaylistMenuSheet (tres puntos) ────────────────────────────────────────
function PlaylistMenuSheet({
  visible, onClose, onShare, onAddSessions, onEditOrder, onEditInfo,
}: {
  visible: boolean; onClose: () => void; onShare: () => void;
  onAddSessions: () => void; onEditOrder: () => void; onEditInfo: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={menuSt.backdrop} onPress={onClose} />
      <View style={[menuSt.sheet, { paddingBottom: bottomPad + 8 }]}>
        <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />
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
    backgroundColor: "rgba(212,175,55,0.25)", marginTop: 10, marginBottom: 8,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.35)",
  },
  rowText: { color: TEXT, fontSize: 15, fontWeight: "600" },
});

// ── DragReorderModal ────────────────────────────────────────────────────────
const DRAG_ROW_H = 68;

function DragReorderModal({ visible, sessions, onClose, onSave }: {
  visible: boolean; sessions: Session[]; onClose: () => void;
  onSave: (newIds: string[]) => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // Sync refs — gestures read these, React state drives the UI
  const dragIdxRef = useRef<number | null>(null);
  const draftIdsRef = useRef<string[]>([]);
  draftIdsRef.current = draftIds;
  const scrollOffsetRef = useRef(0);
  // pageY of the list container on screen (measured on layout, re-measured on scroll)
  const containerRef = useRef<View>(null);
  const containerTopRef = useRef(0);

  useEffect(() => {
    if (visible) { setDraftIds(sessions.map((s) => s.id)); }
  }, [visible, sessions]);

  const idMap = useMemo(() => {
    const m: Record<string, Session> = {};
    sessions.forEach((s) => { m[s.id] = s; });
    return m;
  }, [sessions]);

  // dragStartPageY: absolute pageY at the moment the handle was pressed.
  // This is the ground truth for "which row was grabbed" — computed from onTouchStart
  // on each individual handle icon (not from the container PanResponder, where
  // locationY is relative to the touched element, not the container).
  const dragStartPageYRef = useRef(0);

  // Container PanResponder: only takes the gesture when a drag is already in progress.
  // The handle's onTouchStart sets dragIdxRef/dragStartPageYRef before any move event.
  const pan = useRef(
    PanResponder.create({
      // Only offer to become responder if user has already pressed a handle
      onMoveShouldSetPanResponder: () => dragIdxRef.current !== null,
      onMoveShouldSetPanResponderCapture: () => dragIdxRef.current !== null,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => { /* dragIdx already set by handle onTouchStart */ },
      onPanResponderMove: (e) => {
        const idx = dragIdxRef.current;
        if (idx === null) return;
        const n = draftIdsRef.current.length;
        const dy = e.nativeEvent.pageY - dragStartPageYRef.current;
        const newOver = Math.max(0, Math.min(n - 1, Math.round(idx + dy / DRAG_ROW_H)));
        setOverIdx(newOver);
      },
      onPanResponderRelease: (e) => {
        const idx = dragIdxRef.current;
        if (idx === null) return;
        const n = draftIdsRef.current.length;
        const dy = e.nativeEvent.pageY - dragStartPageYRef.current;
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
      },
      onPanResponderTerminate: () => {
        dragIdxRef.current = null;
        setDragIdx(null);
        setOverIdx(null);
      },
    })
  ).current;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={dreSt.backdrop}>
        <View style={[dreSt.sheet, { paddingBottom: bottomPad }]}>
          <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />
          <View style={dreSt.handle} />
          <View style={dreSt.header}>
            <Pressable onPress={onClose} hitSlop={12} style={dreSt.closeBtn}>
              <Feather name="x" size={20} color={MUTED} />
            </Pressable>
            <Text style={dreSt.title}>Editar Playlist</Text>
            <View style={{ width: 32 }} />
          </View>
          <Text style={dreSt.hint}>Toca y arrastra ≡ para reordenar</Text>
          {/* PanResponder container — wraps the scroll list */}
          <View
            ref={containerRef}
            style={{ flex: 1 }}
            onLayout={() => {
              containerRef.current?.measure((_x, _y, _w, _h, _px, py) => {
                containerTopRef.current = py;
              });
            }}
            {...pan.panHandlers}
          >
            <ScrollView
              style={{ flex: 1 }}
              scrollEnabled={dragIdx === null}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
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
                      {/* Handle zone: onTouchStart records which row & absolute pageY */}
                      <View
                        style={dreSt.dragHandle}
                        onTouchStart={(e) => {
                          dragIdxRef.current = idx;
                          dragStartPageYRef.current = e.nativeEvent.pageY;
                          setDragIdx(idx);
                          setOverIdx(idx);
                        }}
                        onTouchEnd={() => {
                          // Only fires if PanResponder never claimed the gesture (tap, no drag)
                          if (dragIdxRef.current !== null) {
                            dragIdxRef.current = null;
                            setDragIdx(null);
                            setOverIdx(null);
                          }
                        }}
                      >
                        <Feather name="menu" size={22} color={isDragging ? GOLD : MUTED} />
                      </View>
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
          </View>
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
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", color: TEXT, fontSize: 16, fontWeight: "700" },
  hint: { color: MUTED, fontSize: 12, textAlign: "center", marginBottom: 4, paddingHorizontal: 20 },
  row: {
    height: DRAG_ROW_H, flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.30)",
  },
  rowActive: { backgroundColor: "rgba(212,175,55,0.12)", opacity: 0.7 },
  dragHandle: { width: 56, height: DRAG_ROW_H, alignItems: "center", justifyContent: "center" },
  thumb: { width: 44, height: 44, borderRadius: 6 },
  rowTitle: { color: TEXT, fontSize: 14, fontWeight: "600", lineHeight: 18 },
  dropLine: { height: 3, backgroundColor: GOLD, marginHorizontal: 16, borderRadius: 2 },
  saveBtn: {
    margin: 16, height: 50, borderRadius: 14, backgroundColor: GOLD,
    alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { color: "#1B060F", fontSize: 15, fontWeight: "700" },
});

// ── EditInfoModal (Nombre y datos) ─────────────────────────────────────────
function EditInfoModal({ visible, playlist, onClose, onSave, onChangeCover, onDelete }: {
  visible: boolean;
  playlist: { id: string; name: string; description?: string; coverUri?: string; coverType?: string };
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  onChangeCover: () => void;
  onDelete: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (visible) { setName(playlist.name); setDesc(playlist.description ?? ""); }
  }, [visible, playlist.name, playlist.description]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), desc.trim());
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={eiSt.backdrop}>
        <View style={[eiSt.sheet, { paddingBottom: bottomPad }]}>
          <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />
          <View style={eiSt.handle} />
          <View style={eiSt.header}>
            <Pressable onPress={onClose} hitSlop={12} style={eiSt.closeBtn}>
              <Feather name="x" size={20} color={MUTED} />
            </Pressable>
            <Text style={eiSt.title}>Nombre y datos</Text>
            <Pressable onPress={handleSave} hitSlop={12}>
              <Text style={eiSt.saveText}>Guardar</Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Portada */}
            <Pressable style={({ pressed }) => [eiSt.coverRow, { opacity: pressed ? 0.7 : 1 }]} onPress={onChangeCover}>
              <View style={eiSt.coverThumb}>
                {playlist.coverUri ? (
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
              placeholder="Nombre de la playlist"
              placeholderTextColor={MUTED}
              returnKeyType="next"
              maxLength={80}
            />

            {/* Descripción */}
            <Text style={eiSt.fieldLabel}>Descripción</Text>
            <TextInput
              style={[eiSt.input, eiSt.inputMulti]}
              value={desc}
              onChangeText={setDesc}
              placeholder="Agrega una descripción opcional"
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={3}
              maxLength={300}
            />

            {/* Eliminar */}
            <Pressable
              style={({ pressed }) => [eiSt.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => { onClose(); setTimeout(onDelete, 300); }}
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
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", color: TEXT, fontSize: 16, fontWeight: "700" },
  saveText: { color: GOLD, fontSize: 15, fontWeight: "700" },
  coverRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14, marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.35)",
  },
  coverThumb: {
    width: 52, height: 52, borderRadius: 8, overflow: "hidden",
    backgroundColor: "rgba(212,175,55,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  coverLabel: { color: TEXT, fontSize: 14, fontWeight: "600" },
  coverSub: { color: MUTED, fontSize: 12, marginTop: 2 },
  fieldLabel: { color: MUTED, fontSize: 12, fontWeight: "600", marginTop: 16, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "rgba(74,12,12,0.18)", borderRadius: 10, padding: 12,
    color: TEXT, fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(212,175,55,0.2)",
  },
  inputMulti: { height: 90, textAlignVertical: "top" },
  deleteBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginTop: 32, marginBottom: 8, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: "rgba(224,82,82,0.35)",
    backgroundColor: "rgba(224,82,82,0.08)",
  },
  deleteBtnText: { color: "#E05252", fontSize: 15, fontWeight: "600" },
});

// ─── Playlist MiniPlayer styles ────────────────────────────────────────────────
const mpSt = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 100,
    elevation: 100,
  },
  cover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "700",
  },
  artist: {
    color: MUTED,
    fontSize: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
