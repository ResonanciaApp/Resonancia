import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradientFill } from "@/components/GoldGradient";
import React, { useState } from "react";
import {
  Alert,
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

import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { CreationCoverPreview } from "@/components/CreationCoverPreview";
import { SacredGlyph } from "@/components/SacredGlyph";
import { baseOf, type GeometryId } from "@/data/geometries";

const BG_FALLBACK = ["#340D1A", "#190913"] as const;
const GOLD = "#F9F9F9";
const TEXT = "#FAF0EE";
const MUTED = "#c2c2c2";
const SHEET_BG = "#1B060F";

export default function CarpetaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme: sceneTheme } = useSceneTheme();
  const BG = sceneTheme.gradient;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    folders,
    playlists: allPlaylists,
    deleteFolder,
    renameFolder,
    addPlaylistToFolder,
    removePlaylistFromFolder,
    addFolderToFolder,
    removeFolderFromFolder,
    createPlaylist,
    createFolder,
  } = useFoldersPlaylists();

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nombrePlaylistVisible, setNombrePlaylistVisible] = useState(false);
  const [nombreCarpetaVisible, setNombreCarpetaVisible] = useState(false);

  const folder = folders.find((f) => f.id === id);

  if (!folder) {
    return (
      <LinearGradient colors={BG} style={styles.root}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Feather name="folder" size={48} color={MUTED} style={{ marginBottom: 16 }} />
          <Text style={{ color: MUTED, fontSize: 16 }}>Carpeta no encontrada</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
            <Text style={{ color: GOLD, fontSize: 15 }}>← Volver</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const folderPlaylistIds = folder.playlistIds ?? [];
  const folderPlaylists = folderPlaylistIds
    .map((pid) => allPlaylists.find((p) => p.id === pid))
    .filter(Boolean) as typeof allPlaylists;

  const subFolderIds = folder.subFolderIds ?? [];
  const subFolders = subFolderIds
    .map((fid) => folders.find((f) => f.id === fid))
    .filter(Boolean) as typeof folders;

  const handleDelete = () => {
    Alert.alert(
      "Eliminar carpeta",
      `¿Eliminar "${folder.name}"? Las playlists no se borran.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => { deleteFolder(folder.id); router.back(); } },
      ]
    );
  };

  const handleRename = () => {
    if (!nameInput.trim()) { setRenaming(false); return; }
    renameFolder(folder.id, nameInput.trim());
    setRenaming(false);
  };

  const handleCreatePlaylist = (name: string) => {
    const pl = createPlaylist(name);
    addPlaylistToFolder(folder.id, pl.id);
    setNombrePlaylistVisible(false);
    router.push(`/playlist/${pl.id}` as never);
  };

  const handleCreateSubFolder = (name: string) => {
    const sub = createFolder(name);
    addFolderToFolder(folder!.id, sub.id);
    setNombreCarpetaVisible(false);
    router.push(`/carpeta/${sub.id}` as never);
  };

  return (
    <LinearGradient style={styles.root} colors={BG} locations={[0, 0.5, 1]}>
      <StatusBar hidden />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
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
          <Text style={styles.headerName} numberOfLines={1}>{folder.name}</Text>
        )}
        <Pressable
          style={styles.iconBtn}
          hitSlop={10}
          onPress={() => {
            Alert.alert(folder.name, "Opciones", [
              { text: "Cambiar nombre", onPress: () => { setNameInput(folder.name); setRenaming(true); } },
              { text: "Eliminar carpeta", style: "destructive", onPress: handleDelete },
              { text: "Cancelar", style: "cancel" },
            ]);
          }}
        >
          <Feather name="more-horizontal" size={22} color={TEXT} />
        </Pressable>
        <Pressable style={styles.iconBtn} hitSlop={10} onPress={() => setAddSheetVisible(true)}>
          <Feather name="plus" size={22} color={TEXT} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {subFolders.length === 0 && folderPlaylists.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Esta carpeta está vacía</Text>
            <Text style={styles.emptySub}>Agrega playlists o carpetas desde Tu biblioteca.</Text>
          </View>
        ) : (
          <View style={{ paddingTop: 12 }}>
            {/* Subcarpetas */}
            {subFolders.map((sub) => (
              <Pressable
                key={sub.id}
                style={({ pressed }) => [styles.playlistRow, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push(`/carpeta/${sub.id}` as never)}
              >
                <View style={styles.plCover}>
                  <Feather name="folder" size={18} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plName} numberOfLines={1}>{sub.name}</Text>
                  <Text style={styles.plMeta}>
                    Carpeta · {(sub.subFolderIds ?? []).length + (sub.playlistIds ?? []).length} elemento{(sub.subFolderIds ?? []).length + (sub.playlistIds ?? []).length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => removeFolderFromFolder(folder.id, sub.id)}
                  hitSlop={10}
                  style={styles.removePlBtn}
                >
                  <Feather name="x" size={16} color={MUTED} />
                </Pressable>
              </Pressable>
            ))}

            {/* Playlists */}
            {folderPlaylists.map((pl) => (
              <Pressable
                key={pl.id}
                style={({ pressed }) => [styles.playlistRow, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push(`/playlist/${pl.id}` as never)}
              >
                <View style={styles.plCover}>
                  {pl.coverType === "geometrix" && pl.coverGeometryId ? (
                    <SacredGlyph id={pl.coverGeometryId as GeometryId} color={GOLD} size={28} strokeWidth={1.6} opacity={1} />
                  ) : pl.coverType === "creation" && pl.coverCreationId ? (
                    <CreationCoverPreview creationId={pl.coverCreationId} size={52} />
                  ) : pl.coverUri ? (
                    <Image source={{ uri: pl.coverUri }} style={{ width: 52, height: 52, borderRadius: 6 }} contentFit="cover" />
                  ) : (
                    <Feather name="music" size={18} color={MUTED} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plName} numberOfLines={1}>{pl.name}</Text>
                  <Text style={styles.plMeta}>
                    Ritual · {pl.sessionIds.length} sesión{pl.sessionIds.length !== 1 ? "es" : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => removePlaylistFromFolder(folder.id, pl.id)}
                  hitSlop={10}
                  style={styles.removePlBtn}
                >
                  <Feather name="x" size={16} color={MUTED} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add sheet */}
      <AddSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        onPlaylist={() => { setAddSheetVisible(false); setTimeout(() => setNombrePlaylistVisible(true), 250); }}
        onCarpeta={() => { setAddSheetVisible(false); setTimeout(() => setNombreCarpetaVisible(true), 250); }}
      />

      {/* Naming modals */}
      <NamingModal
        visible={nombrePlaylistVisible}
        title="Ponle un nombre a tu ritual"
        defaultName={`Mi Ritual n.° ${allPlaylists.length + 1}`}
        onClose={() => setNombrePlaylistVisible(false)}
        onCreate={handleCreatePlaylist}
      />
      <NamingModal
        visible={nombreCarpetaVisible}
        title="Ponle un nombre a la carpeta"
        defaultName={`Mi carpeta n.° ${folders.length + 1}`}
        onClose={() => setNombreCarpetaVisible(false)}
        onCreate={handleCreateSubFolder}
      />
    </LinearGradient>
  );
}

// ─── Add sheet ────────────────────────────────────────────────────────────────
function AddSheet({
  visible, onClose, onPlaylist, onCarpeta,
}: { visible: boolean; onClose: () => void; onPlaylist: () => void; onCarpeta: () => void }) {
  const insets = useSafeAreaInsets();
  const { activeSceneId } = useSceneTheme();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const ITEMS = [
    { icon: "music" as const,  title: "Ritual",  sub: "Crea un ritual con canciones o episodios", onPress: onPlaylist },
    { icon: "folder" as const, title: "Carpeta",   sub: "Organiza tus rituales", onPress: onCarpeta },
  ];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: bottomPad, backgroundColor: "#2d4081" }]}>
        <View style={styles.sheetHandle} />
        {ITEMS.map((it) => (
          <Pressable
            key={it.title}
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.75 : 1 }]}
            onPress={it.onPress}
          >
            <View style={styles.sheetIconWrap}>
              <Feather name={it.icon} size={22} color="#f9f9f9" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetItemTitle}>{it.title}</Text>
              <Text style={styles.sheetItemSub}>{it.sub}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

// ─── Naming modal ─────────────────────────────────────────────────────────────
function NamingModal({
  visible, title, defaultName, onClose, onCreate,
}: {
  visible: boolean; title: string; defaultName: string;
  onClose: () => void; onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const inputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    if (visible) setName(defaultName);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = () => {
    onCreate(name.trim() || defaultName);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onShow={() => setTimeout(() => inputRef.current?.focus(), 80)}
    >
      <View style={styles.nameOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.nameCard, { backgroundColor: "#2d4081" }]}>
          <Pressable style={styles.nameCloseBtn} onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={TEXT} />
          </Pressable>
          <Text style={styles.nameCardTitle}>{title}</Text>
          <View style={styles.nameInputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              placeholderTextColor={MUTED}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.nameCreateBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleCreate}
          >
            <GoldGradientFill />
            <Text style={styles.nameCreateBtnText}>Crear</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerName: {
    fontFamily: "Manrope",
    flex: 1,
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  renameInput: {
    fontFamily: "Manrope",
    flex: 1,
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: GOLD,
    paddingVertical: 2,
    padding: 0,
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 180,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySub: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Playlist row
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  plCover: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  plName: { fontFamily: "Manrope", color: TEXT, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  plMeta: { fontFamily: "Manrope", color: MUTED, fontSize: 12, marginTop: 2 },
  removePlBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  // Sheet
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 6,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginBottom: 8,
    marginTop: 4,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  sheetIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetItemTitle: { fontFamily: "Manrope", color: TEXT, fontSize: 16, fontWeight: "700" },
  sheetItemSub: { fontFamily: "Manrope", color: "#f4f4f4", fontSize: 13, marginTop: 2 },

  // Naming modal
  nameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  nameCard: {
    width: "100%",
    backgroundColor: "#190913",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.15)",
  },
  nameCloseBtn: { alignSelf: "flex-end", marginBottom: 8 },
  nameCardTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  nameInputWrap: {
    width: "100%",
    backgroundColor: "rgba(74,12,12,0.08)",
    borderRadius: 10,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
  },
  nameInput: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    padding: 0,
  },
  nameCreateBtn: {
    overflow: "hidden",
    borderRadius: 30,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  nameCreateBtnText: {
    fontFamily: "Manrope",
    color: "#1B060F",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
