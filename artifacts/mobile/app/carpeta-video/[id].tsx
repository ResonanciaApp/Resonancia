import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
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
import { useSceneTheme } from "@/context/SceneThemeContext";

import { type VideoFolder, useVideosState } from "@/context/VideosContext";
import { type VideoItem } from "@/data/videos";
import { useVideos } from "@/hooks/useVideos";
import { VideoCard } from "@/components/VideoCard";
import { VideoActionsSheet } from "@/components/VideoActionsSheet";

const BG = ["#340D1A", "#190913"] as const;
const GOLD = "#F9F9F9";
const TEXT = "#FAF0EE";
const MUTED = "#c2c2c2";

export default function CarpetaVideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { activeSceneId } = useSceneTheme();
  const bgColors = activeSceneId === "tibet" ? (["#2d4081", "#2d4081"] as const) : BG;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    videoFolders,
    createVideoFolder,
    renameVideoFolder,
    deleteVideoFolder,
    removeVideoFromFolder,
  } = useVideosState();
  const { videos: allVideos } = useVideos();

  const [actionsVideo, setActionsVideo] = useState<VideoItem | null>(null);
  const [nombreCarpetaVisible, setNombreCarpetaVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);

  const folder = videoFolders.find((f) => f.id === id);

  if (!folder) {
    return (
      <LinearGradient colors={bgColors} style={styles.root}>
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

  const folderVideos = folder.videoIds
    .map((vid) => allVideos.find((v) => v.id === vid))
    .filter(Boolean) as VideoItem[];

  const subFolders = (folder.subFolderIds ?? [])
    .map((fid) => videoFolders.find((f) => f.id === fid))
    .filter(Boolean) as VideoFolder[];

  const handleCreateSubFolder = (name: string) => {
    const sub = createVideoFolder(name, undefined, folder.id);
    setNombreCarpetaVisible(false);
    router.push(`/carpeta-video/${sub.id}` as never);
  };

  const handleDeleteFolder = () => {
    Alert.alert("Eliminar carpeta", `¿Eliminar "${folder.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deleteVideoFolder(folder.id);
          router.back();
        },
      },
    ]);
  };

  const handleFolderMenu = () => {
    Alert.alert(folder.name, undefined, [
      { text: "Cambiar nombre", onPress: () => setRenameVisible(true) },
      { text: "Eliminar carpeta", style: "destructive", onPress: handleDeleteFolder },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  return (
    <LinearGradient style={styles.root} colors={bgColors}>
      <StatusBar hidden />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={9} />
        <Text style={styles.headerName} numberOfLines={1}>{folder.name}</Text>
        <Pressable style={styles.iconBtn} hitSlop={10} onPress={handleFolderMenu}>
          <Feather name="more-horizontal" size={22} color={TEXT} />
        </Pressable>
        <Pressable style={styles.iconBtn} hitSlop={10} onPress={() => setNombreCarpetaVisible(true)}>
          <Feather name="plus" size={22} color={TEXT} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad + 40, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {subFolders.length === 0 && folderVideos.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Esta carpeta está vacía</Text>
            <Text style={styles.emptySub}>
              Añade videos desde el menú "..." de cualquier video, o crea subcarpetas con el botón +.
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 15, gap: 9 }}>
            {subFolders.map((sub) => (
              <Pressable
                key={sub.id}
                style={({ pressed }) => [styles.folderRow, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push(`/carpeta-video/${sub.id}` as never)}
              >
                <View style={styles.folderCover}>
                  <Feather name="folder" size={18} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plName} numberOfLines={1}>{sub.name}</Text>
                  <Text style={styles.plMeta}>
                    Carpeta · {(sub.subFolderIds ?? []).length + sub.videoIds.length} elemento{(sub.subFolderIds ?? []).length + sub.videoIds.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={MUTED} style={{ marginRight: 8 }} />
              </Pressable>
            ))}

            {folderVideos.map((v) => (
              <View key={v.id} style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <VideoCard
                    video={v}
                    horizontal
                    onOptionsPress={() => setActionsVideo(v)}
                  />
                </View>
                <Pressable
                  onPress={() => removeVideoFromFolder(folder.id, v.id)}
                  hitSlop={10}
                  style={styles.removeBtn}
                >
                  <Feather name="x" size={16} color={MUTED} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <NamingModal
        visible={nombreCarpetaVisible}
        title="Ponle un nombre a la carpeta"
        defaultName={`Mi carpeta n.° ${videoFolders.length + 1}`}
        onClose={() => setNombreCarpetaVisible(false)}
        onCreate={handleCreateSubFolder}
      />

      <NamingModal
        visible={renameVisible}
        title="Cambiar nombre de la carpeta"
        defaultName={folder.name}
        onClose={() => setRenameVisible(false)}
        onCreate={(name) => {
          renameVideoFolder(folder.id, name);
          setRenameVisible(false);
        }}
      />

      <VideoActionsSheet
        video={actionsVideo}
        visible={actionsVideo !== null}
        onClose={() => setActionsVideo(null)}
      />
    </LinearGradient>
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

  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
    gap: 12,
  },
  folderCover: {
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

  removeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

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
