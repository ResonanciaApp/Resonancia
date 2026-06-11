import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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

const BG = ["#090D20", "#080A18", "#06070F"] as const;
const GOLD = "#BE9650";
const TEXT = "#EDE1D3";
const MUTED = "#7A8FA8";
const SHEET_BG = "#0E1326";

export default function CarpetaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    folders,
    playlists: allPlaylists,
    deleteFolder,
    renameFolder,
    addPlaylistToFolder,
    removePlaylistFromFolder,
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
    setNombreCarpetaVisible(false);
    router.push(`/carpeta/${sub.id}` as never);
  };

  return (
    <LinearGradient style={styles.root} colors={BG} locations={[0, 0.5, 1]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="chevron-left" size={26} color={TEXT} />
        </Pressable>
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
        {folderPlaylists.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Esta carpeta está vacía</Text>
            <Text style={styles.emptySub}>Agrega playlists desde Tu biblioteca.</Text>
          </View>
        ) : (
          <View style={{ paddingTop: 12 }}>
            {folderPlaylists.map((pl) => (
              <Pressable
                key={pl.id}
                style={({ pressed }) => [styles.playlistRow, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push(`/playlist/${pl.id}` as never)}
              >
                <View style={styles.plCover}>
                  <Feather name="music" size={18} color={MUTED} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plName} numberOfLines={1}>{pl.name}</Text>
                  <Text style={styles.plMeta}>
                    Playlist · {pl.sessionIds.length} sesión{pl.sessionIds.length !== 1 ? "es" : ""}
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
        title="Ponle un nombre a tu playlist"
        defaultName={`Mi playlist n.° ${allPlaylists.length + 1}`}
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
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const ITEMS = [
    { icon: "music" as const,  title: "Playlist",  sub: "Crea una playlist con canciones o episodios", onPress: onPlaylist },
    { icon: "folder" as const, title: "Carpeta",   sub: "Organiza tus playlists", onPress: onCarpeta },
  ];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
        <View style={styles.sheetHandle} />
        {ITEMS.map((it) => (
          <Pressable
            key={it.title}
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.75 : 1 }]}
            onPress={it.onPress}
          >
            <View style={styles.sheetIconWrap}>
              <Feather name={it.icon} size={22} color={TEXT} />
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
        <View style={styles.nameCard}>
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
    flex: 1,
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  renameInput: {
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
    color: TEXT,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySub: {
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
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  plCover: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "rgba(190,150,80,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(190,150,80,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  plName: { color: TEXT, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  plMeta: { color: MUTED, fontSize: 12, marginTop: 2 },
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
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 8,
    marginTop: 4,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  sheetIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetItemTitle: { color: TEXT, fontSize: 16, fontWeight: "700" },
  sheetItemSub: { color: MUTED, fontSize: 13, marginTop: 2 },

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
    backgroundColor: "#14192B",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(190,150,80,0.15)",
  },
  nameCloseBtn: { alignSelf: "flex-end", marginBottom: 8 },
  nameCardTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  nameInputWrap: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
  },
  nameInput: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    padding: 0,
  },
  nameCreateBtn: {
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  nameCreateBtnText: {
    color: "#0B0F14",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
