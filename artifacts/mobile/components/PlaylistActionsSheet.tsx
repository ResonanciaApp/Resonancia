import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useFoldersPlaylists,
} from "@/context/FoldersPlaylistsContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

const GOLD = "#dad4ec";

type Props = {
  itemId: string | null;
  itemKind: "playlist" | "folder" | null;
  visible: boolean;
  onClose: () => void;
};

type Step = "main" | "folders" | "rename";

type Colors = ReturnType<typeof import("@/hooks/useColors").useColors>;

function ActionRow({
  icon,
  label,
  iconColor,
  onPress,
  last,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  iconColor?: string;
  onPress: () => void;
  last?: boolean;
  colors: Colors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.40)" },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon} size={20} color={iconColor ?? colors.foreground} style={styles.actionIcon} />
      <Text style={[styles.actionLabel, { color: iconColor ?? colors.foreground }]}>{label}</Text>
      <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.25)" />
    </Pressable>
  );
}

export function PlaylistActionsSheet({ itemId, itemKind, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme, activeSceneId } = useSceneTheme();
  const sheetGradient = activeSceneId === "tibet" ? (["#2d4081", "#2d4081"] as const) : theme.gradient;
  const {
    playlists,
    folders,
    deletePlaylist,
    deleteFolder,
    togglePinPlaylist,
    togglePinFolder,
    addPlaylistToFolder,
    isPlaylistInFolder,
    addFolderToFolder,
    isFolderInFolder,
    renameFolder,
  } = useFoldersPlaylists();

  const [step, setStep] = useState<Step>("main");
  const [renameInput, setRenameInput] = useState("");

  useEffect(() => {
    if (visible) setStep("main");
  }, [visible]);

  if (!itemId || !itemKind) return null;

  const playlist = itemKind === "playlist" ? playlists.find((p) => p.id === itemId) ?? null : null;
  const folder = itemKind === "folder" ? folders.find((f) => f.id === itemId) ?? null : null;
  const item = playlist ?? folder;

  if (!item) return null;

  const isPinned = item.pinned ?? false;
  const title = playlist?.name ?? folder?.name ?? "";

  const folderCount = folder?.playlistIds?.length ?? 0;
  const subtitle =
    itemKind === "playlist"
      ? "Ritual · Casa del Cuenco"
      : `Carpeta · ${folderCount === 0 ? "Vacía" : `${folderCount} ritual${folderCount !== 1 ? "es" : ""}`}`;

  const handlePin = () => {
    if (itemKind === "playlist") togglePinPlaylist(itemId);
    else togglePinFolder(itemId);
    onClose();
  };

  const handleDelete = () => {
    const label = itemKind === "playlist" ? "playlist" : "carpeta";
    Alert.alert(`Eliminar ${label}`, `¿Eliminar "${title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          onClose();
          if (itemKind === "playlist") deletePlaylist(itemId);
          else deleteFolder(itemId);
        },
      },
    ]);
  };

  const getDescendantFolderIds = (folderId: string): Set<string> => {
    const result = new Set<string>();
    const visit = (id: string) => {
      const f = folders.find((x) => x.id === id);
      for (const subId of f?.subFolderIds ?? []) {
        if (!result.has(subId)) {
          result.add(subId);
          visit(subId);
        }
      }
    };
    visit(folderId);
    return result;
  };

  const eligibleFolders =
    itemKind === "folder"
      ? folders.filter((f) => f.id !== itemId && !getDescendantFolderIds(itemId).has(f.id))
      : folders;

  const handleStartRename = () => {
    setRenameInput(title);
    setStep("rename");
  };

  const handleConfirmRename = () => {
    const trimmed = renameInput.trim();
    if (trimmed) renameFolder(itemId, trimmed);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
        <LinearGradient colors={sheetGradient} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={styles.handle} />

        {step === "main" ? (
          <>
            <View style={styles.header}>
              <View style={styles.iconBox}>
                <Feather
                  name={itemKind === "folder" ? "folder" : "list"}
                  size={22}
                  color={GOLD}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {title}
                </Text>
                <Text style={[styles.itemSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={[styles.divider, { backgroundColor: "rgba(61,14,22,0.40)" }]} />

            <ActionRow
              icon="bookmark"
              label={isPinned ? "Desfijar" : itemKind === "playlist" ? "Fijar playlist" : "Fijar carpeta"}
              iconColor={isPinned ? GOLD : undefined}
              onPress={handlePin}
              colors={colors}
            />
            <ActionRow
              icon="folder"
              label="Mover a una carpeta"
              onPress={() => setStep("folders")}
              colors={colors}
            />
            {itemKind === "folder" && (
              <ActionRow
                icon="edit-2"
                label="Renombrar la carpeta"
                onPress={handleStartRename}
                colors={colors}
              />
            )}
            <ActionRow
              icon="trash-2"
              label={itemKind === "playlist" ? "Eliminar playlist" : "Eliminar carpeta"}
              onPress={handleDelete}
              colors={colors}
              last
            />
          </>
        ) : step === "folders" ? (
          <>
            <View style={styles.header}>
              <Pressable onPress={() => setStep("main")} style={styles.closeBtn}>
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.itemTitle, { color: colors.foreground, flex: 1 }]}>
                Mover a carpeta
              </Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={[styles.divider, { backgroundColor: "rgba(61,14,22,0.40)" }]} />

            <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {eligibleFolders.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Todavía no tenés ninguna carpeta
                </Text>
              ) : (
                eligibleFolders.map((f) => {
                  const inIt =
                    itemKind === "playlist"
                      ? isPlaylistInFolder(f.id, itemId)
                      : isFolderInFolder(f.id, itemId);
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => {
                        if (itemKind === "playlist") addPlaylistToFolder(f.id, itemId);
                        else addFolderToFolder(f.id, itemId);
                        onClose();
                      }}
                      style={({ pressed }) => [styles.folderRow, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View style={styles.folderIconBox}>
                        <Feather name="folder" size={18} color={GOLD} />
                      </View>
                      <Text
                        style={[styles.folderLabel, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {f.name}
                      </Text>
                      {inIt && <Feather name="check" size={16} color={GOLD} />}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Pressable onPress={() => setStep("main")} style={styles.closeBtn}>
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.itemTitle, { color: colors.foreground, flex: 1 }]}>
                Renombrar la carpeta
              </Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={[styles.divider, { backgroundColor: "rgba(61,14,22,0.40)" }]} />

            <TextInput
              value={renameInput}
              onChangeText={setRenameInput}
              placeholder="Nombre de la carpeta"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.renameInput, {
                color: colors.foreground,
                borderColor: "rgba(61,14,22,0.40)",
                backgroundColor: "rgba(74,12,12,0.08)",
              }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirmRename}
              maxLength={40}
            />

            <Pressable
              onPress={handleConfirmRename}
              disabled={!renameInput.trim()}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: renameInput.trim() ? GOLD : "rgba(190,150,80,0.30)", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.saveBtnLabel}>Guardar</Text>
            </Pressable>
          </>
        )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.055)",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.055)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 2,
  },
  itemSub: {
    fontFamily: "Manrope",
    fontSize: 13,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  actionIcon: {
    width: 30,
    marginRight: 14,
  },
  actionLabel: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 16,
  },
  emptyText: {
    fontFamily: "Manrope",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  folderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(190,150,80,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  folderLabel: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  renameInput: {
    fontFamily: "Manrope",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 4,
  },
  saveBtnLabel: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#1B060F",
  },
});
