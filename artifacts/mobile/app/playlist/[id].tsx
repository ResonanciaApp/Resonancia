import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type Session } from "@/data/sessions";
import { getGuideById } from "@/data/guides";
import { GEOMETRIES, type GeometryId } from "@/data/geometries";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";

const BG_GRADIENT = ["#2E0510", "#160108"] as const;
const GOLD = "#D4AF37";
const TEXT = "#F4DAD5";
const MUTED = "rgba(242,231,228,0.45)";
const DEFAULT_PANEL_BG = "rgba(74,12,12,0.28)";

const ACCENT_PALETTE = [
  "#7B2D52", // borgoña
  "#2C4A8C", // azul marino
  "#2C6B4A", // verde
  "#6B2C8C", // violeta
  "#8C4A2C", // terra
  "#2C6B7B", // teal
  "#8C7B2C", // dorado
  "#4A1C8C", // índigo
] as const;

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
  const { playlists, deletePlaylist, removeFromPlaylist, addToPlaylist, renamePlaylist, setPlaylistCover, setPlaylistCoverColor, setPlaylistCoverGeometry, setPlaylistCoverCreation } = useFoldersPlaylists();
  const { playSession, pauseResume, isPlaying, currentSession } = usePlayer();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [actionsSession, setActionsSession] = useState<Session | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [coverModalVisible, setCoverModalVisible] = useState(false);
  const [pendingCoverUri, setPendingCoverUri] = useState<string | null>(null);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState<string>(ACCENT_PALETTE[0]);

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

  const handleRename = () => {
    if (!nameInput.trim()) { setRenaming(false); return; }
    renamePlaylist(playlist.id, nameInput.trim());
    setRenaming(false);
  };

  const handlePlayAll = () => {
    const first = sessions.find((s) => !s.isPremium || isPremium);
    if (!first) return;
    playSession(first);
    router.push("/player" as never);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: panelColor }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={TEXT} />
        </Pressable>
        <Pressable onPress={handleDelete} style={[styles.iconBtn, { marginLeft: "auto" }]} hitSlop={8}>
          <Feather name="trash-2" size={18} color={MUTED} />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Panel superior (segundo fondo con fade) ─────────────────────── */}
        <View style={styles.topPanel}>
          <LinearGradient
            colors={[panelColor, "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Cover art — tap para elegir foto o geometría */}
          <Pressable style={styles.cover} onPress={() => setCoverModalVisible(true)}>
            {playlist.coverType === "geometrix" && playlist.coverGeometryId ? (
              <View style={styles.coverGlyph}>
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
            {renaming ? (
              <TextInput
                style={styles.renameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleRename}
                onBlur={handleRename}
                selectTextOnFocus
              />
            ) : (
              <Text style={styles.playlistName} numberOfLines={3}>{playlist.name}</Text>
            )}
            <Pressable
              style={styles.cambiarBtn}
              onPress={() => { setNameInput(playlist.name); setRenaming(true); }}
            >
              <Text style={styles.cambiarBtnText}>Cambiar</Text>
            </Pressable>
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

        {/* Actions */}
        <View style={styles.actionsRow}>
          {sessions.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.playAllFab, { opacity: pressed ? 0.8 : 1 }]}
              onPress={handlePlayAll}
            >
              <GoldGradientFill />
              <Feather name="play" size={20} color="#1B060F" />
            </Pressable>
          )}
        </View>

        </View>{/* fin topPanel */}

        {/* + Agregar a esta playlist */}
        <Pressable
          style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={() => setAddSheetVisible(true)}
        >
          <Feather name="plus" size={16} color={TEXT} style={{ marginRight: 8 }} />
          <Text style={styles.addBtnText}>Agregar a esta playlist</Text>
        </Pressable>

        {/* Sessions list */}
        {sessions.map((session, idx) => (
          <PlaylistSessionRow
            key={session.id}
            session={session}
            index={idx + 1}
            isPremium={isPremium}
            onPlay={() => { playSession(session); router.push("/player" as never); }}
            onActionsPress={() => setActionsSession(session)}
            onRemove={() => removeFromPlaylist(playlist.id, session.id)}
          />
        ))}

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
            setPendingCoverUri(result.assets[0].uri);
            setSelectedAccent(playlist.coverColor ?? ACCENT_PALETTE[0]);
            setColorPickerVisible(true);
          }
        }}
        onPickGeometry={(geoId) => setPlaylistCoverGeometry(playlist.id, geoId)}
        onPickCreation={(cid) => setPlaylistCoverCreation(playlist.id, cid)}
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
            <Text style={cpStyles.title}>Tono del encabezado</Text>
            <Text style={cpStyles.sub}>Elige el color que combina con tu foto</Text>

            {/* Preview del header con el color seleccionado */}
            <View style={[cpStyles.preview, { backgroundColor: buildPanelColor(selectedAccent) }]}>
              {pendingCoverUri && (
                <Image source={{ uri: pendingCoverUri }} style={cpStyles.previewImg} contentFit="cover" />
              )}
              <View style={[StyleSheet.absoluteFill, { backgroundColor: buildPanelColor(selectedAccent), opacity: 0.7 }]} />
              <Text style={cpStyles.previewLabel}>Vista previa</Text>
            </View>

            {/* Paleta de colores */}
            <View style={cpStyles.palette}>
              {ACCENT_PALETTE.map((hex) => (
                <Pressable
                  key={hex}
                  onPress={() => setSelectedAccent(hex)}
                  style={[
                    cpStyles.swatch,
                    { backgroundColor: hex },
                    selectedAccent === hex && cpStyles.swatchSelected,
                  ]}
                />
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
                  if (pendingCoverUri) {
                    setPlaylistCover(playlist.id, pendingCoverUri);
                    setPlaylistCoverColor(playlist.id, selectedAccent);
                  }
                  setColorPickerVisible(false);
                  setPendingCoverUri(null);
                }}
              >
                <Text style={cpStyles.btnConfirmText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Playlist session row ──────────────────────────────────────────────────────
function PlaylistSessionRow({
  session, index, isPremium, onPlay, onActionsPress, onRemove,
}: {
  session: Session; index: number; isPremium: boolean;
  onPlay: () => void; onActionsPress: () => void; onRemove: () => void;
}) {
  const locked = !!session.isPremium && !isPremium;
  const guide = session.guideId ? getGuideById(session.guideId) : null;
  const author = guide?.name ?? "Casa del Cuenco";

  return (
    <View style={styles.sessionRow}>
      <Text style={styles.orderNum}>{index}</Text>
      <Pressable onPress={locked ? () => router.push("/membresia" as never) : onPlay}
        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}>
        <Image source={session.image as never} style={styles.thumb}
          placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} contentFit="cover" />
      </Pressable>
      <Pressable onPress={locked ? () => router.push("/membresia" as never) : onPlay}
        style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.75 : 1 }]}>
        <Text style={styles.rowName} numberOfLines={2}>{session.title}</Text>
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
  root: { flex: 1 },

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
  playlistName: { color: TEXT, fontSize: 20, fontWeight: "800", lineHeight: 26 },
  renameInput: {
    color: TEXT, fontSize: 20, fontWeight: "800",
    borderBottomWidth: 1.5, borderBottomColor: GOLD, paddingVertical: 2, padding: 0,
  },
  cambiarBtn: {
    backgroundColor: "rgba(74,12,12,0.08)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  cambiarBtnText: { color: TEXT, fontSize: 13, fontWeight: "600" },
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

  // Actions
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  playAllFab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  // Top panel (segundo fondo con fade)
  topPanel: {
    overflow: "hidden",
    paddingBottom: 72,
  },

  // Add button
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: -5,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(61,14,22,0.40)",
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
  const [geoTab, setGeoTab] = useState<"library" | "creations">("creations");
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
        <View style={[modalStyles.sheet, { paddingBottom: bottomPad }]}>
          <View style={modalStyles.handle} />
          <View style={modalStyles.headerRow}>
            <Pressable onPress={() => setShowGeometries(false)} hitSlop={12} style={modalStyles.headerClose}>
              <Feather name="arrow-left" size={20} color={MUTED} />
            </Pressable>
            <Text style={modalStyles.headerTitle}>Elige una geometría</Text>
            <View style={modalStyles.headerSpacer} />
          </View>
          {/* Tabs */}
          <View style={modalStyles.tabRow}>
            <Pressable
              style={[modalStyles.tab, geoTab === "library" && modalStyles.tabActive]}
              onPress={() => setGeoTab("library")}
            >
              <Text style={[modalStyles.tabText, geoTab === "library" && modalStyles.tabTextActive]}>Biblioteca</Text>
            </Pressable>
            <Pressable
              style={[modalStyles.tab, geoTab === "creations" && modalStyles.tabActive]}
              onPress={() => setGeoTab("creations")}
            >
              <Text style={[modalStyles.tabText, geoTab === "creations" && modalStyles.tabTextActive]}>Mis creaciones</Text>
            </Pressable>
          </View>
          {geoTab === "library" ? (
            <FlatList
              data={GEOMETRIES}
              keyExtractor={(g) => g.id}
              numColumns={3}
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 12 }}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [modalStyles.geometryItem, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => { onPickGeometry(item.id); setShowGeometries(false); onClose(); }}
                >
                  <View style={modalStyles.geometryThumb}>
                    <SacredGlyph id={item.id as any} color={item.color} size={56} strokeWidth={1} opacity={1} />
                  </View>
                  <Text style={modalStyles.geometryName} numberOfLines={1}>{item.name}</Text>
                </Pressable>
              )}
            />
          ) : (
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
          )}
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />
      <View style={[modalStyles.sheet, { paddingBottom: bottomPad }]}>
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
          onPress={() => { setGeoTab("creations"); setShowGeometries(true); }}
        >
          <Feather name="hexagon" size={22} color={GOLD} />
          <Text style={modalStyles.sheetRowText}>Geometría sagrada</Text>
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
    backgroundColor: "#2E0510",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
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
  geometryItem: {
    flex: 1,
    alignItems: "center",
    margin: 6,
    paddingVertical: 12,
    backgroundColor: "rgba(212,175,55,0.05)",
    borderRadius: 12,
  },
  geometryThumb: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  geometryName: {
    color: TEXT,
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  tabActive: {
    backgroundColor: "rgba(212,175,55,0.15)",
  },
  tabText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: GOLD,
  },
  creationItem: {
    flex: 1,
    alignItems: "center",
    margin: 6,
    paddingVertical: 10,
    backgroundColor: "rgba(212,175,55,0.05)",
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
