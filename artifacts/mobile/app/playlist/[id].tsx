import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type Session } from "@/data/sessions";
import { getGuideById } from "@/data/guides";
import { GEOMETRIES } from "@/data/geometries";

const BG = "#080B1A"; // mismo color que Inicio
const GOLD = "#BE9650";
const TEXT = "#EDE1D3";
const MUTED = "#7A8FA8";

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
  const { playlists, deletePlaylist, removeFromPlaylist, addToPlaylist, renamePlaylist, setPlaylistCover, setPlaylistCoverGeometry } = useFoldersPlaylists();
  const { playSession } = usePlayer();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [actionsSession, setActionsSession] = useState<Session | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [coverModalVisible, setCoverModalVisible] = useState(false);

  const playlist = playlists.find((p) => p.id === id);

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
      <View style={[styles.root, { backgroundColor: BG }]}>
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
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
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
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          {/* Cover art — tap para elegir foto o geometría */}
          <Pressable style={styles.cover} onPress={() => setCoverModalVisible(true)}>
            {playlist.coverType === "geometrix" && playlist.coverGeometryId ? (
              <View style={styles.coverGlyph}>
                <SacredGlyph
                  id={playlist.coverGeometryId}
                  color={GOLD}
                  size={80}
                  strokeWidth={1.2}
                  opacity={1}
                />
              </View>
            ) : playlist.coverUri ? (
              <Image
                source={{ uri: playlist.coverUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <Feather name="music" size={40} color={MUTED} />
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
              <View style={styles.creatorDot} />
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
              <Feather name="play" size={20} color="#090F17" />
            </Pressable>
          )}
        </View>

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
        onPickImage={async () => {
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
        onPickGeometry={(geoId) => setPlaylistCoverGeometry(playlist.id, geoId)}
      />
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
    backgroundColor: "rgba(190,150,80,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(190,150,80,0.2)",
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
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  cambiarBtnText: { color: TEXT, fontSize: 13, fontWeight: "600" },
  creatorRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  creatorDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: GOLD },
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
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },

  // Add button
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
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
  },

  // Session rows
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  orderNum: { width: 20, fontSize: 13, textAlign: "center", fontWeight: "600", color: MUTED },
  thumb: { width: 52, height: 52, borderRadius: 8 },
  rowName: { color: TEXT, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  rowMeta: { color: MUTED, fontSize: 12, marginTop: 2 },
  moreBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  removeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  addIconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  // Cover glyph
  coverGlyph: { flex: 1, alignItems: "center", justifyContent: "center" },
});

// ── CoverPickerModal ───────────────────────────────────────────────────────
function CoverPickerModal({
  visible,
  onClose,
  onPickImage,
  onPickGeometry,
}: {
  visible: boolean;
  onClose: () => void;
  onPickImage: () => void;
  onPickGeometry: (geoId: string) => void;
}) {
  const [showGeometries, setShowGeometries] = useState(false);
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

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
          onPress={() => { onPickImage(); onClose(); }}
        >
          <Feather name="image" size={22} color={GOLD} />
          <Text style={modalStyles.sheetRowText}>Foto de la galería</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [modalStyles.sheetRow, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => setShowGeometries(true)}
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
    backgroundColor: "#0E1326",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: "center",
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
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
    borderBottomColor: "rgba(255,255,255,0.08)",
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
    backgroundColor: "rgba(190,150,80,0.05)",
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
});
