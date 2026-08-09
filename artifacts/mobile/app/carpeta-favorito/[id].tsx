import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradientFill } from "@/components/GoldGradient";
import React, { useState } from "react";
import {
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

import { type FavFolder, useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { SESSIONS } from "@/data/sessions";
import { SessionCard } from "@/components/SessionCard";
import { FavoriteActionsSheet } from "@/components/FavoriteActionsSheet";

const BG = ["#340D1A", "#190913"] as const;
const GOLD = "#F9F9F9";
const TEXT = "#FAF0EE";
const MUTED = "#c2c2c2";
const SHEET_BG = "#1B060F";

export default function CarpetaFavoritoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const bgColors = theme.gradient as unknown as [string, string];
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    favFolders,
    removeFromFavFolder,
    createFavFolder,
    addFavFolderToFolder,
    removeFavFolderFromFolder,
  } = useFoldersPlaylists();

  const [actionsItemId, setActionsItemId] = useState<string | null>(null);
  const [actionsItemKind, setActionsItemKind] = useState<"session" | "folder" | null>(null);
  const [nombreCarpetaVisible, setNombreCarpetaVisible] = useState(false);

  const folder = favFolders.find((f) => f.id === id);

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

  const folderSessions = folder.sessionIds
    .map((sid) => SESSIONS.find((s) => s.id === sid))
    .filter(Boolean) as typeof SESSIONS;

  const subFolderIds = folder.subFolderIds ?? [];
  const subFolders = subFolderIds
    .map((fid) => favFolders.find((f) => f.id === fid))
    .filter(Boolean) as FavFolder[];

  const handleCreateSubFolder = (name: string) => {
    const sub = createFavFolder(name);
    addFavFolderToFolder(folder.id, sub.id);
    setNombreCarpetaVisible(false);
    router.push(`/carpeta-favorito/${sub.id}` as never);
  };

  return (
    <LinearGradient style={styles.root} colors={bgColors}>
      <StatusBar hidden />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} style={{ marginLeft: 10 }} />
        <Text style={styles.headerName} numberOfLines={1}>{folder.name}</Text>
        <Pressable
          style={styles.iconBtn}
          hitSlop={10}
          onPress={() => { setActionsItemId(folder.id); setActionsItemKind("folder"); }}
        >
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
        {subFolders.length === 0 && folderSessions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Esta carpeta está vacía</Text>
            <Text style={styles.emptySub}>Mueve favoritos o crea carpetas aquí desde Tu biblioteca.</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 15, gap: 9 }}>
            {subFolders.map((sub) => (
              <Pressable
                key={sub.id}
                style={({ pressed }) => [styles.folderRow, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push(`/carpeta-favorito/${sub.id}` as never)}
                onLongPress={() => { setActionsItemId(sub.id); setActionsItemKind("folder"); }}
                delayLongPress={600}
              >
                <View style={styles.folderCover}>
                  <Feather name="folder" size={18} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.plName} numberOfLines={1}>{sub.name}</Text>
                  <Text style={styles.plMeta}>
                    Carpeta · {(sub.subFolderIds ?? []).length + sub.sessionIds.length} elemento{(sub.subFolderIds ?? []).length + sub.sessionIds.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => removeFavFolderFromFolder(folder.id, sub.id)}
                  hitSlop={10}
                  style={styles.removeBtn}
                >
                  <Feather name="x" size={16} color={MUTED} />
                </Pressable>
              </Pressable>
            ))}

            {folderSessions.map((s) => (
              <View key={s.id} style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <SessionCard
                    session={s}
                    horizontal
                    thumbWidth={65}
                    thumbHeight={64}
                    thumbRadius={6}
                    showDuration={false}
                    showAuthorAvatar={false}
                    onLongPress={() => { setActionsItemId(s.id); setActionsItemKind("session"); }}
                  />
                </View>
                <Pressable
                  onPress={() => removeFromFavFolder(folder.id, s.id)}
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
        defaultName={`Mi carpeta n.° ${favFolders.length + 1}`}
        onClose={() => setNombreCarpetaVisible(false)}
        onCreate={handleCreateSubFolder}
      />

      <FavoriteActionsSheet
        itemId={actionsItemId}
        itemKind={actionsItemKind}
        visible={actionsItemId !== null}
        onClose={() => { setActionsItemId(null); setActionsItemKind(null); }}
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
